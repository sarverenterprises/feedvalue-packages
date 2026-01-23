# Simplification: Remove Unused User Data Tracking

---
status: pending
priority: p3
issue_id: "013"
tags: [code-review, simplification, yagni]
dependencies: []
---

## Problem Statement

The `identify()`, `setData()`, `reset()`, and `getUserData()` methods exist but the user data is **never sent to the API**. This is misleading dead code.

**Why it matters:** ~35 lines of code that suggests functionality that doesn't exist.

## Findings

**Agent:** code-simplicity-reviewer

**Location:** `/packages/core/src/feedvalue.ts` lines 85-88, 318-347

```typescript
private _userData: UserData = {};
private _userId: string | null = null;
private _userTraits: UserTraits = {};

setData(data: Partial<UserData>): void { /* never used */ }
identify(userId: string, traits?: UserTraits): void { /* never used */ }
```

The `submitFeedback()` method does not include any of this user data in the request.

## Proposed Solutions

### Option 1: Remove Until API Supports It
**Pros:** Clean code, no misleading API
**Cons:** Breaking change for anyone using these methods

### Option 2: Implement Properly
**Pros:** Feature works as expected
**Cons:** Requires API changes

## Recommended Action

Remove the methods and add back when the API actually uses this data.

## Technical Details

**Affected Files:**
- `packages/core/src/feedvalue.ts`
- `packages/core/src/types.ts`
- `packages/react/src/provider.tsx`
- `packages/vue/src/composables.ts`

## Acceptance Criteria

- [ ] Dead user data code removed OR fully implemented
- [ ] Tests updated accordingly
- [ ] Documentation reflects actual functionality

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by code-simplicity-reviewer agent |
