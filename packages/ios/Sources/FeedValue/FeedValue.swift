import Foundation
import Combine

// MARK: - Public Types

/// FeedValue SDK state
public struct FeedValueState: Equatable, Sendable {
    /// Whether the SDK is ready to submit feedback
    public let isReady: Bool
    /// Widget configuration from the server
    public let config: WidgetConfig?

    public init(isReady: Bool = false, config: WidgetConfig? = nil) {
        self.isReady = isReady
        self.config = config
    }
}

/// Widget configuration from the server
public struct WidgetConfig: Equatable, Sendable, Codable {
    public let widgetId: String
    public let name: String
    public let promptText: String?
    public let thankYouMessage: String?

    enum CodingKeys: String, CodingKey {
        case widgetId = "widget_id"
        case name
        case promptText = "prompt_text"
        case thankYouMessage = "thank_you_message"
    }
}

/// Feedback data to submit
public struct Feedback: Sendable {
    public let message: String
    public let sentiment: Sentiment?
    public let email: String?
    public let metadata: [String: String]?

    public init(
        message: String,
        sentiment: Sentiment? = nil,
        email: String? = nil,
        metadata: [String: String]? = nil
    ) {
        self.message = message
        self.sentiment = sentiment
        self.email = email
        self.metadata = metadata
    }
}

/// Feedback sentiment values
public enum Sentiment: String, Sendable, Codable {
    case frustrated
    case confused
    case neutral
    case satisfied
    case excited
}

/// FeedValue SDK errors
public enum FeedValueError: Error, Sendable {
    /// SDK has not been initialized
    case notInitialized
    /// Network connectivity or timeout error
    case networkError(underlying: Error)
    /// Server returned an error response
    case serverError(statusCode: Int, message: String?)
}

extension FeedValueError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "FeedValue SDK has not been initialized. Call FeedValue.initialize() first."
        case .networkError(let underlying):
            return "Network error: \(underlying.localizedDescription)"
        case .serverError(let statusCode, let message):
            if let message = message {
                return "Server error (\(statusCode)): \(message)"
            }
            return "Server error: HTTP \(statusCode)"
        }
    }
}

// MARK: - FeedValue SDK

/// FeedValue SDK for iOS
///
/// ## Usage
/// ```swift
/// // Initialize
/// let feedValue = try await FeedValue.initialize(widgetId: "your-widget-id")
///
/// // Observe state
/// feedValue.state
///     .sink { state in
///         print("Ready: \(state.isReady)")
///     }
///     .store(in: &cancellables)
///
/// // Submit feedback
/// try await feedValue.submit(Feedback(message: "Great app!"))
///
/// // User identification (optional)
/// feedValue.setUser(id: "user-123", email: "user@example.com")
/// ```
public final class FeedValue: @unchecked Sendable {

    // MARK: - Instance Registry

    private static let registry = InstanceRegistry()

    /// Get an existing FeedValue instance for a widget ID
    public static func getInstance(widgetId: String) -> FeedValue? {
        registry.get(widgetId: widgetId)
    }

    /// Initialize FeedValue for a widget
    /// Returns existing instance if already initialized
    public static func initialize(
        widgetId: String,
        apiBaseUrl: String = "https://api.feedvalue.com"
    ) async throws -> FeedValue {
        if let existing = registry.get(widgetId: widgetId) {
            return existing
        }

        let instance = FeedValue(widgetId: widgetId, apiBaseUrl: apiBaseUrl)
        try await instance.doInitialize()

        registry.set(widgetId: widgetId, instance: instance)

        return instance
    }

    // Thread-safe instance storage
    private final class InstanceRegistry: @unchecked Sendable {
        private var instances: [String: FeedValue] = [:]
        private let lock = NSLock()

        func get(widgetId: String) -> FeedValue? {
            lock.lock()
            defer { lock.unlock() }
            return instances[widgetId]
        }

        func set(widgetId: String, instance: FeedValue) {
            lock.lock()
            defer { lock.unlock() }
            instances[widgetId] = instance
        }
    }

    // MARK: - Properties

    private let widgetId: String
    private let api: FeedValueAPI
    private let deviceIdentifier: DeviceIdentifier

    private let stateSubject = CurrentValueSubject<FeedValueState, Never>(FeedValueState())

    /// Current SDK state as a Combine publisher
    public var state: AnyPublisher<FeedValueState, Never> {
        stateSubject.eraseToAnyPublisher()
    }

    /// Current SDK state (synchronous access)
    public var currentState: FeedValueState {
        stateSubject.value
    }

    // User data
    private var userId: String?
    private var userEmail: String?
    private var userName: String?

    // MARK: - Initialization

    private init(widgetId: String, apiBaseUrl: String) {
        self.widgetId = widgetId
        self.api = FeedValueAPI(baseUrl: apiBaseUrl)
        self.deviceIdentifier = DeviceIdentifier()
    }

    private func doInitialize() async throws {
        // Get device fingerprint
        let fingerprint = deviceIdentifier.getOrCreateFingerprint()
        api.setFingerprint(fingerprint)

        // Fetch config
        let config = try await api.fetchConfig(widgetId: widgetId)

        // Update state
        stateSubject.send(FeedValueState(isReady: true, config: config))
    }

    // MARK: - Public API

    /// Submit feedback
    public func submit(_ feedback: Feedback) async throws {
        guard currentState.isReady else {
            throw FeedValueError.notInitialized
        }

        // Collect mobile metadata
        var metadata = feedback.metadata ?? [:]
        metadata["platform"] = "ios"
        metadata["sdk_version"] = "1.0.0"
        metadata["device_model"] = deviceModel()
        metadata["os_version"] = osVersion()
        metadata["app_bundle_id"] = bundleIdentifier()
        metadata["locale"] = Locale.current.identifier

        // Add user data if set
        if let userId = userId {
            metadata["user_id"] = userId
        }
        if let email = feedback.email ?? userEmail {
            metadata["user_email"] = email
        }
        if let name = userName {
            metadata["user_name"] = name
        }

        try await api.submitFeedback(
            widgetId: widgetId,
            message: feedback.message,
            sentiment: feedback.sentiment,
            metadata: metadata
        )
    }

    /// Set user identity
    public func setUser(id: String, email: String? = nil, name: String? = nil) {
        self.userId = id
        self.userEmail = email
        self.userName = name
    }

    /// Clear user identity
    public func clearUser() {
        self.userId = nil
        self.userEmail = nil
        self.userName = nil
    }

    // MARK: - Device Info Helpers

    private func deviceModel() -> String {
        var systemInfo = utsname()
        uname(&systemInfo)
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        let identifier = machineMirror.children.reduce("") { identifier, element in
            guard let value = element.value as? Int8, value != 0 else { return identifier }
            return identifier + String(UnicodeScalar(UInt8(value)))
        }
        return identifier
    }

    private func osVersion() -> String {
        #if os(iOS)
        return UIDevice.current.systemVersion
        #elseif os(macOS)
        let version = ProcessInfo.processInfo.operatingSystemVersion
        return "\(version.majorVersion).\(version.minorVersion).\(version.patchVersion)"
        #else
        return "unknown"
        #endif
    }

    private func bundleIdentifier() -> String {
        Bundle.main.bundleIdentifier ?? "unknown"
    }
}

#if os(iOS)
import UIKit
#endif
