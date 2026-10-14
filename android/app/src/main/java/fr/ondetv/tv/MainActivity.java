package fr.ondetv.tv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.UiModeManager;
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
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

/**
 * OndeTV pour Android TV / Fire TV : l'app web (avec son mode télécommande) dans une WebView plein écran,
 * plus un lecteur Android (ExoPlayer) pour les formats que la WebView ne lit pas (MKV, AVI…).
 */
public class MainActivity extends Activity {
    static final String HOST = "ondetv.onrender.com";
    static final String HOME = "https://" + HOST + "/";
    static final int REQ_PLAYER = 1;

    private WebView web;
    private TextView splash;
    private long lastBack;
    private boolean loaded;
    private final Handler ui = new Handler(Looper.getMainLooper());

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
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
            public void onPageFinished(WebView view, String url) {
                if (url.startsWith(HOME)) { loaded = true; splash.setVisibility(View.GONE); web.requestFocus(); }
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
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));

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
        if (code == KeyEvent.KEYCODE_BACK) {
            if (e.getAction() == KeyEvent.ACTION_UP) onBack();
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
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    /** Fonctions appelées par l'app web (window.OndeAndroid). */
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
            ui.post(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface
        public String version() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
        }
    }
}
