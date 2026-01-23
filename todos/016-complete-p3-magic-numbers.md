# Code Quality: Magic Numbers Without Constants

---
status: pending
priority: p3
issue_id: "016"
tags: [code-review, quality, maintainability]
dependencies: []
---

## Problem Statement

Several magic numbers appear in the code without named constants, reducing readability and maintainability.

## Findings

**Agent:** kieran-typescript-reviewer

**Locations:**
- `/packages/core/src/feedvalue.ts` line 868: `3000` (auto-close delay)
- `/packages/core/src/api-client.ts` line 69: `30` (token expiry buffer)
- `/packages/core/src/api-client.ts` line 82: `5 * 60 * 1000` (cache TTL)

## Proposed Solutions

### Extract to Named Constants

```typescript
// In feedvalue.ts
private static readonly SUCCESS_AUTO_CLOSE_DELAY_MS = 3000;

// In api-client.ts
private static readonly TOKEN_EXPIRY_BUFFER_SECONDS = 30;
private static readonly CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;
```

## Technical Details

**Affected Files:**
- `packages/core/src/feedvalue.ts`
- `packages/core/src/api-client.ts`

## Acceptance Criteria

- [ ] All magic numbers replaced with named constants
- [ ] Constants are well-named and documented
- [ ] Tests still pass

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by kieran-typescript-reviewer agent |
