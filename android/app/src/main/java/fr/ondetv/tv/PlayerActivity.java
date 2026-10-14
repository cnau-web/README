package fr.ondetv.tv;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;
import android.widget.Toast;

import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.DefaultRenderersFactory;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.ui.PlayerView;

/** Lecteur Android (ExoPlayer) : MKV, AVI, pistes audio et sous-titres intégrés. */
public class PlayerActivity extends Activity {
    private ExoPlayer player;
    private PlayerView view;
    private TextView title;
    private final Handler ui = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.activity_player);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);

        Intent in = getIntent();
        String url = in.getStringExtra("url");
        title = findViewById(R.id.title);
        String t = in.getStringExtra("title"), sub = in.getStringExtra("subtitle");
        title.setText(sub == null || sub.isEmpty() ? t : t + "\n" + sub);
        ui.postDelayed(() -> title.setVisibility(View.GONE), 5000);

        DefaultHttpDataSource.Factory http = new DefaultHttpDataSource.Factory()
                .setUserAgent("OndeTV-AndroidTV/1")
                .setAllowCrossProtocolRedirects(true)
                .setConnectTimeoutMs(20000)
                .setReadTimeoutMs(30000);
        DefaultRenderersFactory renderers = new DefaultRenderersFactory(this)
                .setEnableDecoderFallback(true)
                .setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_PREFER);
        player = new ExoPlayer.Builder(this, renderers)
                .setMediaSourceFactory(new DefaultMediaSourceFactory(http))
                .setSeekBackIncrementMs(10000)
                .setSeekForwardIncrementMs(30000)
                .build();
        view = findViewById(R.id.player_view);
        view.setPlayer(player);
        view.setShowNextButton(false);
        view.setShowPreviousButton(false);
        view.setShowFastForwardButton(true);
        view.setShowRewindButton(true);
        view.requestFocus();

        player.addListener(new Player.Listener() {
            @Override
            public void onPlayerError(PlaybackException error) {
                Toast.makeText(PlayerActivity.this, "Lecture impossible : " + error.getErrorCodeName(), Toast.LENGTH_LONG).show();
            }

            @Override
            public void onPlaybackStateChanged(int s) {
                if (s == Player.STATE_ENDED) finishWithResult();
            }
        });
        player.setMediaItem(MediaItem.fromUri(Uri.parse(url)), Math.max(0, in.getLongExtra("start", 0)));
        player.prepare();
        player.play();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        int code = e.getKeyCode();
        if (code == KeyEvent.KEYCODE_BACK) {
            if (e.getAction() == KeyEvent.ACTION_UP) {
                if (view.isControllerFullyVisible()) view.hideController(); else finishWithResult();
            }
            return true;
        }
        // Sans commandes affichées : gauche/droite reculent/avancent, OK met en pause et affiche les commandes.
        if (!view.isControllerFullyVisible() && e.getAction() == KeyEvent.ACTION_DOWN) {
            if (code == KeyEvent.KEYCODE_DPAD_LEFT) { player.seekBack(); view.showController(); return true; }
            if (code == KeyEvent.KEYCODE_DPAD_RIGHT) { player.seekForward(); view.showController(); return true; }
        }
        return view.dispatchKeyEvent(e) || super.dispatchKeyEvent(e);
    }

    private void finishWithResult() {
        Intent r = new Intent();
        long dur = player.getDuration();
        r.putExtra("pos", player.getCurrentPosition());
        r.putExtra("dur", dur == C.TIME_UNSET ? 0 : dur);
        setResult(RESULT_OK, r);
        finish();
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (player != null) player.pause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (player != null) { player.release(); player = null; }
    }
}
