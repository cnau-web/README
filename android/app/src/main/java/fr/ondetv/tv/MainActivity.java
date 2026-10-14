package fr.ondetv.tv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.UiModeManager;
import android.os.Build;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.content.SharedPreferences;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * OndeTV pour Android TV / Fire TV : l'app web (avec son mode télécommande) dans une WebView plein écran,
 * plus un lecteur Android (ExoPlayer) pour les formats que la WebView ne lit pas (MKV, AVI…).
 */
public class MainActivity extends Activity {
    static final String HOST = "ondetv.onrender.com";
    static final String HOME = "https://" + HOST + "/";
    static final int REQ_PLAYER = 1;

    private WebView web;
    private FrameLayout root;
    private SharedPreferences prefs;
    private int rendererCrashes;
    private boolean waitingRestart;
    private TextView splash;
    private long lastBack;
    private boolean loaded;
    private final Handler ui = new Handler(Looper.getMainLooper());
    /** Hôte de la page affichée : le pont Android ne répond qu'à notre site. */
    private volatile String currentHost = "";
    private volatile boolean updating;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = getSharedPreferences("ondetv", MODE_PRIVATE);
        // Tout plantage Java est noté pour être affiché dans Réglages (diagnostic), puis l'app se ferme normalement.
        Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((t, ex) -> {
            try {
                StringBuilder b = new StringBuilder(String.valueOf(ex));
                for (StackTraceElement el : ex.getStackTrace()) { if (b.length() > 1500) break; b.append("\n at ").append(el); }
                prefs.edit().putString("lastCrash", new java.util.Date() + " · " + b).commit();
            } catch (Throwable ignored) { }
            if (previous != null) previous.uncaughtException(t, ex);
        });
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        createWebView();

        splash = new TextView(this);
        splash.setText("OndeTV\nDémarrage…");
        splash.setTextColor(Color.WHITE);
        splash.setTextSize(28);
        splash.setGravity(Gravity.CENTER);
        splash.setBackgroundColor(Color.BLACK);
        root.addView(splash, new FrameLayout.LayoutParams(-1, -1));

        setContentView(root);
        hideSystemBars();
        if (state != null) web.restoreState(state); else web.loadUrl(HOME);
    }

    /** Crée la WebView (aussi après un arrêt de son moteur, sans fermer l'app). */
    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    private void createWebView() {
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        // Tout passe par notre serveur en HTTPS : aucun contenu non chiffré dans l'interface.
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setGeolocationEnabled(false);
        if (Build.VERSION.SDK_INT >= 26) {
            try { s.setSafeBrowsingEnabled(true); } catch (Throwable ignored) { } // absent de certaines WebView (Fire OS)
        }
        s.setUserAgentString(s.getUserAgentString() + " OndeTV-AndroidTV/1");
        web.addJavascriptInterface(new Bridge(), "OndeAndroid");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                currentHost = Uri.parse(url).getHost() == null ? "" : Uri.parse(url).getHost();
            }

            @Override
            public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
                currentHost = Uri.parse(url).getHost() == null ? "" : Uri.parse(url).getHost();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (url.startsWith(HOME)) { loaded = true; splash.setVisibility(View.GONE); web.requestFocus(); }
            }

            /** Vidéo, guide, logos, API du fournisseur : la TV va chercher elle-même (relais local). */
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost()) || !"/x".equals(u.getPath()) || !"GET".equalsIgnoreCase(req.getMethod())) return null;
                String target = u.getQueryParameter("url");
                if (target == null || !(target.startsWith("http://") || target.startsWith("https://"))) return null;
                try {
                    return DirectRelay.fetch(target, req.getRequestHeaders());
                } catch (Exception e) {
                    Log.w("OndeTV", "relais local : " + e.getMessage());
                    return null; // en cas d'échec, la requête part vers le serveur OndeTV comme avant
                }
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                return onRendererGone(view, detail.didCrash());
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (!req.isForMainFrame()) return;
                // Le serveur gratuit peut mettre jusqu'à une minute à se réveiller : on réessaie tout seul.
                loaded = false;
                splash.setText("Connexion au serveur OndeTV…\nNouvel essai dans quelques secondes");
                splash.setVisibility(View.VISIBLE);
                ui.postDelayed(() -> web.loadUrl(HOME), 5000);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public Bitmap getDefaultVideoPoster() {
                return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888); // pas d'icône grise avant la lecture
            }
        });
        root.addView(web, 0, new FrameLayout.LayoutParams(-1, -1));
    }

    /**
     * Le moteur d'affichage s'est arrêté (souvent faute de mémoire sur les petites clés TV).
     * Sans ce traitement, Android ferme toute l'app : on recrée la WebView et on recharge en mode allégé.
     */
    private boolean onRendererGone(WebView view, boolean crashed) {
        rendererCrashes++;
        prefs.edit().putString("lastCrash", new java.util.Date() + " · moteur d'affichage arrêté (" + (crashed ? "plantage" : "mémoire") + "), n° " + rendererCrashes).apply();
        Log.w("OndeTV", "WebView renderer gone, crashed=" + crashed);
        root.removeView(view);
        view.destroy();
        if (view == web) {
            createWebView();
            loaded = false;
            splash.setVisibility(View.VISIBLE);
            if (rendererCrashes >= 3) {
                // Évite une boucle de relances : on attend que l'utilisateur appuie sur OK.
                waitingRestart = true;
                splash.setText("OndeTV a manqué de mémoire.\nAppuyez sur OK pour relancer.");
            } else {
                splash.setText("OndeTV\nRelance…");
                web.loadUrl(HOME + "?lite=1");
            }
        }
        return true;
    }

    private void hideSystemBars() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    private void js(String code) {
        ui.post(() -> web.evaluateJavascript(code, null));
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        int code = e.getKeyCode();
        String key = null;
        switch (code) {
            case KeyEvent.KEYCODE_CHANNEL_UP: case KeyEvent.KEYCODE_PAGE_UP: key = "ChannelUp"; break;
            case KeyEvent.KEYCODE_CHANNEL_DOWN: case KeyEvent.KEYCODE_PAGE_DOWN: key = "ChannelDown"; break;
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE: case KeyEvent.KEYCODE_MEDIA_PLAY: case KeyEvent.KEYCODE_MEDIA_PAUSE: key = "PlayPause"; break;
            case KeyEvent.KEYCODE_MENU: case KeyEvent.KEYCODE_INFO: case KeyEvent.KEYCODE_GUIDE: key = "Menu"; break;
        }
        if (key != null) {
            if (e.getAction() == KeyEvent.ACTION_DOWN && e.getRepeatCount() == 0) js("window.ondetvKey && window.ondetvKey('" + key + "')");
            return true;
        }
        if (waitingRestart && e.getAction() == KeyEvent.ACTION_DOWN
                && (code == KeyEvent.KEYCODE_DPAD_CENTER || code == KeyEvent.KEYCODE_ENTER)) {
            waitingRestart = false;
            rendererCrashes = 0;
            splash.setText("OndeTV\nRelance…");
            web.loadUrl(HOME + "?lite=1");
            return true;
        }
        if (code == KeyEvent.KEYCODE_BACK) {
            if (e.getAction() == KeyEvent.ACTION_UP) { if (waitingRestart) finish(); else onBack(); }
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    private void onBack() {
        if (!loaded) { finish(); return; }
        web.evaluateJavascript("(window.ondetvBack && window.ondetvBack()) ? 1 : 0", v -> {
            if ("1".equals(v)) return;
            long now = System.currentTimeMillis();
            if (now - lastBack < 2500) { finish(); return; }
            lastBack = now;
            Toast.makeText(this, "Appuyez encore sur Retour pour quitter", Toast.LENGTH_SHORT).show();
        });
    }

    @Override
    protected void onActivityResult(int req, int result, Intent data) {
        super.onActivityResult(req, result, data);
        if (req != REQ_PLAYER || data == null) return;
        long pos = data.getLongExtra("pos", 0), dur = data.getLongExtra("dur", 0);
        js("window.ondetvNativeDone && window.ondetvNativeDone(" + pos + "," + dur + ")");
    }

    @Override
    protected void onPause() {
        // Retour à l'accueil de la TV : la lecture s'arrête (sinon le son continue en arrière-plan).
        web.evaluateJavascript("document.querySelectorAll('video').forEach(v => v.pause())", null);
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemBars();
        // Retour dans l'app : synchronisation immédiate (groupes masqués, favoris…) et recherche de mise à jour.
        if (loaded) js("window.ondetvResume && window.ondetvResume()");
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    private boolean trusted() { return HOST.equals(currentHost); }

    /**
     * Télécharge la nouvelle version depuis notre serveur puis ouvre l'installateur d'Android
     * (même méthode que l'app Downloader : fonctionne sur Fire TV comme sur Google TV).
     */
    private void downloadAndInstall() {
        try {
            if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
                js("window.ondetvUpdateError && window.ondetvUpdateError('PERMISSION')");
                ui.post(() -> {
                    try {
                        startActivity(new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
                    } catch (Exception ignored) { } // écran absent sur certaines Fire TV : l'app web affiche le chemin à suivre
                });
                return;
            }
            HttpURLConnection c = (HttpURLConnection) new URL(HOME + "tv").openConnection();
            c.setConnectTimeout(20000);
            c.setReadTimeout(60000);
            if (c.getResponseCode() != 200) throw new Exception("HTTP " + c.getResponseCode());
            long total = c.getContentLength();
            java.io.File dir = Build.VERSION.SDK_INT >= 24 ? new java.io.File(getCacheDir(), "updates") : getExternalCacheDir();
            if (dir == null) throw new Exception("stockage indisponible");
            dir.mkdirs();
            java.io.File apk = new java.io.File(dir, "OndeTV-update.apk");
            try (InputStream in = c.getInputStream(); OutputStream out = new java.io.FileOutputStream(apk)) {
                byte[] buf = new byte[64 * 1024];
                long done = 0; int n, last = -1;
                while ((n = in.read(buf)) > 0) {
                    out.write(buf, 0, n);
                    done += n;
                    int pct = total > 0 ? (int) (done * 100 / total) : -1;
                    if (pct != last) { last = pct; js("window.ondetvUpdateProgress && window.ondetvUpdateProgress(" + pct + ")"); }
                }
            }
            if (total > 0 && apk.length() != total) throw new Exception("téléchargement incomplet");
            Uri uri = Build.VERSION.SDK_INT >= 24
                    ? androidx.core.content.FileProvider.getUriForFile(this, getPackageName() + ".files", apk)
                    : Uri.fromFile(apk);
            Intent i = new Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            ui.post(() -> {
                try { startActivity(i); }
                catch (Exception e) { js("window.ondetvUpdateError && window.ondetvUpdateError(" + jsString("installateur introuvable : " + e.getMessage()) + ")"); }
            });
        } catch (Exception e) {
            js("window.ondetvUpdateError && window.ondetvUpdateError(" + jsString(e.getMessage()) + ")");
        } finally {
            updating = false;
        }
    }

    private static String jsString(String s) {
        return "'" + String.valueOf(s).replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ") + "'";
    }

    /** Fonctions appelées par l'app web (window.OndeAndroid), seulement depuis notre site. */
    class Bridge {
        @JavascriptInterface
        public boolean isTV() {
            UiModeManager m = (UiModeManager) getSystemService(UI_MODE_SERVICE);
            return m != null && m.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION
                    || getPackageManager().hasSystemFeature("android.software.leanback")
                    || getPackageManager().hasSystemFeature("amazon.hardware.fire_tv");
        }

        @JavascriptInterface
        public void play(String url, String title, String subtitle, long startMs) {
            if (!trusted() || url == null || !(url.startsWith("http://") || url.startsWith("https://"))) return;
            ui.post(() -> {
                Intent i = new Intent(MainActivity.this, PlayerActivity.class);
                i.putExtra("url", url);
                i.putExtra("title", title);
                i.putExtra("subtitle", subtitle);
                i.putExtra("start", startMs);
                startActivityForResult(i, REQ_PLAYER);
            });
        }

        @JavascriptInterface
        public void keepScreenOn(boolean on) {
            if (!trusted()) return;
            ui.post(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        /** Dernier plantage noté (diagnostic dans Réglages), puis effacé. */
        @JavascriptInterface
        public String lastCrash() {
            String v = prefs.getString("lastCrash", "");
            prefs.edit().remove("lastCrash").apply();
            return v;
        }

        @JavascriptInterface
        public int versionCode() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode; } catch (Exception e) { return 0; }
        }

        @JavascriptInterface
        public void installUpdate() {
            if (!trusted() || updating) return;
            updating = true;
            new Thread(MainActivity.this::downloadAndInstall, "ondetv-update").start();
        }

        @JavascriptInterface
        public String version() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
        }
    }
}
