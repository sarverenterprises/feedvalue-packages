package com.feedvalue.sdk

import android.content.Context
import android.provider.Settings
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import java.security.MessageDigest
import java.util.UUID
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import android.util.Base64

/**
 * Device identifier for fingerprinting with Keystore persistence
 */
internal class DeviceIdentifier(private val context: Context) {

    private val keystoreAlias = "feedvalue_device_key"
    private val prefsName = "feedvalue_prefs"
    private val fingerprintKey = "device_fingerprint"
    private val ivKey = "device_fingerprint_iv"

    fun getOrCreateFingerprint(): String {
        // 1. Try to retrieve existing fingerprint from encrypted storage
        getStoredFingerprint()?.let { return it }

        // 2. Generate from ANDROID_ID or UUID
        val identifier = getDeviceIdentifier()
        val hashed = sha256Hash(identifier)

        // 3. Store encrypted in SharedPreferences (backed by Keystore)
        storeFingerprint(hashed)

        return hashed
    }

    // MARK: - Private Helpers

    private fun getDeviceIdentifier(): String {
        return try {
            val androidId = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ANDROID_ID
            )
            androidId?.takeIf { it.isNotBlank() } ?: UUID.randomUUID().toString()
        } catch (e: Exception) {
            UUID.randomUUID().toString()
        }
    }

    private fun sha256Hash(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }

    // MARK: - Keystore-backed Storage

    private fun getStoredFingerprint(): String? {
        return try {
            val prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
            val encryptedData = prefs.getString(fingerprintKey, null) ?: return null
            val ivString = prefs.getString(ivKey, null) ?: return null

            val secretKey = getOrCreateSecretKey()
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val iv = Base64.decode(ivString, Base64.DEFAULT)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, GCMParameterSpec(128, iv))

            val decrypted = cipher.doFinal(Base64.decode(encryptedData, Base64.DEFAULT))
            String(decrypted)
        } catch (e: Exception) {
            // If decryption fails, clear and regenerate
            null
        }
    }

    private fun storeFingerprint(fingerprint: String) {
        try {
            val secretKey = getOrCreateSecretKey()
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.ENCRYPT_MODE, secretKey)

            val encrypted = cipher.doFinal(fingerprint.toByteArray())
            val iv = cipher.iv

            context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
                .edit()
                .putString(fingerprintKey, Base64.encodeToString(encrypted, Base64.DEFAULT))
                .putString(ivKey, Base64.encodeToString(iv, Base64.DEFAULT))
                .apply()
        } catch (e: Exception) {
            // Silent failure - fingerprint will regenerate on next launch
        }
    }

    private fun getOrCreateSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null)

        // Return existing key if present
        keyStore.getKey(keystoreAlias, null)?.let { return it as SecretKey }

        // Generate new key
        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            "AndroidKeyStore"
        )

        val spec = KeyGenParameterSpec.Builder(
            keystoreAlias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build()

        keyGenerator.init(spec)
        return keyGenerator.generateKey()
    }
}
