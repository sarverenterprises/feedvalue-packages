# Enhancement: Add once() and waitUntilReady() Methods

---
status: pending
priority: p3
issue_id: "015"
tags: [code-review, enhancement, agent-native]
dependencies: []
---

## Problem Statement

The SDK lacks convenience methods for common patterns:
1. `once()` for one-time event subscription
2. `waitUntilReady()` for Promise-based initialization

**Why it matters:** These are common patterns that would improve developer and agent experience.

## Findings

**Agent:** agent-native-reviewer

## Proposed Solutions

### Add Convenience Methods

```typescript
// In event-emitter.ts or feedvalue.ts
once<K extends keyof FeedValueEvents>(event: K, callback: EventHandler<K>): void {
  const wrapped = (...args: Parameters<FeedValueEvents[K]>) => {
    this.off(event, wrapped as EventHandler<K>);
    (callback as Function)(...args);
  };
  this.on(event, wrapped as EventHandler<K>);
}

// In feedvalue.ts
async waitUntilReady(): Promise<void> {
  if (this.state.isReady) return;
  return new Promise((resolve, reject) => {
    this.once('ready', resolve);
    this.once('error', reject);
  });
}
```

## Technical Details

**Affected Files:**
- `packages/core/src/feedvalue.ts`
- `packages/core/src/event-emitter.ts`

## Acceptance Criteria

- [ ] `once()` method added
- [ ] `waitUntilReady()` method added
- [ ] Tests cover new methods
- [ ] Types exported

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by agent-native-reviewer agent |
