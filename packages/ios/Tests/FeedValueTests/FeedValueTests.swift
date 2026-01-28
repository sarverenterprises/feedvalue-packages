import XCTest
import Combine
@testable import FeedValue

final class FeedValueTests: XCTestCase {

    // MARK: - FeedValueState Tests

    func testFeedValueStateDefaultValues() {
        let state = FeedValueState()
        XCTAssertFalse(state.isReady)
        XCTAssertNil(state.config)
    }

    func testFeedValueStateEquality() {
        let state1 = FeedValueState(isReady: true, config: nil)
        let state2 = FeedValueState(isReady: true, config: nil)
        XCTAssertEqual(state1, state2)
    }

    // MARK: - WidgetConfig Tests

    func testWidgetConfigDecoding() throws {
        let json = """
        {
            "widget_id": "test-123",
            "name": "Test Widget",
            "prompt_text": "How can we help?",
            "thank_you_message": "Thanks!"
        }
        """
        let data = json.data(using: .utf8)!
        let config = try JSONDecoder().decode(WidgetConfig.self, from: data)

        XCTAssertEqual(config.widgetId, "test-123")
        XCTAssertEqual(config.name, "Test Widget")
        XCTAssertEqual(config.promptText, "How can we help?")
        XCTAssertEqual(config.thankYouMessage, "Thanks!")
    }

    func testWidgetConfigDecodingWithNilOptionals() throws {
        let json = """
        {
            "widget_id": "test-123",
            "name": "Test Widget"
        }
        """
        let data = json.data(using: .utf8)!
        let config = try JSONDecoder().decode(WidgetConfig.self, from: data)

        XCTAssertEqual(config.widgetId, "test-123")
        XCTAssertEqual(config.name, "Test Widget")
        XCTAssertNil(config.promptText)
        XCTAssertNil(config.thankYouMessage)
    }

    // MARK: - Feedback Tests

    func testFeedbackCreation() {
        let feedback = Feedback(message: "Great app!")
        XCTAssertEqual(feedback.message, "Great app!")
        XCTAssertNil(feedback.sentiment)
        XCTAssertNil(feedback.email)
        XCTAssertNil(feedback.metadata)
    }

    func testFeedbackWithAllFields() {
        let feedback = Feedback(
            message: "Love it!",
            sentiment: .excited,
            email: "user@example.com",
            metadata: ["source": "ios"]
        )
        XCTAssertEqual(feedback.message, "Love it!")
        XCTAssertEqual(feedback.sentiment, .excited)
        XCTAssertEqual(feedback.email, "user@example.com")
        XCTAssertEqual(feedback.metadata?["source"], "ios")
    }

    // MARK: - Sentiment Tests

    func testSentimentRawValues() {
        XCTAssertEqual(Sentiment.frustrated.rawValue, "frustrated")
        XCTAssertEqual(Sentiment.confused.rawValue, "confused")
        XCTAssertEqual(Sentiment.neutral.rawValue, "neutral")
        XCTAssertEqual(Sentiment.satisfied.rawValue, "satisfied")
        XCTAssertEqual(Sentiment.excited.rawValue, "excited")
    }

    // MARK: - FeedValueError Tests

    func testErrorDescriptions() {
        let notInitError = FeedValueError.notInitialized
        XCTAssertTrue(notInitError.localizedDescription.contains("not been initialized"))

        let networkError = FeedValueError.networkError(underlying: URLError(.notConnectedToInternet))
        XCTAssertTrue(networkError.localizedDescription.contains("Network error"))

        let serverError = FeedValueError.serverError(statusCode: 500, message: "Internal error")
        XCTAssertTrue(serverError.localizedDescription.contains("500"))
        XCTAssertTrue(serverError.localizedDescription.contains("Internal error"))

        let serverErrorNoMessage = FeedValueError.serverError(statusCode: 404, message: nil)
        XCTAssertTrue(serverErrorNoMessage.localizedDescription.contains("404"))
    }

    // MARK: - FeedValue Instance Tests

    func testGetInstanceReturnsNilBeforeInitialize() {
        let instance = FeedValue.getInstance(widgetId: "nonexistent-widget-id")
        XCTAssertNil(instance)
    }
}

// MARK: - Mock URL Protocol for API Tests

final class MockURLProtocol: URLProtocol {
    static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool {
        return true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        return request
    }

    override func startLoading() {
        guard let handler = MockURLProtocol.requestHandler else {
            XCTFail("No request handler set")
            return
        }

        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

// MARK: - API Tests

final class FeedValueAPITests: XCTestCase {

    func testConfigResponseDecoding() throws {
        let json = """
        {
            "widget_id": "widget-123",
            "config": {
                "name": "Test Widget",
                "prompt_text": "What do you think?",
                "thank_you_message": "Thank you!"
            },
            "submission_token": "token-abc",
            "token_expires_at": 1735689600
        }
        """
        let data = json.data(using: .utf8)!
        let response = try JSONDecoder().decode(ConfigResponse.self, from: data)

        XCTAssertEqual(response.widgetId, "widget-123")
        XCTAssertEqual(response.config.name, "Test Widget")
        XCTAssertEqual(response.config.promptText, "What do you think?")
        XCTAssertEqual(response.submissionToken, "token-abc")
        XCTAssertEqual(response.tokenExpiresAt, 1735689600)
    }

    func testFeedbackResponseDecoding() throws {
        let json = """
        {
            "feedback_id": "fb-123",
            "success": true,
            "blocked": false,
            "message": "Feedback submitted"
        }
        """
        let data = json.data(using: .utf8)!
        let response = try JSONDecoder().decode(FeedbackResponse.self, from: data)

        XCTAssertEqual(response.feedbackId, "fb-123")
        XCTAssertEqual(response.success, true)
        XCTAssertEqual(response.blocked, false)
        XCTAssertEqual(response.message, "Feedback submitted")
    }

    func testErrorResponseDecoding() throws {
        let json = """
        {
            "detail": "Widget not found",
            "message": null,
            "error": null
        }
        """
        let data = json.data(using: .utf8)!
        let response = try JSONDecoder().decode(ErrorResponse.self, from: data)

        XCTAssertEqual(response.detail, "Widget not found")
        XCTAssertNil(response.message)
    }
}

// MARK: - DeviceIdentifier Tests

final class DeviceIdentifierTests: XCTestCase {

    func testFingerprintConsistency() {
        let identifier = DeviceIdentifier()

        let fingerprint1 = identifier.getOrCreateFingerprint()
        let fingerprint2 = identifier.getOrCreateFingerprint()

        // Same instance should return same fingerprint
        XCTAssertEqual(fingerprint1, fingerprint2)

        // Fingerprint should be 64 characters (SHA-256 hex)
        XCTAssertEqual(fingerprint1.count, 64)
    }

    func testFingerprintFormat() {
        let identifier = DeviceIdentifier()
        let fingerprint = identifier.getOrCreateFingerprint()

        // Should be valid hex string
        let hexCharacterSet = CharacterSet(charactersIn: "0123456789abcdef")
        XCTAssertTrue(fingerprint.unicodeScalars.allSatisfy { hexCharacterSet.contains($0) })
    }
}
