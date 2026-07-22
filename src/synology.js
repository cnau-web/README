// Client minimal pour l'API Web Synology DSM (File Station).
// Compatible DSM 6.x et 7.x (SYNO.API.Auth v3, FileStation via entry.cgi).

const SESSION_NAME = 'FileStation';

export class SynologyClient {
  constructor({ baseUrl, account, password, insecureTls = false }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.account = account;
    this.password = password;
    this.sid = null;
    if (insecureTls) {
      // Uniquement pour un NAS joint en IP locale avec certificat auto-signé.
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
  }

  async login() {
    const url = new URL(`${this.baseUrl}/webapi/auth.cgi`);
    url.search = new URLSearchParams({
      api: 'SYNO.API.Auth',
      version: '3',
      method: 'login',
      account: this.account,
      passwd: this.password,
      session: SESSION_NAME,
      format: 'sid',
    }).toString();
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      throw new Error(`Échec de connexion DSM (code ${data.error?.code}). ` +
        'Vérifiez SYNO_URL, SYNO_ACCOUNT, SYNO_PASSWORD, et que le compte n\'a pas de 2FA.');
    }
    this.sid = data.data.sid;
    return this.sid;
  }

  async request(api, method, version, params = {}, { retry = true } = {}) {
    if (!this.sid) await this.login();
    const url = new URL(`${this.baseUrl}/webapi/entry.cgi`);
    url.search = new URLSearchParams({
      api,
      method,
      version: String(version),
      _sid: this.sid,
      ...params,
    }).toString();
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      const code = data.error?.code;
      // 105/106/107/119 : session invalide ou expirée → on retente après re-login.
      if (retry && [105, 106, 107, 119].includes(code)) {
        this.sid = null;
        return this.request(api, method, version, params, { retry: false });
      }
      throw new Error(`Erreur API Synology ${api}.${method} (code ${code})`);
    }
    return data.data;
  }

  async listShares() {
    const data = await this.request('SYNO.FileStation.List', 'list_share', 2, {
      additional: '["size","time"]',
    });
    return data.shares.map(fmtEntry);
  }

  async listFolder(path, { limit = 1000 } = {}) {
    const data = await this.request('SYNO.FileStation.List', 'list', 2, {
      folder_path: path,
      limit: String(limit),
      additional: '["size","time","type"]',
      sort_by: 'name',
    });
    return data.files.map(fmtEntry);
  }

  async search(folderPath, pattern, { timeoutMs = 60000 } = {}) {
    const start = await this.request('SYNO.FileStation.Search', 'start', 2, {
      folder_path: folderPath,
      pattern,
      recursive: 'true',
    });
    const taskid = start.taskid;
    try {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        const data = await this.request('SYNO.FileStation.Search', 'list', 2, {
          taskid,
          limit: '500',
          additional: '["size","time","type"]',
        });
        if (data.finished) return data.files.map(fmtEntry);
        if (Date.now() > deadline) {
          // Résultats partiels si la recherche est trop longue.
          return data.files.map(fmtEntry);
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    } finally {
      this.request('SYNO.FileStation.Search', 'stop', 2, { taskid }).catch(() => {});
    }
  }

  async download(path, maxBytes) {
    if (!this.sid) await this.login();
    const url = new URL(`${this.baseUrl}/webapi/entry.cgi`);
    url.search = new URLSearchParams({
      api: 'SYNO.FileStation.Download',
      method: 'download',
      version: '2',
      path,
      mode: 'download',
      _sid: this.sid,
    }).toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Téléchargement impossible (HTTP ${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) {
      throw new Error(`Fichier trop volumineux (${buf.length} octets > limite ${maxBytes}). ` +
        'Utilisez plutôt share_link pour obtenir un lien de téléchargement.');
    }
    return buf;
  }

  async shareLink(path, { expireDays = 7 } = {}) {
    const expire = new Date(Date.now() + expireDays * 86400000);
    const dateExpired = expire.toISOString().slice(0, 10);
    const data = await this.request('SYNO.FileStation.Sharing', 'create', 3, {
      path,
      date_expired: dateExpired,
    });
    return data.links.map((l) => ({ path: l.path, url: l.url, expires: dateExpired }));
  }
}

function fmtEntry(e) {
  const add = e.additional || {};
  return {
    name: e.name,
    path: e.path,
    isdir: e.isdir,
    size: add.size ?? null,
    modified: add.time?.mtime ? new Date(add.time.mtime * 1000).toISOString() : null,
  };
}
