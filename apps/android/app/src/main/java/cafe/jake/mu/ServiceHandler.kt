package cafe.jake.mu

import android.util.Log
import android.webkit.CookieManager
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

class ServiceHandler constructor(
    private val player: ExoPlayer,
    private val connection: Connection,
    private val broadcaster: PlayerEventBroadcaster
) : Player.Listener {

    private val _simpleMediaState = MutableStateFlow<MediaState>(MediaState.Initial)
    val simpleMediaState = _simpleMediaState.asStateFlow()

    private var job: Job? = null

    private val playerEventListener: (PlayerEvent) -> Unit = { event ->
        if (event == PlayerEvent.SeekToNext) {
            // Trigger MediaState.SeekToNext event or do whatever you want
            _simpleMediaState.value = MediaState.SeekToNext
        }
    }

    init {
        player.addListener(this)
        job = Job()

        broadcaster.addListener(playerEventListener)
    }

    fun cleanup() {
        broadcaster.removeListener(playerEventListener)
    }

    @UnstableApi
    fun playTrack(id: Int, previousTracks: List<Int>?, nextTracks: List<Int>?) {
        val cookie = CookieManager.getInstance().getCookie("http://${connection.HOST}:${connection.PORT}/api/tracks/$id/stream")
        Log.d("ServiceHandler", "Cookie: $cookie")

        val factory = DefaultHttpDataSource.Factory()
            .setDefaultRequestProperties(mapOf("Cookie" to cookie))

        // add previous and next tracks to queue
        player.clearMediaItems()
        previousTracks?.forEach {
            player.addMediaSource(ProgressiveMediaSource.Factory(factory).createMediaSource(MediaItem.fromUri("http://${connection.HOST}:${connection.PORT}/api/tracks/$it/stream")))
        }
        player.addMediaSource(ProgressiveMediaSource.Factory(factory).createMediaSource(MediaItem.fromUri("http://${connection.HOST}:${connection.PORT}/api/tracks/$id/stream")))
        nextTracks?.forEach {
            player.addMediaSource(ProgressiveMediaSource.Factory(factory).createMediaSource(MediaItem.fromUri("http://${connection.HOST}:${connection.PORT}/api/tracks/$it/stream")))
        }

        player.seekTo(previousTracks?.size ?: 0, 0)
        player.prepare()
        player.play()
    }

    fun nextTrack() {
        player.seekToNextMediaItem()
    }

    fun previousTrack() {
        player.seekToPreviousMediaItem()
    }

    fun play() {
        player.play()
    }

    fun pause() {
        player.pause()
    }

    fun seek(time: Int) {
        player.seekTo(time.toLong())
    }

    override fun onPlaybackStateChanged(playbackState: Int) {
        when (playbackState) {
            ExoPlayer.STATE_BUFFERING -> _simpleMediaState.value =
                MediaState.Buffering(player.currentPosition)
            ExoPlayer.STATE_READY -> _simpleMediaState.value =
                MediaState.Ready(player.duration)
        }
    }

    override fun onPositionDiscontinuity(
        oldPosition: Player.PositionInfo,
        newPosition: Player.PositionInfo,
        reason: Int
    ) {
        super.onPositionDiscontinuity(oldPosition, newPosition, reason)
        Log.d("ServiceHandler", "POJSITION DISCONTINUITY: $reason")
        if (reason == Player.DISCONTINUITY_REASON_AUTO_TRANSITION) {
            _simpleMediaState.value = MediaState.Ended
        }
    }

    override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
        super.onMediaItemTransition(mediaItem, reason)
        Log.d("ServiceHandler", "MEDIA ITEM TRANSITION: $reason, ${mediaItem?.localConfiguration?.uri}")
    }

    @OptIn(DelicateCoroutinesApi::class)
    override fun onIsPlayingChanged(isPlaying: Boolean) {
        _simpleMediaState.value = MediaState.Playing(isPlaying = isPlaying)
        if (isPlaying) {
            GlobalScope.launch(Dispatchers.Main) {
                startProgressUpdate()
            }
        } else {
            stopProgressUpdate()
        }
    }

    private suspend fun startProgressUpdate() = job.run {
        while (true) {
            delay(500)
            _simpleMediaState.value = MediaState.Progress(player.currentPosition, player.duration)
        }
    }

    private fun stopProgressUpdate() {
        job?.cancel()
        _simpleMediaState.value = MediaState.Playing(isPlaying = false)
    }
}

sealed class PlayerEvent {
    object SeekToNext : PlayerEvent()
}

sealed class MediaState {
    object Initial : MediaState()
    data class Ready(val duration: Long) : MediaState()
    data class Progress(val progress: Long, val duration: Long) : MediaState()
    data class Buffering(val progress: Long) : MediaState()
    data class Playing(val isPlaying: Boolean) : MediaState()
    object Ended : MediaState()

    object SeekToNext : MediaState()
}