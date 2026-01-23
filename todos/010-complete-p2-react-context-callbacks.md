# Performance: React Context Methods Recreated on State Change

---
status: pending
priority: p2
issue_id: "010"
tags: [code-review, performance, react]
dependencies: []
---

## Problem Statement

When any state property changes, the entire context value is recreated including all method references. This can cause unnecessary re-renders in consuming components that only use methods.

**Why it matters:** Performance degradation in apps with frequent state changes.

## Findings

**Agent:** performance-oracle

**Location:** `/packages/react/src/provider.tsx` lines 197-217

```typescript
const value = useMemo<FeedValueContextValue>(
  () => ({
    // Methods recreated every time state changes
    open: () => instanceRef.current?.open(),
    close: () => instanceRef.current?.close(),
    // ...
  }),
  [state]  // Dependency on entire state object
);
```

## Proposed Solutions

### Use useCallback for Methods

```typescript
const open = useCallback(() => instanceRef.current?.open(), []);
const close = useCallback(() => instanceRef.current?.close(), []);
const toggle = useCallback(() => instanceRef.current?.toggle(), []);
const show = useCallback(() => instanceRef.current?.show(), []);
const hide = useCallback(() => instanceRef.current?.hide(), []);
const submit = useCallback(
  (feedback: Partial<FeedbackData>) =>
    instanceRef.current?.submit(feedback) ?? Promise.reject(new Error('Not initialized')),
  []
);
const identify = useCallback(
  (userId: string, traits?: UserTraits) => instanceRef.current?.identify(userId, traits),
  []
);
const setData = useCallback(
  (data: Record<string, string>) => instanceRef.current?.setData(data),
  []
);
const reset = useCallback(() => instanceRef.current?.reset(), []);

const value = useMemo<FeedValueContextValue>(
  () => ({
    instance: instanceRef.current,
    ...state,
    open, close, toggle, show, hide, submit, identify, setData, reset,
  }),
  [state, open, close, toggle, show, hide, submit, identify, setData, reset]
);
```

## Technical Details

**Affected Files:**
- `packages/react/src/provider.tsx`

## Acceptance Criteria

- [ ] Methods wrapped in useCallback
- [ ] Context value properly memoized
- [ ] No unnecessary re-renders when only state changes
- [ ] Tests verify render behavior

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by performance-oracle agent |
