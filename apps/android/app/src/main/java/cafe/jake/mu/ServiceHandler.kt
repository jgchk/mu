package cafe.jake.mu

import android.util.Log
import android.webkit.CookieManager
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.yield
import kotlinx.serialization.Serializable

class ServiceHandler constructor(
    private val player: ExoPlayer,
    private val connection: Connection,
) : Player.Listener {

    private val _simplePlayerState = MutableStateFlow<PlayerState>(PlayerState.Idle)
    val simplePlayerState = _simplePlayerState.asStateFlow()

    private var scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    init {
        player.addListener(this)
    }

    @UnstableApi
    fun playTrack(id: Int, previousTracks: List<Int>?, nextTracks: List<Int>?) {
        val cookie = CookieManager.getInstance().getCookie(idToUri(id))
        Log.d("ServiceHandler", "Cookie: $cookie")

        val factory = DefaultHttpDataSource.Factory()
            .setDefaultRequestProperties(mapOf("Cookie" to cookie))

        // add previous and next tracks to queue
        player.clearMediaItems()
        previousTracks?.forEach {
            player.addMediaSource(
                ProgressiveMediaSource.Factory(factory)
                    .createMediaSource(MediaItem.fromUri(idToUri(it)))
            )
        }
        player.addMediaSource(
            ProgressiveMediaSource.Factory(factory)
                .createMediaSource(MediaItem.fromUri(idToUri(id)))
        )
        nextTracks?.forEach {
            player.addMediaSource(
                ProgressiveMediaSource.Factory(factory)
                    .createMediaSource(MediaItem.fromUri(idToUri(it)))
            )
        }

        player.seekTo(previousTracks?.size ?: 0, 0)
        player.prepare()
        player.play()

        updateState()
    }

    private fun idToUri(id: Int): String {
        return "http://${connection.HOST}:${connection.PORT}/api/tracks/$id/stream"
    }

    private fun uriToId(uri: String): Int {
        return uri.split("/").dropLast(1).last().toInt()
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

    override fun onEvents(player: Player, events: Player.Events) {
        super.onEvents(player, events)
        Log.d("ServiceHandler", "Events: $events")
        updateState()
    }

    override fun onIsPlayingChanged(isPlaying: Boolean) {
        Log.d("ServiceHandler", "IsPlayingChanged: $isPlaying")
        updateState()
        if (isPlaying) {
            startProgressUpdate()
        } else {
            stopProgressUpdate()
        }
    }

    private fun startProgressUpdate() {
        Log.d("ServiceHandler", "Starting progress update")

        // Ensure the scope is active before launching the coroutine
        if (scope.isActive.not()) {
            scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
        }

        scope.launch {
            while (true) {
                delay(500)
                Log.d("ServiceHandler", "Progress: ${player.currentPosition}/${player.duration}")
                updateState()
                yield() // It's good practice to yield within infinite loops
            }
        }
    }

    private fun stopProgressUpdate() {
        Log.d("ServiceHandler", "Stopping progress update")
        scope.cancel() // This cancels the scope and its underlying job
    }

    private fun updateState() {
        val currentMediaItem = player.currentMediaItem
        if (currentMediaItem == null) {
            _simplePlayerState.value = PlayerState.Idle
            return
        }

        val uri = currentMediaItem.localConfiguration?.uri
        if (uri == null) {
            _simplePlayerState.value = PlayerState.Idle
            return
        }

        _simplePlayerState.value = PlayerState.Playing(
            trackId = uriToId(uri.toString()),
            progress = player.currentPosition,
            duration = player.duration,
            state = if (player.playbackState == ExoPlayer.STATE_BUFFERING) {
                MediaState.Buffering
            } else if (player.isPlaying) {
                MediaState.Playing
            } else {
                MediaState.Paused
            }
        )

        Log.d("ServiceHandler", "PlayerState: ${_simplePlayerState.value}")
    }
}


@Serializable
sealed class PlayerState {
    @Serializable
    data object Idle : PlayerState()
    @Serializable
    data class Playing(
        val trackId: Int,
        val progress: Long,
        val duration: Long,
        val state: MediaState
    ) : PlayerState()
}

@Serializable
sealed class MediaState {
    @Serializable
    data object Playing : MediaState()
    @Serializable
    data object Paused : MediaState()
    @Serializable
    data object Buffering : MediaState()
}
