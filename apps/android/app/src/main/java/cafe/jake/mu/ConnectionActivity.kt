package cafe.jake.mu

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import cafe.jake.mu.ui.theme.MuTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class ConnectionActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MuTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val savedConnections =
                        ConnectionPreferences.getSavedConnections(this@ConnectionActivity)
                    val showForm = remember { mutableStateOf(savedConnections.isEmpty()) }

                    Log.d("ConnectionActivity", "Saved connections: $savedConnections")
                    Log.d("ConnectionActivity", "Show form: ${showForm.value}")

                    if (showForm.value) {
                        ConnectionUI(this::handleConnection)
                    } else {
                        ConnectionChooser(savedConnections, this::handleConnection) {
                            showForm.value = true
                        }
                    }

                    BackHandler(enabled = showForm.value) {
                        showForm.value = false
                    }
                }
            }


        }
    }

    private fun handleConnection(host: String, port: String) {
        Log.d("ConnectionActivity", "Connecting to $host:$port")
        ConnectionPreferences.saveConnection(this, host, port)
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("HOST", host)
            putExtra("PORT", port.toInt())
        }
        startActivity(intent)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConnectionUI(onConnect: (String, String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        val hostState = remember { mutableStateOf(TextFieldValue()) }
        val portState = remember { mutableStateOf(TextFieldValue()) }

        OutlinedTextField(
            value = hostState.value,
            onValueChange = { hostState.value = it },
            label = { Text("Host (e.g. 10.0.0.161)") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = portState.value,
            onValueChange = { portState.value = it },
            label = { Text("Port (e.g. 3001)") },
            keyboardOptions = KeyboardOptions.Default.copy(
                imeAction = ImeAction.Done,
                keyboardType = KeyboardType.Number
            ),
            keyboardActions = KeyboardActions(onDone = {
                onConnect(hostState.value.text, portState.value.text)
            }),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(onClick = { onConnect(hostState.value.text, portState.value.text) }) {
            Text("Connect")
        }
    }
}

@Preview
@Composable
fun ConnectionUIPreview() {
    ConnectionUI { _, _ -> }
}

@Composable
fun ConnectionChooser(
    savedConnections: Set<String>,
    onConnectionSelected: (String, String) -> Unit,
    onNewConnection: () -> Unit
) {
    Column {
        savedConnections.forEach { connection ->
            val (host, port) = connection.split(":")
            Button(onClick = { onConnectionSelected(host, port) }) {
                Text("$host:$port")
            }
        }
        Button(onClick = { onNewConnection() }) {
            Text("Add New Connection")
        }
    }
}

object ConnectionPreferences {
    private const val PREFS_NAME = "saved_connections"
    private const val CONNECTIONS_KEY = "connections"

    fun saveConnection(context: Context, host: String, port: String) {
        val sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentConnections = sharedPreferences.getStringSet(CONNECTIONS_KEY, mutableSetOf())
        val updatedConnections = currentConnections?.toMutableSet() ?: mutableSetOf()
        updatedConnections.add("$host:$port")
        Log.d("ConnectionPreferences", "Saving connections: $updatedConnections")
        with(sharedPreferences.edit()) {
            putStringSet(CONNECTIONS_KEY, updatedConnections)
            apply()
        }
    }

    fun getSavedConnections(context: Context): Set<String> {
        val sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return sharedPreferences.getStringSet(CONNECTIONS_KEY, mutableSetOf()) ?: mutableSetOf()
    }
}