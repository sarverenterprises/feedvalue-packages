# Simplification: Remove Unused Event Emitter Methods

---
status: pending
priority: p3
issue_id: "014"
tags: [code-review, simplification, cleanup]
dependencies: []
---

## Problem Statement

The `hasListeners()` and `listenerCount()` methods in TypedEventEmitter are never called anywhere in the codebase.

**Why it matters:** ~15 lines of unused code.

## Findings

**Agent:** code-simplicity-reviewer

**Location:** `/packages/core/src/event-emitter.ts` lines 90-103

## Proposed Solutions

### Remove Unused Methods

Delete `hasListeners()` and `listenerCount()` methods.

## Technical Details

**Affected Files:**
- `packages/core/src/event-emitter.ts`

## Acceptance Criteria

- [ ] Unused methods removed
- [ ] Tests still pass
- [ ] No external consumers of these methods

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by code-simplicity-reviewer agent |
