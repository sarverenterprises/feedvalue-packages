package com.feedvalue.sdk

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Locale

// MARK: - Public Types

/**
 * FeedValue SDK state
 */
data class FeedValueState(
    /** Whether the SDK is ready to submit feedback */
    val isReady: Boolean = false,
    /** Widget configuration from the server */
    val config: WidgetConfig? = null
)

/**
 * Widget configuration from the server
 */
data class WidgetConfig(
    val widgetId: String,
    val name: String,
    val promptText: String? = null,
    val thankYouMessage: String? = null
)

/**
 * Feedback data to submit
 */
data class Feedback(
    val message: String,
    val sentiment: Sentiment? = null,
    val email: String? = null,
    val metadata: Map<String, String>? = null
)

/**
 * Feedback sentiment values
 */
enum class Sentiment(val value: String) {
    FRUSTRATED("frustrated"),
    CONFUSED("confused"),
    NEUTRAL("neutral"),
    SATISFIED("satisfied"),
    EXCITED("excited")
}

/**
 * FeedValue SDK errors
 */
sealed class FeedValueError : Exception() {
    /** SDK has not been initialized */
    object NotInitialized : FeedValueError() {
        override val message = "FeedValue SDK has not been initialized. Call FeedValue.initialize() first."
    }

    /** Network connectivity or timeout error */
    data class NetworkError(val underlying: Throwable) : FeedValueError() {
        override val message = "Network error: ${underlying.message}"
    }

    /** Server returned an error response */
    data class ServerError(val statusCode: Int, val serverMessage: String?) : FeedValueError() {
        override val message = serverMessage?.let {
            "Server error ($statusCode): $it"
        } ?: "Server error: HTTP $statusCode"
    }
}

// MARK: - FeedValue SDK

/**
 * FeedValue SDK for Android
 *
 * ## Usage
 * ```kotlin
 * // Initialize
 * val feedValue = FeedValue.initialize(context, "your-widget-id")
 *
 * // Observe state
 * feedValue.state.collect { state ->
 *     println("Ready: ${state.isReady}")
 * }
 *
 * // Submit feedback
 * feedValue.submit(Feedback(message = "Great app!"))
 *
 * // User identification (optional)
 * feedValue.setUser(id = "user-123", email = "user@example.com")
 * ```
 */
class FeedValue private constructor(
    private val widgetId: String,
    private val context: Context,
    apiBaseUrl: String
) {
    // MARK: - Instance Registry

    companion object {
        private val instances = mutableMapOf<String, FeedValue>()
        private val lock = Any()

        /**
         * Get an existing FeedValue instance for a widget ID
         */
        @JvmStatic
        fun getInstance(widgetId: String): FeedValue? {
            synchronized(lock) {
                return instances[widgetId]
            }
        }

        /**
         * Initialize FeedValue for a widget
         * Returns existing instance if already initialized
         */
        @JvmStatic
        suspend fun initialize(
            context: Context,
            widgetId: String,
            apiBaseUrl: String = "https://api.feedvalue.com"
        ): FeedValue {
            synchronized(lock) {
                instances[widgetId]?.let { return it }
            }

            val instance = FeedValue(widgetId, context.applicationContext, apiBaseUrl)
            instance.doInitialize()

            synchronized(lock) {
                instances[widgetId] = instance
            }

            return instance
        }
    }

    // MARK: - Properties

    private val api = FeedValueAPI(apiBaseUrl)
    private val deviceIdentifier = DeviceIdentifier(context)

    private val _state = MutableStateFlow(FeedValueState())

    /** Current SDK state as a StateFlow */
    val state: StateFlow<FeedValueState> = _state.asStateFlow()

    // User data
    private var userId: String? = null
    private var userEmail: String? = null
    private var userName: String? = null

    // MARK: - Initialization

    private suspend fun doInitialize() {
        // Get device fingerprint
        val fingerprint = deviceIdentifier.getOrCreateFingerprint()
        api.setFingerprint(fingerprint)

        // Fetch config
        val config = api.fetchConfig(widgetId)

        // Update state
        _state.value = FeedValueState(isReady = true, config = config)
    }

    // MARK: - Public API

    /**
     * Submit feedback
     */
    suspend fun submit(feedback: Feedback) {
        if (!_state.value.isReady) {
            throw FeedValueError.NotInitialized
        }

        // Collect mobile metadata
        val metadata = feedback.metadata?.toMutableMap() ?: mutableMapOf()
        metadata["platform"] = "android"
        metadata["sdk_version"] = "1.0.0"
        metadata["device_model"] = android.os.Build.MODEL
        metadata["os_version"] = android.os.Build.VERSION.RELEASE
        metadata["app_package"] = context.packageName
        metadata["locale"] = Locale.getDefault().toString()

        // Add user data if set
        userId?.let { metadata["user_id"] = it }
        (feedback.email ?: userEmail)?.let { metadata["user_email"] = it }
        userName?.let { metadata["user_name"] = it }

        api.submitFeedback(
            widgetId = widgetId,
            message = feedback.message,
            sentiment = feedback.sentiment,
            metadata = metadata
        )
    }

    /**
     * Set user identity
     */
    fun setUser(id: String, email: String? = null, name: String? = null) {
        userId = id
        userEmail = email
        userName = name
    }

    /**
     * Clear user identity
     */
    fun clearUser() {
        userId = null
        userEmail = null
        userName = null
    }
}
