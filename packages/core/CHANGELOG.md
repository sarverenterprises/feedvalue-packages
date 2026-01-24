# @feedvalue/core

## 0.1.2

### Patch Changes

- **Fingerprint format**: Changed session fingerprint from UUID to 32-character hex string to match core-api's TokenPayload validator
- **API client improvements**: Added `forceRefresh` option to `fetchConfig()` for token refresh scenarios
- **Enhanced logging**: Improved debug logging for config fetching and token handling
- **Documentation**: Added custom fields usage examples to README

## 0.1.1

### Patch Changes

- Fix ESLint 9 flat config, add Node 24 CI testing, enable OIDC trusted publishing
