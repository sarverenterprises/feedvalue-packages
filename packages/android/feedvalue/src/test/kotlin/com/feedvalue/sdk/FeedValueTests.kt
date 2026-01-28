package com.feedvalue.sdk

import org.junit.Assert.*
import org.junit.Test

class FeedValueTests {

    // MARK: - FeedValueState Tests

    @Test
    fun `FeedValueState has correct default values`() {
        val state = FeedValueState()
        assertFalse(state.isReady)
        assertNull(state.config)
    }

    @Test
    fun `FeedValueState equality works correctly`() {
        val state1 = FeedValueState(isReady = true, config = null)
        val state2 = FeedValueState(isReady = true, config = null)
        assertEquals(state1, state2)
    }

    // MARK: - WidgetConfig Tests

    @Test
    fun `WidgetConfig stores all fields correctly`() {
        val config = WidgetConfig(
            widgetId = "test-123",
            name = "Test Widget",
            promptText = "How can we help?",
            thankYouMessage = "Thanks!"
        )

        assertEquals("test-123", config.widgetId)
        assertEquals("Test Widget", config.name)
        assertEquals("How can we help?", config.promptText)
        assertEquals("Thanks!", config.thankYouMessage)
    }

    @Test
    fun `WidgetConfig handles null optionals`() {
        val config = WidgetConfig(
            widgetId = "test-123",
            name = "Test Widget"
        )

        assertEquals("test-123", config.widgetId)
        assertEquals("Test Widget", config.name)
        assertNull(config.promptText)
        assertNull(config.thankYouMessage)
    }

    // MARK: - Feedback Tests

    @Test
    fun `Feedback creation with minimal fields`() {
        val feedback = Feedback(message = "Great app!")
        assertEquals("Great app!", feedback.message)
        assertNull(feedback.sentiment)
        assertNull(feedback.email)
        assertNull(feedback.metadata)
    }

    @Test
    fun `Feedback creation with all fields`() {
        val feedback = Feedback(
            message = "Love it!",
            sentiment = Sentiment.EXCITED,
            email = "user@example.com",
            metadata = mapOf("source" to "android")
        )

        assertEquals("Love it!", feedback.message)
        assertEquals(Sentiment.EXCITED, feedback.sentiment)
        assertEquals("user@example.com", feedback.email)
        assertEquals("android", feedback.metadata?.get("source"))
    }

    // MARK: - Sentiment Tests

    @Test
    fun `Sentiment has correct raw values`() {
        assertEquals("frustrated", Sentiment.FRUSTRATED.value)
        assertEquals("confused", Sentiment.CONFUSED.value)
        assertEquals("neutral", Sentiment.NEUTRAL.value)
        assertEquals("satisfied", Sentiment.SATISFIED.value)
        assertEquals("excited", Sentiment.EXCITED.value)
    }

    // MARK: - FeedValueError Tests

    @Test
    fun `NotInitialized error has correct message`() {
        val error = FeedValueError.NotInitialized
        assertTrue(error.message?.contains("not been initialized") == true)
    }

    @Test
    fun `NetworkError wraps underlying exception`() {
        val underlying = RuntimeException("Connection failed")
        val error = FeedValueError.NetworkError(underlying)
        assertTrue(error.message?.contains("Network error") == true)
        assertTrue(error.message?.contains("Connection failed") == true)
    }

    @Test
    fun `ServerError includes status code and message`() {
        val error = FeedValueError.ServerError(500, "Internal error")
        assertTrue(error.message?.contains("500") == true)
        assertTrue(error.message?.contains("Internal error") == true)
    }

    @Test
    fun `ServerError handles null message`() {
        val error = FeedValueError.ServerError(404, null)
        assertTrue(error.message?.contains("404") == true)
    }

    // MARK: - FeedValue Instance Tests

    @Test
    fun `getInstance returns null before initialize`() {
        val instance = FeedValue.getInstance("nonexistent-widget-id")
        assertNull(instance)
    }
}

// MARK: - API Response Parsing Tests

class FeedValueAPITests {

    @Test
    fun `ConfigResponse parsing works correctly`() {
        // Test data class creation (actual JSON parsing tested in integration)
        val config = WidgetConfigData(
            name = "Test Widget",
            promptText = "What do you think?",
            thankYouMessage = "Thank you!"
        )

        val response = ConfigResponse(
            widgetId = "widget-123",
            config = config,
            submissionToken = "token-abc",
            tokenExpiresAt = 1735689600L
        )

        assertEquals("widget-123", response.widgetId)
        assertEquals("Test Widget", response.config.name)
        assertEquals("token-abc", response.submissionToken)
        assertEquals(1735689600L, response.tokenExpiresAt)
    }

    @Test
    fun `ConfigResponse handles null optionals`() {
        val config = WidgetConfigData(
            name = "Test Widget",
            promptText = null,
            thankYouMessage = null
        )

        val response = ConfigResponse(
            widgetId = "widget-123",
            config = config,
            submissionToken = null,
            tokenExpiresAt = null
        )

        assertNull(response.submissionToken)
        assertNull(response.tokenExpiresAt)
        assertNull(response.config.promptText)
    }
}
