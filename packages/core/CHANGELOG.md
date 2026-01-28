# @feedvalue/core

## 0.1.6

### Patch Changes

- **Trigger button styling**: Fixed icon mode to match widget-bundle behavior exactly
  - Icon mode now renders a circular 56x56px button with only the SVG icon (no text)
  - Text mode renders a rectangular button with text only
  - Updated SVG icons to match widget-bundle exactly (chat, message, feedback, comment, help, lightbulb)
- **CSS improvements**: Added `.fv-widget-trigger-icon` class for circular icon-only buttons

## 0.1.5

### Patch Changes

- **Trigger icon rendering**: Added SVG icon support for trigger button. Icons now render correctly when `triggerIcon` is set to `chat`, `message`, `feedback`, `comment`, `help`, or `lightbulb`
- **Icon styling**: Added flexbox layout and proper spacing for trigger buttons with icons
- **Security**: Uses DOMParser for safe SVG parsing instead of innerHTML

## 0.1.4

### Patch Changes

- Fix npm publishing by replacing workspace:^ with explicit version for @feedvalue/core dependency in react and vue packages

## 0.1.2

### Patch Changes

- **Fingerprint format**: Changed session fingerprint from UUID to 32-character hex string to match core-api's TokenPayload validator
- **API client improvements**: Added `forceRefresh` option to `fetchConfig()` for token refresh scenarios
- **Enhanced logging**: Improved debug logging for config fetching and token handling
- **Documentation**: Added custom fields usage examples to README

## 0.1.1

### Patch Changes

- Fix ESLint 9 flat config, add Node 24 CI testing, enable OIDC trusted publishing
