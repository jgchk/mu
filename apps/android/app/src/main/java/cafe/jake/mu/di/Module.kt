package cafe.jake.mu.di

import android.content.Context
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.ForwardingPlayer
import androidx.media3.common.util.Log
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.session.MediaSession
import cafe.jake.mu.Connection
import cafe.jake.mu.MediaState
import cafe.jake.mu.NotificationManager
import cafe.jake.mu.PlayerEvent
import cafe.jake.mu.PlayerEventBroadcaster
import cafe.jake.mu.ServiceHandler
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
class Module {

    @Provides
    @Singleton
    fun provideAudioAttributes(): AudioAttributes =
        AudioAttributes.Builder()
            .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
            .setUsage(C.USAGE_MEDIA)
            .build()

    @Provides
    @Singleton
    @UnstableApi
    fun providePlayer(
        @ApplicationContext context: Context,
        audioAttributes: AudioAttributes
    ): ExoPlayer =
        ExoPlayer.Builder(context)
            .setAudioAttributes(audioAttributes, true)
            .setHandleAudioBecomingNoisy(true)
            .setTrackSelector(DefaultTrackSelector(context))
            .build()

    @Provides
    @Singleton
    fun provideNotificationManager(
        @ApplicationContext context: Context,
        player: ExoPlayer
    ): NotificationManager =
        NotificationManager(
            context = context,
            player = player
        )

    @Provides
    @Singleton
    fun provideMediaSession(
        @ApplicationContext context: Context,
        player: ExoPlayer,
        broadcaster: PlayerEventBroadcaster
    ): MediaSession {
        val forwardingPlayer = @OptIn(UnstableApi::class) object : ForwardingPlayer(player) {
            override fun play() {
                super.play()
            }

            override fun seekToNext() {
                broadcaster.broadcast(PlayerEvent.SeekToNext)
                super.seekToNext()
            }
        }

        return MediaSession.Builder(context, forwardingPlayer).build()
    }

    @Provides
    @Singleton
    fun providePlayerEventBroadcaster(): PlayerEventBroadcaster = PlayerEventBroadcaster()
}
