package cafe.jake.mu

import android.content.Intent
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

class PlaybackService : MediaSessionService() {
    private var mediaSession: MediaSession? = null
    private var notificationManager: NotificationManager? = null

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? =
        mediaSession

    @UnstableApi
    override fun onCreate() {
        super.onCreate()

        val player = ExoPlayer.Builder(this).build()
        mediaSession = MediaSession.Builder(this, player).build()

        notificationManager = NotificationManager(this, player)

        val factory = DefaultHttpDataSource.Factory()
            .setDefaultRequestProperties(mapOf("Cookie" to "session_token=35a7276e20b554043603dfe02b15b97992561ff5e18fde6bf276d356135ef5f8"))
        val mediaSource = ProgressiveMediaSource.Factory(factory)
            .createMediaSource(MediaItem.fromUri("http://$HOST:$PORT/api/tracks/99/stream"));

        player.setMediaSource(mediaSource);
        player.prepare()
        player.play()
    }

    @UnstableApi
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        mediaSession?.let {
            notificationManager?.startNotificationService(
                mediaSessionService = this,
                mediaSession = it
            )
        }
        return super.onStartCommand(intent, flags, startId)
    }

    override fun onDestroy() {
        mediaSession?.run {
            player.release()
            release()
            mediaSession = null
        }
        super.onDestroy()
    }
}
