package fr.ondetv.tv;

import android.webkit.WebResourceResponse;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Relais local : les requêtes « /x?url=… » de l'interface sont servies directement par la TV,
 * qui contacte elle-même le serveur IPTV (comme TiviMate), au lieu de passer par le serveur OndeTV.
 * Plus stable, plus rapide, et le fournisseur voit l'adresse de la maison et non celle d'un serveur.
 * Les playlists HLS sont réécrites pour que chaque segment repasse aussi par ce relais local.
 */
final class DirectRelay {
    private static final String UA = "OndeTV/1.0";

    static WebResourceResponse fetch(String target, Map<String, String> requestHeaders) throws Exception {
        URL url = new URL(target);
        HttpURLConnection c = null;
        for (int hop = 0; hop < 6; hop++) {
            c = (HttpURLConnection) url.openConnection();
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(8000);
            c.setReadTimeout(20000);
            c.setRequestProperty("User-Agent", UA);
            c.setRequestProperty("Accept", "*/*");
            String range = header(requestHeaders, "Range");
            if (range != null) c.setRequestProperty("Range", range);
            int code = c.getResponseCode();
            if (code >= 300 && code < 400 && c.getHeaderField("Location") != null) {
                URL next = new URL(url, c.getHeaderField("Location"));
                c.disconnect();
                url = next;
                continue;
            }
            break;
        }
        int code = c.getResponseCode();
        if (code >= 300 && code < 400) throw new Exception("trop de redirections");
        String ct = c.getContentType() == null ? "" : c.getContentType();
        String mime = ct.split(";")[0].trim().toLowerCase();
        InputStream raw = code >= 400 ? c.getErrorStream() : c.getInputStream();
        if (raw == null) raw = new ByteArrayInputStream(new byte[0]);
        BufferedInputStream in = new BufferedInputStream(raw, 64 * 1024);

        String path = url.getPath().toLowerCase();
        boolean playlist = mime.contains("mpegurl") || path.endsWith(".m3u8") || path.endsWith(".m3u");
        boolean media = mime.startsWith("video/") || mime.startsWith("audio/") || mime.startsWith("image/") || path.endsWith(".ts");
        if (!playlist && !media && code < 400) {
            // Type inconnu : on regarde le début pour reconnaître une playlist.
            in.mark(16);
            byte[] head = new byte[7];
            int n = in.read(head);
            in.reset();
            playlist = n == 7 && new String(head, StandardCharsets.US_ASCII).equals("#EXTM3U");
        }

        Map<String, String> out = new HashMap<>();
        out.put("Cache-Control", "no-store");
        if (playlist && code < 400) {
            String text = readAll(in);
            c.disconnect();
            byte[] body = rewrite(text, url).getBytes(StandardCharsets.UTF_8);
            out.put("Content-Length", String.valueOf(body.length));
            return new WebResourceResponse("application/vnd.apple.mpegurl", "utf-8", 200, "OK", out, new ByteArrayInputStream(body));
        }
        for (String h : new String[]{"Content-Length", "Content-Range", "Accept-Ranges", "Last-Modified", "ETag"}) {
            String v = c.getHeaderField(h);
            if (v != null) out.put(h, v);
        }
        if (mime.isEmpty()) mime = "application/octet-stream";
        if (mime.contains("html") || mime.contains("xml") || mime.contains("javascript")) mime = "text/plain"; // jamais affiché comme une page
        String reason = c.getResponseMessage() == null || c.getResponseMessage().isEmpty() ? "OK" : c.getResponseMessage();
        return new WebResourceResponse(mime, null, code, reason, out, in);
    }

    private static String header(Map<String, String> h, String name) {
        if (h == null) return null;
        for (Map.Entry<String, String> e : h.entrySet()) if (e.getKey().equalsIgnoreCase(name)) return e.getValue();
        return null;
    }

    private static String readAll(InputStream in) throws Exception {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        byte[] buf = new byte[16 * 1024];
        int n;
        while ((n = in.read(buf)) > 0) {
            b.write(buf, 0, n);
            if (b.size() > 8 * 1024 * 1024) throw new Exception("playlist trop grande");
        }
        return b.toString("UTF-8");
    }

    private static String local(URL base, String ref) throws Exception {
        return "/x?url=" + URLEncoder.encode(new URL(base, ref.trim()).toString(), "UTF-8");
    }

    /** Chaque adresse de la playlist (segments, sous-playlists, clés, sous-titres) repasse par le relais local. */
    static String rewrite(String text, URL base) throws Exception {
        StringBuilder sb = new StringBuilder(text.length() + 1024);
        for (String line : text.split("\r?\n")) {
            String t = line.trim();
            if (t.isEmpty()) { sb.append(line).append('\n'); continue; }
            if (t.startsWith("#")) {
                int i = t.indexOf("URI=\"");
                if (i >= 0) {
                    int j = t.indexOf('"', i + 5);
                    if (j > i) t = t.substring(0, i + 5) + local(base, t.substring(i + 5, j)) + t.substring(j);
                }
                sb.append(t).append('\n');
            } else {
                sb.append(local(base, t)).append('\n');
            }
        }
        return sb.toString();
    }
}
