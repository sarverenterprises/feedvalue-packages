import Foundation
import CryptoKit
#if os(iOS)
import UIKit
#endif

/// Device identifier for fingerprinting
final class DeviceIdentifier: @unchecked Sendable {

    private let keychainKey = "com.feedvalue.device_id"

    func getOrCreateFingerprint() -> String {
        // 1. Check Keychain for existing fingerprint
        if let existing = keychainGet(key: keychainKey) {
            return existing
        }

        // 2. Generate from identifierForVendor or UUID
        let identifier = getDeviceIdentifier()
        let hashed = sha256Hash(identifier)

        // 3. Store in Keychain
        keychainSet(value: hashed, key: keychainKey)

        return hashed
    }

    // MARK: - Private Helpers

    private func getDeviceIdentifier() -> String {
        #if os(iOS)
        if let vendorID = UIDevice.current.identifierForVendor?.uuidString {
            return vendorID
        }
        #endif
        // Fallback to random UUID
        return UUID().uuidString
    }

    private func sha256Hash(_ input: String) -> String {
        let data = Data(input.utf8)
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }

    // MARK: - Keychain Access (Inlined)

    private func keychainGet(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let string = String(data: data, encoding: .utf8) else {
            return nil
        }

        return string
    }

    private func keychainSet(value: String, key: String) {
        let data = Data(value.utf8)

        // Delete existing item first
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        // Add new item
        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]

        SecItemAdd(addQuery as CFDictionary, nil)
    }
}
