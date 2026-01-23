# Type Safety: Function Type in Event Emitter

---
status: pending
priority: p2
issue_id: "004"
tags: [code-review, typescript, type-safety]
dependencies: []
---

## Problem Statement

The event emitter uses the generic `Function` type which defeats TypeScript's type safety. This is effectively `any` for functions.

**Why it matters:** Loses all type checking for event handlers stored in the Set, allowing mismatched argument types at runtime.

## Findings

**Agent:** kieran-typescript-reviewer

**Location:** `/packages/core/src/event-emitter.ts` line 25

```typescript
private listeners = new Map<keyof FeedValueEvents, Set<Function>>();
```

## Proposed Solutions

### Option 1: Typed Handler Storage (Recommended)
**Pros:** Full type safety
**Cons:** Slightly more complex
**Effort:** Low
**Risk:** None

```typescript
private listeners: {
  [K in keyof FeedValueEvents]?: Set<FeedValueEvents[K]>;
} = {};
```

### Option 2: Generic Map with Type Assertion
**Pros:** Minimal change
**Cons:** Still has type assertion
**Effort:** Low
**Risk:** Low

```typescript
private listeners = new Map<keyof FeedValueEvents, Set<FeedValueEvents[keyof FeedValueEvents]>>();
```

## Recommended Action

Option 1 provides better type inference and eliminates the `Function` type entirely.

## Technical Details

**Affected Files:**
- `packages/core/src/event-emitter.ts`

## Acceptance Criteria

- [ ] No `Function` type in codebase
- [ ] Event handlers are fully typed
- [ ] TypeScript catches handler signature mismatches
- [ ] All existing tests pass

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by kieran-typescript-reviewer |
