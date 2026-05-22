# API Inconsistency: identify() Type Signature Mismatch

---
status: completed
priority: p2
issue_id: "009"
tags: [code-review, typescript, api-consistency]
dependencies: []
---

## Problem Statement

The `identify()` method has inconsistent type signatures between React and Vue packages:
- React uses `Record<string, unknown>` for traits
- Vue uses `UserTraits` from core

**Why it matters:** API inconsistency confuses developers and may cause type errors when switching frameworks.

## Findings

**Agent:** architecture-strategist

**Locations:**
- `/packages/react/src/provider.tsx` line 55: `traits?: Record<string, unknown>`
- `/packages/vue/src/composables.ts` line 56: `traits?: UserTraits`

## Proposed Solutions

### Harmonize to UserTraits

```typescript
// In provider.tsx
identify: (userId: string, traits?: UserTraits) => void;
```

## Technical Details

**Affected Files:**
- `packages/react/src/provider.tsx`

## Acceptance Criteria

- [x] Both packages use UserTraits type
- [x] TypeScript compiles without errors
- [x] Documentation reflects consistent API

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by architecture-strategist agent |
