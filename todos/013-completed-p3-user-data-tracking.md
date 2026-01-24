# Implementation: User Data Tracking in API Submissions

---
status: completed
priority: p3
issue_id: "013"
tags: [code-review, feature, user-data]
dependencies: []
---

## Problem Statement

The `identify()`, `setData()`, `reset()`, and `getUserData()` methods existed but the user data was **never sent to the API**. This was misleading dead code.

## Resolution

**Chose Option 2: Implement Properly**

User data is now included in feedback submissions to the API.

## Implementation Details

### Changes Made

1. **`packages/core/src/types.ts`**
   - Added `SubmissionUserData` interface for API payload
   - Exported the new type

2. **`packages/core/src/api-client.ts`**
   - Updated `submitFeedback()` to accept optional `userData` parameter
   - User data is included in request body under `user` key

3. **`packages/core/src/feedvalue.ts`**
   - Added `buildSubmissionUserData()` private method
   - Updated `submit()` to build and pass user data to API client
   - Combines data from both `identify()` and `setData()` calls

### API Payload Structure

When user data is set via `identify()` or `setData()`, the feedback submission includes:

```json
{
  "message": "Feedback content",
  "metadata": { ... },
  "user": {
    "user_id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "traits": { "plan": "pro", "company": "Acme" },
    "custom_data": { "customField": "value" }
  }
}
```

### Data Priority

- `email` and `name` from `setData()` take priority over `identify()` traits
- User ID only comes from `identify()`
- Custom data from `setData()` goes to `custom_data`
- Other traits from `identify()` go to `traits`

## Tests Added

7 new tests in `feedvalue.test.ts`:
- Should include user data from identify() in submission
- Should include user data from setData() in submission
- Should combine identify() and setData() in submission
- Should not include user field if no user data set
- Should not include user field after reset()
- Should prefer setData email/name over identify traits
- All 127 tests passing

## Acceptance Criteria

- [x] User data fully implemented and sent to API
- [x] Tests cover all scenarios
- [x] Documentation reflects actual functionality

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by code-simplicity-reviewer agent |
| 2026-01-23 | Implemented Option B | User data now properly sent with feedback submissions |
