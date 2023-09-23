package cafe.jake.mu

class PlayerEventBroadcaster {
    private val listeners = mutableListOf<(PlayerEvent) -> Unit>()

    fun addListener(listener: (PlayerEvent) -> Unit) {
        listeners.add(listener)
    }

    fun removeListener(listener: (PlayerEvent) -> Unit) {
        listeners.remove(listener)
    }

    fun broadcast(event: PlayerEvent) {
        listeners.forEach { it.invoke(event) }
    }
}