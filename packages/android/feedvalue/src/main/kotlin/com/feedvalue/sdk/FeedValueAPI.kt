package com.feedvalue.sdk

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

// MARK: - API Response Types

internal data class ConfigResponse(
    val widgetId: String,
    val config: WidgetConfigData,
    val submissionToken: String?,
    val tokenExpiresAt: Long?
)

internal data class WidgetConfigData(
    val name: String,
    val promptText: String?,
    val thankYouMessage: String?
)

// MARK: - FeedValue API Client

internal class FeedValueAPI(baseUrl: String) {

    private val baseUrl = baseUrl.trimEnd('/')

    // Token lifecycle
    private var submissionToken: String? = null
    private var tokenExpiresAt: Long? = null
    private var fingerprint: String? = null

    // Cache
    private var cachedConfig: WidgetConfig? = null
    private var cacheExpiresAt: Long? = null
    private val cacheTTL: Long = 5 * 60 * 1000 // 5 minutes in milliseconds

    // Timeouts
    private val configTimeout = 10_000 // 10 seconds
    private val submitTimeout = 15_000 // 15 seconds

    fun setFingerprint(fingerprint: String) {
        this.fingerprint = fingerprint
    }

    // MARK: - Fetch Config

    suspend fun fetchConfig(widgetId: String, forceRefresh: Boolean = false): WidgetConfig {
        return withContext(Dispatchers.IO) {
            // Check cache
            if (!forceRefresh) {
                cachedConfig?.let { cached ->
                    cacheExpiresAt?.let { expires ->
                        if (System.currentTimeMillis() < expires) {
                            return@withContext cached
                        }
                    }
                }
            }

            val url = URL("$baseUrl/api/v1/widgets/$widgetId/config")
            val connection = url.openConnection() as HttpURLConnection

            try {
                connection.requestMethod = "GET"
                connection.connectTimeout = configTimeout
                connection.readTimeout = configTimeout

                fingerprint?.let {
                    connection.setRequestProperty("X-Client-Fingerprint", it)
                }
                connection.setRequestProperty("X-FeedValue-SDK", "android/1.0.0")

                val responseCode = connection.responseCode
                val responseBody = if (responseCode in 200..299) {
                    connection.inputStream.bufferedReader().use { it.readText() }
                } else {
                    connection.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                }

                if (responseCode != 200) {
                    val message = parseErrorMessage(responseBody)
                    throw FeedValueError.ServerError(responseCode, message)
                }

                val configResponse = parseConfigResponse(responseBody)

                // Store token
                submissionToken = configResponse.submissionToken
                tokenExpiresAt = configResponse.tokenExpiresAt

                // Build widget config
                val widgetConfig = WidgetConfig(
                    widgetId = configResponse.widgetId,
                    name = configResponse.config.name,
                    promptText = configResponse.config.promptText,
                    thankYouMessage = configResponse.config.thankYouMessage
                )

                // Cache it
                cachedConfig = widgetConfig
                cacheExpiresAt = System.currentTimeMillis() + cacheTTL

                widgetConfig
            } catch (e: FeedValueError) {
                throw e
            } catch (e: Exception) {
                throw FeedValueError.NetworkError(e)
            } finally {
                connection.disconnect()
            }
        }
    }

    // MARK: - Submit Feedback

    suspend fun submitFeedback(
        widgetId: String,
        message: String,
        sentiment: Sentiment?,
        metadata: Map<String, String>
    ) {
        withContext(Dispatchers.IO) {
            // Refresh token if needed
            if (!hasValidToken()) {
                fetchConfig(widgetId, forceRefresh = true)
            }

            val token = submissionToken
                ?: throw FeedValueError.ServerError(403, "No submission token available")

            val url = URL("$baseUrl/api/v1/widgets/$widgetId/feedback")
            val connection = url.openConnection() as HttpURLConnection

            try {
                connection.requestMethod = "POST"
                connection.connectTimeout = submitTimeout
                connection.readTimeout = submitTimeout
                connection.doOutput = true

                connection.setRequestProperty("Content-Type", "application/json")
                connection.setRequestProperty("X-Submission-Token", token)
                fingerprint?.let {
                    connection.setRequestProperty("X-Client-Fingerprint", it)
                }
                connection.setRequestProperty("X-FeedValue-SDK", "android/1.0.0")

                // Build request body
                val body = JSONObject().apply {
                    put("message", message)
                    sentiment?.let { put("sentiment", it.value) }
                    if (metadata.isNotEmpty()) {
                        put("metadata", JSONObject(metadata))
                    }
                }

                OutputStreamWriter(connection.outputStream).use { writer ->
                    writer.write(body.toString())
                }

                val responseCode = connection.responseCode
                val responseBody = if (responseCode in 200..299) {
                    connection.inputStream.bufferedReader().use { it.readText() }
                } else {
                    connection.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                }

                // Handle token refresh on 403
                if (responseCode == 403) {
                    val errorMessage = parseErrorMessage(responseBody)
                    if (errorMessage?.contains("token") == true || errorMessage?.contains("expired") == true) {
                        // Retry with fresh token
                        submissionToken = null
                        fetchConfig(widgetId, forceRefresh = true)

                        submissionToken?.let { newToken ->
                            retrySubmit(url, newToken, body)
                            return@withContext
                        }
                    }
                    throw FeedValueError.ServerError(responseCode, errorMessage)
                }

                if (responseCode !in 200..299) {
                    val errorMessage = parseErrorMessage(responseBody)
                    throw FeedValueError.ServerError(responseCode, errorMessage)
                }

                // Check for soft block
                try {
                    val json = JSONObject(responseBody)
                    if (json.optBoolean("blocked", false)) {
                        val blockMessage = json.optString("message", "Submission blocked")
                        throw FeedValueError.ServerError(403, blockMessage)
                    }
                } catch (e: Exception) {
                    // Ignore JSON parse errors for success response
                    if (e is FeedValueError) throw e
                }
            } catch (e: FeedValueError) {
                throw e
            } catch (e: Exception) {
                throw FeedValueError.NetworkError(e)
            } finally {
                connection.disconnect()
            }
        }
    }

    // MARK: - Helpers

    private fun hasValidToken(): Boolean {
        if (submissionToken == null) return false
        val expiresAt = tokenExpiresAt ?: return false
        // Add 30 second buffer before expiry
        val bufferMs = 30_000
        return System.currentTimeMillis() < (expiresAt * 1000 - bufferMs)
    }

    private fun retrySubmit(url: URL, token: String, body: JSONObject) {
        val connection = url.openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = submitTimeout
            connection.readTimeout = submitTimeout
            connection.doOutput = true

            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("X-Submission-Token", token)
            fingerprint?.let {
                connection.setRequestProperty("X-Client-Fingerprint", it)
            }
            connection.setRequestProperty("X-FeedValue-SDK", "android/1.0.0")

            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(body.toString())
            }

            val responseCode = connection.responseCode
            if (responseCode !in 200..299) {
                val responseBody = connection.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                val errorMessage = parseErrorMessage(responseBody)
                throw FeedValueError.ServerError(responseCode, errorMessage)
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun parseConfigResponse(json: String): ConfigResponse {
        val obj = JSONObject(json)
        val configObj = obj.getJSONObject("config")

        return ConfigResponse(
            widgetId = obj.getString("widget_id"),
            config = WidgetConfigData(
                name = configObj.getString("name"),
                promptText = configObj.optString("prompt_text", null),
                thankYouMessage = configObj.optString("thank_you_message", null)
            ),
            submissionToken = obj.optString("submission_token", null),
            tokenExpiresAt = if (obj.has("token_expires_at")) obj.getLong("token_expires_at") else null
        )
    }

    private fun parseErrorMessage(json: String): String? {
        return try {
            val obj = JSONObject(json)
            obj.optString("detail", null)
                ?: obj.optString("message", null)
                ?: obj.optString("error", null)
        } catch (e: Exception) {
            json.takeIf { it.isNotBlank() }
        }
    }
}
