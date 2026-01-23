# Memory Leak: setTimeout in showSuccess Never Cancelled

---
status: pending
priority: p2
issue_id: "005"
tags: [code-review, performance, memory-leak]
dependencies: []
---

## Problem Statement

The `showSuccess()` method creates a setTimeout that is never stored or cancelled. If `destroy()` is called before the 3-second timeout completes, the callback still executes on destroyed state.

**Why it matters:** Can cause errors in single-page applications during route transitions.

## Findings

**Agent:** performance-oracle

**Location:** `/packages/core/src/feedvalue.ts` lines 868-873

```typescript
private showSuccess(): void {
  // ...
  setTimeout(() => {
    if (this.state.isOpen) {
      this.close();
      this.resetForm();
    }
  }, 3000);  // Never stored or cancelled
}
```

## Proposed Solutions

### Option 1: Store and Clear Timeout (Recommended)
**Pros:** Proper cleanup
**Cons:** Minor code addition
**Effort:** Low
**Risk:** None

```typescript
private autoCloseTimeout: ReturnType<typeof setTimeout> | null = null;

private showSuccess(): void {
  // Clear any existing timeout
  if (this.autoCloseTimeout) {
    clearTimeout(this.autoCloseTimeout);
  }
  // ...
  this.autoCloseTimeout = setTimeout(() => {
    if (this.state.isOpen) {
      this.close();
      this.resetForm();
    }
    this.autoCloseTimeout = null;
  }, 3000);
}

destroy(): void {
  if (this.autoCloseTimeout) {
    clearTimeout(this.autoCloseTimeout);
    this.autoCloseTimeout = null;
  }
  // ... rest of destroy logic
}
```

## Recommended Action

Implement Option 1.

## Technical Details

**Affected Files:**
- `packages/core/src/feedvalue.ts`

## Acceptance Criteria

- [ ] Timeout is stored in instance property
- [ ] Timeout is cleared on destroy()
- [ ] Timeout is cleared if showSuccess is called again
- [ ] No errors when navigating away before timeout completes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by performance-oracle agent |
