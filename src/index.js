// Serveur MCP (Streamable HTTP) exposant le File Station d'un NAS Synology.
// À héberger sur le NAS (Docker) et à ajouter dans claude.ai comme connecteur
// personnalisé avec l'URL : https://<votre-domaine>/mcp/<MCP_TOKEN>

import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { SynologyClient } from './synology.js';

const {
  SYNO_URL,
  SYNO_ACCOUNT,
  SYNO_PASSWORD,
  SYNO_TLS_INSECURE,
  MCP_TOKEN,
  PORT = '8099',
  MAX_DOWNLOAD_MB = '15',
} = process.env;

for (const [name, value] of Object.entries({ SYNO_URL, SYNO_ACCOUNT, SYNO_PASSWORD, MCP_TOKEN })) {
  if (!value) {
    console.error(`Variable d'environnement manquante : ${name}`);
    process.exit(1);
  }
}
if (MCP_TOKEN.length < 24) {
  console.error('MCP_TOKEN trop court : utilisez au moins 24 caractères aléatoires (ex. `openssl rand -hex 24`).');
  process.exit(1);
}

const syno = new SynologyClient({
  baseUrl: SYNO_URL,
  account: SYNO_ACCOUNT,
  password: SYNO_PASSWORD,
  insecureTls: SYNO_TLS_INSECURE === '1',
});

const MAX_BYTES = Number(MAX_DOWNLOAD_MB) * 1024 * 1024;

const EXT_MIME = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  txt: 'text/plain',
  csv: 'text/csv',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function buildServer() {
  const server = new McpServer({
    name: 'synology-filestation',
    version: '1.0.0',
  });

  server.registerTool('list_shares', {
    description: 'Liste les dossiers partagés à la racine du NAS Synology.',
    inputSchema: {},
  }, async () => json(await syno.listShares()));

  server.registerTool('list_folder', {
    description: 'Liste le contenu d\'un dossier du NAS (chemin absolu, ex. "/copro/0039 - VOLTAIRE").',
    inputSchema: {
      path: z.string().describe('Chemin absolu du dossier, commençant par le nom du dossier partagé'),
    },
  }, async ({ path }) => json(await syno.listFolder(path)));

  server.registerTool('search_files', {
    description: 'Recherche récursive de fichiers/dossiers par motif de nom (jokers * autorisés) dans un dossier du NAS.',
    inputSchema: {
      folder_path: z.string().describe('Dossier de départ (chemin absolu, ex. "/copro")'),
      pattern: z.string().describe('Motif de nom, ex. "0039*" ou "*contrat*syndic*"'),
    },
  }, async ({ folder_path, pattern }) => json(await syno.search(folder_path, pattern)));

  server.registerTool('get_file', {
    description: `Télécharge un fichier du NAS (limite ${MAX_DOWNLOAD_MB} Mo) et le renvoie en base64. Pour les gros fichiers, utiliser share_link.`,
    inputSchema: {
      path: z.string().describe('Chemin absolu du fichier'),
    },
  }, async ({ path }) => {
    const buf = await syno.download(path, MAX_BYTES);
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = EXT_MIME[ext] || 'application/octet-stream';
    return {
      content: [{
        type: 'resource',
        resource: {
          uri: `synology://${encodeURI(path)}`,
          mimeType,
          blob: buf.toString('base64'),
        },
      }],
    };
  });

  server.registerTool('share_link', {
    description: 'Crée un lien de partage public temporaire vers un fichier du NAS et renvoie son URL.',
    inputSchema: {
      path: z.string().describe('Chemin absolu du fichier'),
      expire_days: z.number().int().min(1).max(90).optional()
        .describe('Durée de validité du lien en jours (défaut 7)'),
    },
  }, async ({ path, expire_days }) => json(await syno.shareLink(path, { expireDays: expire_days ?? 7 })));

  return server;
}

function json(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

const app = express();
app.use(express.json({ limit: '4mb' }));

app.get('/healthz', (_req, res) => res.json({ ok: true }));

function authorized(req) {
  if (req.params.token === MCP_TOKEN) return true;
  const header = req.headers.authorization || '';
  return header === `Bearer ${MCP_TOKEN}`;
}

app.all('/mcp/:token', async (req, res) => {
  if (!authorized(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  if (req.method !== 'POST') {
    // Mode sans état : pas de flux SSE persistant ni de reprise de session.
    res.status(405).set('Allow', 'POST').json({ error: 'method not allowed' });
    return;
  }
  try {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // sans état : chaque requête est autonome
    });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('Erreur MCP :', err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

app.listen(Number(PORT), () => {
  console.log(`Serveur MCP Synology démarré sur le port ${PORT}`);
  console.log('Endpoint : /mcp/<MCP_TOKEN>');
});
