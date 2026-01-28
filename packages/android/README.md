# FeedValue Android SDK

Native Android SDK for FeedValue widget integration. Headless API client with state management - build your own UI.

## Installation

### Gradle

Add to your `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.feedvalue:sdk:1.0.0")
}
```

Or for Groovy DSL (`build.gradle`):

```groovy
dependencies {
    implementation 'com.feedvalue:sdk:1.0.0'
}
```

## Quick Start

```kotlin
import com.feedvalue.sdk.FeedValue
import com.feedvalue.sdk.Feedback
import com.feedvalue.sdk.Sentiment
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

// 1. Initialize (in a coroutine scope)
val feedValue = FeedValue.initialize(context, "your-widget-id")

// 2. Observe state
lifecycleScope.launch {
    feedValue.state.collect { state ->
        println("Ready: ${state.isReady}")
        state.config?.let { config ->
            println("Prompt: ${config.promptText ?: "Share your feedback"}")
        }
    }
}

// 3. Submit feedback
val feedback = Feedback(
    message = "Great app!",
    sentiment = Sentiment.SATISFIED,
    email = "user@example.com"
)
feedValue.submit(feedback)
```

## API Reference

### FeedValue

```kotlin
// Initialize (suspend function)
val feedValue = FeedValue.initialize(context, "widget-id")

// Get existing instance
FeedValue.getInstance("widget-id")?.let { feedValue ->
    // Use existing instance
}

// State as StateFlow
feedValue.state.collect { state ->
    // Handle state changes
}

// Submit feedback
feedValue.submit(Feedback(message = "Hello!"))

// User identification (optional)
feedValue.setUser(id = "user-123", email = "user@example.com", name = "John")
feedValue.clearUser()
```

### Types

```kotlin
// State
data class FeedValueState(
    val isReady: Boolean,
    val config: WidgetConfig?
)

// Widget configuration (from server)
data class WidgetConfig(
    val widgetId: String,
    val name: String,
    val promptText: String?,
    val thankYouMessage: String?
)

// Feedback submission
data class Feedback(
    val message: String,
    val sentiment: Sentiment? = null,
    val email: String? = null,
    val metadata: Map<String, String>? = null
)

// Sentiment values
enum class Sentiment {
    FRUSTRATED, CONFUSED, NEUTRAL, SATISFIED, EXCITED
}
```

### Error Handling

```kotlin
try {
    feedValue.submit(feedback)
} catch (e: FeedValueError) {
    when (e) {
        is FeedValueError.NotInitialized -> {
            // SDK not initialized - call initialize() first
        }
        is FeedValueError.NetworkError -> {
            // Network issue - show retry UI
            println("Network error: ${e.underlying.message}")
        }
        is FeedValueError.ServerError -> {
            // Server error - log for debugging
            println("Server error ${e.statusCode}: ${e.serverMessage}")
        }
    }
}
```

## Permissions

The SDK requires the `INTERNET` permission (automatically included in the library manifest):

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## Requirements

- Android API 28+ (Android 9.0)
- Kotlin 1.9+
- Kotlin Coroutines

## ProGuard Rules

If you use ProGuard/R8, add these rules:

```proguard
-keep class com.feedvalue.sdk.** { *; }
-keepclassmembers class com.feedvalue.sdk.** { *; }
```

## License

MIT
