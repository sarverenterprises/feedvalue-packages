# Widget ID Path Traversal / Injection

---
status: pending
priority: p1
issue_id: "002"
tags: [code-review, security, input-validation]
dependencies: []
---

## Problem Statement

The `widgetId` is directly interpolated into URL paths without validation. A malicious `widgetId` could cause path traversal or URL injection.

**Why it matters:** Could allow attackers to manipulate API requests or access unintended endpoints.

## Findings

**Agent:** security-sentinel

**Location:** `/packages/core/src/api-client.ts` lines 108-109, 157

```typescript
const url = `${this.baseUrl}/api/v1/widgets/${widgetId}/config`;
// and
const url = `${this.baseUrl}/api/v1/widgets/${widgetId}/feedback`;
```

**Attack scenarios:**
1. Path traversal: `../../../admin/config`
2. URL injection with encoded characters
3. Server-side request manipulation

## Proposed Solutions

### Option 1: Regex Validation (Recommended)
**Pros:** Simple, no dependencies
**Cons:** None
**Effort:** Low
**Risk:** None

```typescript
private validateWidgetId(widgetId: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(widgetId)) {
    throw new Error('Invalid widget ID format');
  }
  if (widgetId.length > 64) {
    throw new Error('Widget ID too long');
  }
}

// Call at beginning of fetchConfig and submitFeedback
async fetchConfig(widgetId: string): Promise<ConfigResponse> {
  this.validateWidgetId(widgetId);
  // ...
}
```

### Option 2: URL Encoding
**Pros:** Handles edge cases
**Cons:** May produce unexpected URLs for invalid IDs
**Effort:** Low
**Risk:** Low

```typescript
const url = `${this.baseUrl}/api/v1/widgets/${encodeURIComponent(widgetId)}/config`;
```

## Recommended Action

Option 1 - Regex validation is cleaner and provides better error messages.

## Technical Details

**Affected Files:**
- `packages/core/src/api-client.ts`

## Acceptance Criteria

- [ ] widgetId is validated before use in URLs
- [ ] Invalid IDs throw clear error messages
- [ ] Path traversal attempts are blocked
- [ ] Tests cover invalid input scenarios

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by security-sentinel agent |

## Resources

- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
