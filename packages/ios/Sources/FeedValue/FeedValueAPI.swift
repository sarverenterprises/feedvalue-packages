import Foundation

/// API response for config endpoint
struct ConfigResponse: Codable {
    let widgetId: String
    let config: WidgetConfigData
    let submissionToken: String?
    let tokenExpiresAt: Int?

    enum CodingKeys: String, CodingKey {
        case widgetId = "widget_id"
        case config
        case submissionToken = "submission_token"
        case tokenExpiresAt = "token_expires_at"
    }
}

struct WidgetConfigData: Codable {
    let name: String
    let promptText: String?
    let thankYouMessage: String?

    enum CodingKeys: String, CodingKey {
        case name
        case promptText = "prompt_text"
        case thankYouMessage = "thank_you_message"
    }
}

/// API response for feedback endpoint
struct FeedbackResponse: Codable {
    let feedbackId: String?
    let success: Bool?
    let blocked: Bool?
    let message: String?

    enum CodingKeys: String, CodingKey {
        case feedbackId = "feedback_id"
        case success
        case blocked
        case message
    }
}

/// Error response from API
struct ErrorResponse: Codable {
    let detail: String?
    let message: String?
    let error: String?
}

/// FeedValue API client
final class FeedValueAPI: @unchecked Sendable {

    private let baseUrl: String
    private let session: URLSession

    // Token lifecycle
    private var submissionToken: String?
    private var tokenExpiresAt: Int?
    private var fingerprint: String?

    // Cache
    private var cachedConfig: WidgetConfig?
    private var cacheExpiresAt: Date?
    private let cacheTTL: TimeInterval = 5 * 60 // 5 minutes

    // Timeouts
    private let configTimeout: TimeInterval = 10
    private let submitTimeout: TimeInterval = 15

    init(baseUrl: String) {
        self.baseUrl = baseUrl.trimmingCharacters(in: CharacterSet(charactersIn: "/"))

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = configTimeout
        self.session = URLSession(configuration: config)
    }

    func setFingerprint(_ fingerprint: String) {
        self.fingerprint = fingerprint
    }

    // MARK: - Fetch Config

    func fetchConfig(widgetId: String, forceRefresh: Bool = false) async throws -> WidgetConfig {
        // Check cache
        if !forceRefresh, let cached = cachedConfig, let expires = cacheExpiresAt, Date() < expires {
            return cached
        }

        guard let url = URL(string: "\(baseUrl)/api/v1/widgets/\(widgetId)/config") else {
            throw FeedValueError.serverError(statusCode: 0, message: "Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = configTimeout

        if let fingerprint = fingerprint {
            request.setValue(fingerprint, forHTTPHeaderField: "X-Client-Fingerprint")
        }
        request.setValue("ios/1.0.0", forHTTPHeaderField: "X-FeedValue-SDK")

        let (data, response) = try await performRequest(request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw FeedValueError.networkError(underlying: URLError(.badServerResponse))
        }

        if httpResponse.statusCode != 200 {
            let message = parseErrorMessage(from: data)
            throw FeedValueError.serverError(statusCode: httpResponse.statusCode, message: message)
        }

        let configResponse = try JSONDecoder().decode(ConfigResponse.self, from: data)

        // Store token
        self.submissionToken = configResponse.submissionToken
        self.tokenExpiresAt = configResponse.tokenExpiresAt

        // Build widget config
        let widgetConfig = WidgetConfig(
            widgetId: configResponse.widgetId,
            name: configResponse.config.name,
            promptText: configResponse.config.promptText,
            thankYouMessage: configResponse.config.thankYouMessage
        )

        // Cache it
        self.cachedConfig = widgetConfig
        self.cacheExpiresAt = Date().addingTimeInterval(cacheTTL)

        return widgetConfig
    }

    // MARK: - Submit Feedback

    func submitFeedback(
        widgetId: String,
        message: String,
        sentiment: Sentiment?,
        metadata: [String: String]
    ) async throws {
        // Refresh token if needed
        if !hasValidToken() {
            _ = try await fetchConfig(widgetId: widgetId, forceRefresh: true)
        }

        guard let token = submissionToken else {
            throw FeedValueError.serverError(statusCode: 403, message: "No submission token available")
        }

        guard let url = URL(string: "\(baseUrl)/api/v1/widgets/\(widgetId)/feedback") else {
            throw FeedValueError.serverError(statusCode: 0, message: "Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = submitTimeout
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(token, forHTTPHeaderField: "X-Submission-Token")

        if let fingerprint = fingerprint {
            request.setValue(fingerprint, forHTTPHeaderField: "X-Client-Fingerprint")
        }
        request.setValue("ios/1.0.0", forHTTPHeaderField: "X-FeedValue-SDK")

        // Build request body
        var body: [String: Any] = ["message": message]

        if let sentiment = sentiment {
            body["sentiment"] = sentiment.rawValue
        }

        if !metadata.isEmpty {
            body["metadata"] = metadata
        }

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await performRequest(request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw FeedValueError.networkError(underlying: URLError(.badServerResponse))
        }

        // Handle token refresh on 403
        if httpResponse.statusCode == 403 {
            let errorMessage = parseErrorMessage(from: data)
            if errorMessage?.contains("token") == true || errorMessage?.contains("expired") == true {
                // Retry with fresh token
                self.submissionToken = nil
                _ = try await fetchConfig(widgetId: widgetId, forceRefresh: true)

                if let newToken = self.submissionToken {
                    request.setValue(newToken, forHTTPHeaderField: "X-Submission-Token")
                    let (retryData, retryResponse) = try await performRequest(request)

                    guard let retryHttpResponse = retryResponse as? HTTPURLResponse else {
                        throw FeedValueError.networkError(underlying: URLError(.badServerResponse))
                    }

                    if retryHttpResponse.statusCode >= 200 && retryHttpResponse.statusCode < 300 {
                        return // Success on retry
                    }

                    let retryMessage = parseErrorMessage(from: retryData)
                    throw FeedValueError.serverError(statusCode: retryHttpResponse.statusCode, message: retryMessage)
                }
            }
            throw FeedValueError.serverError(statusCode: httpResponse.statusCode, message: errorMessage)
        }

        if httpResponse.statusCode < 200 || httpResponse.statusCode >= 300 {
            let message = parseErrorMessage(from: data)
            throw FeedValueError.serverError(statusCode: httpResponse.statusCode, message: message)
        }

        // Check for soft block
        if let feedbackResponse = try? JSONDecoder().decode(FeedbackResponse.self, from: data),
           feedbackResponse.blocked == true {
            throw FeedValueError.serverError(statusCode: 403, message: feedbackResponse.message ?? "Submission blocked")
        }
    }

    // MARK: - Helpers

    private func hasValidToken() -> Bool {
        guard submissionToken != nil, let expiresAt = tokenExpiresAt else {
            return false
        }
        // Add 30 second buffer before expiry
        let bufferSeconds = 30
        return Int(Date().timeIntervalSince1970) < (expiresAt - bufferSeconds)
    }

    private func performRequest(_ request: URLRequest) async throws -> (Data, URLResponse) {
        do {
            return try await session.data(for: request)
        } catch let error as URLError {
            throw FeedValueError.networkError(underlying: error)
        } catch {
            throw FeedValueError.networkError(underlying: error)
        }
    }

    private func parseErrorMessage(from data: Data) -> String? {
        if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
            return errorResponse.detail ?? errorResponse.message ?? errorResponse.error
        }
        return String(data: data, encoding: .utf8)
    }
}
