# FeedValue iOS SDK

Native iOS SDK for FeedValue widget integration. Headless API client with state management - build your own UI.

## Installation

### Swift Package Manager

Add to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/feedvalue/feedvalue-ios.git", from: "1.0.0")
]
```

Or in Xcode: File → Add Package Dependencies → Enter the repository URL.

## Quick Start

```swift
import FeedValue
import Combine

// 1. Initialize
let feedValue = try await FeedValue.initialize(widgetId: "your-widget-id")

// 2. Observe state
var cancellables = Set<AnyCancellable>()

feedValue.state
    .sink { state in
        print("Ready: \(state.isReady)")
        if let config = state.config {
            print("Prompt: \(config.promptText ?? "Share your feedback")")
        }
    }
    .store(in: &cancellables)

// 3. Submit feedback
let feedback = Feedback(
    message: "Great app!",
    sentiment: .satisfied,
    email: "user@example.com"
)
try await feedValue.submit(feedback)
```

## API Reference

### FeedValue

```swift
// Initialize (async)
let feedValue = try await FeedValue.initialize(widgetId: "widget-id")

// Get existing instance
if let feedValue = FeedValue.getInstance(widgetId: "widget-id") {
    // Use existing instance
}

// Current state (synchronous)
let state = feedValue.currentState

// State publisher (Combine)
feedValue.state
    .sink { state in /* handle state changes */ }
    .store(in: &cancellables)

// Submit feedback
try await feedValue.submit(Feedback(message: "Hello!"))

// User identification (optional)
feedValue.setUser(id: "user-123", email: "user@example.com", name: "John")
feedValue.clearUser()
```

### Types

```swift
// State
struct FeedValueState {
    let isReady: Bool
    let config: WidgetConfig?
}

// Widget configuration (from server)
struct WidgetConfig {
    let widgetId: String
    let name: String
    let promptText: String?
    let thankYouMessage: String?
}

// Feedback submission
struct Feedback {
    let message: String
    let sentiment: Sentiment?
    let email: String?
    let metadata: [String: String]?
}

// Sentiment values
enum Sentiment: String {
    case frustrated, confused, neutral, satisfied, excited
}
```

### Error Handling

```swift
do {
    try await feedValue.submit(feedback)
} catch FeedValueError.notInitialized {
    // SDK not initialized - call initialize() first
} catch FeedValueError.networkError(let underlying) {
    // Network issue - show retry UI
    print("Network error: \(underlying.localizedDescription)")
} catch FeedValueError.serverError(let statusCode, let message) {
    // Server error - log for debugging
    print("Server error \(statusCode): \(message ?? "Unknown")")
}
```

## Requirements

- iOS 15.0+
- macOS 12.0+
- Swift 5.9+

## License

MIT
