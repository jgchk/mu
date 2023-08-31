package cafe.jake.mu

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.util.UnstableApi
import cafe.jake.mu.ui.theme.MuTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import org.json.JSONArray
import java.util.Arrays
import javax.inject.Inject


@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private var isServiceRunning = false

    @Inject
    lateinit var serviceHandler: ServiceHandler


    private inner class WebAppInterface(private val mContext: Context) {
        @JavascriptInterface
        @UnstableApi
        fun playTrack(id: Int, previousTracksStr: String, nextTracksStr: String) {
            val previousTracks = previousTracksStr.split(",").filter { it.isNotEmpty() }.map { it.toInt() }
            val nextTracks = nextTracksStr.split(",").filter { it.isNotEmpty() }.map { it.toInt() }
            Log.d("MainActivity", "playTrack($id, $previousTracks, $nextTracks)")
            runOnUiThread {
                serviceHandler.playTrack(id, previousTracks, nextTracks);
            }
        }

        @JavascriptInterface
        fun nextTrack() {
            Log.d("MainActivity", "nextTrack()")
            runOnUiThread {
                serviceHandler.nextTrack()
            }
        }

        @JavascriptInterface
        fun previousTrack() {
            Log.d("MainActivity", "previousTrack()")
            runOnUiThread {
                serviceHandler.previousTrack()
            }
        }

        @JavascriptInterface
        fun play() {
            Log.d("MainActivity", "play()")
            runOnUiThread {
                serviceHandler.play()
            }
        }

        @JavascriptInterface
        fun pause() {
            Log.d("MainActivity", "pause()")
            runOnUiThread {
                serviceHandler.pause()
            }
        }

        @JavascriptInterface
        fun seek(time: Int) {
            Log.d("MainActivity", "seek($time)")
            runOnUiThread {
                serviceHandler.seek(time)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        startService()


        val mUrl = "http://$HOST:$PORT"

        setContent {
            MuTheme {
                // A surface container using the 'background' color from the theme
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AndroidView(factory = {
                        WebView(it).apply {
                            layoutParams = ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            )
                            webViewClient = MyWebViewClient()
                            settings.javaScriptEnabled = true
                            settings.domStorageEnabled = true
                            settings.loadsImagesAutomatically = true
                            settings.cacheMode = WebSettings.LOAD_DEFAULT

                            addJavascriptInterface(WebAppInterface(it), "Android")
                            loadUrl(mUrl)

                            lifecycleScope.launch {
                                serviceHandler.simpleMediaState.collect { mediaState ->
                                    when (mediaState) {
                                        is MediaState.Ready -> {
                                            Log.d("MainActivity", "MediaState.Ready")
                                            loadUrl("javascript:window.dispatchEvent(new CustomEvent('durationchange', {detail: ${mediaState.duration}}))")
                                        }
                                        is MediaState.Progress -> {
                                            Log.d("MainActivity", "MediaState.Progress(${mediaState.progress}, ${mediaState.duration})")
                                            loadUrl("javascript:window.dispatchEvent(new CustomEvent('timeupdate', {detail: ${mediaState.progress}}))")
                                            loadUrl("javascript:window.dispatchEvent(new CustomEvent('durationchange', {detail: ${mediaState.duration}}))")
                                        }
                                        is MediaState.Playing -> {
                                            if (mediaState.isPlaying) {
                                                Log.d("MainActivity", "MediaState.Playing")
                                                loadUrl("javascript:window.dispatchEvent(new CustomEvent('played'))")
                                            } else {
                                                Log.d("MainActivity", "MediaState.Paused")
                                                loadUrl("javascript:window.dispatchEvent(new CustomEvent('paused'))")
                                            }
                                        }
                                        is MediaState.Ended -> {
                                            Log.d("MainActivity", "MediaState.Ended")
                                            loadUrl("javascript:window.dispatchEvent(new CustomEvent('ended'))")
                                        }
                                        else -> {}
                                    }
                                }
                            }
                        }
                    }, update = {
                        it.loadUrl(mUrl)
                    })
                }
            }
        }
    }

    private fun startService() {
        if (!isServiceRunning) {
            val intent = Intent(this, PlaybackService::class.java)
            startForegroundService(intent)
            isServiceRunning = true
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopService(Intent(this, PlaybackService::class.java))
        isServiceRunning = false
    }

}

const val HOST = "10.0.0.45"
const val PORT = 3002

private class MediaWebView : WebView {
    constructor(context: Context) : super(context)
    constructor(context: Context, attrs: AttributeSet?) : super(context, attrs)
    constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(
        context,
        attrs,
        defStyleAttr
    )

    override fun onWindowVisibilityChanged(visibility: Int) {
        if (visibility != View.GONE) super.onWindowVisibilityChanged(View.VISIBLE)
    }
}

private class MyWebViewClient : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
        val url = url.replace("localhost", HOST)
        view.loadUrl(url)
        return true;
    }
}

