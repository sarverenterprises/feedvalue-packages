# Test Gap: Initialization Failure Recovery Not Tested

---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, testing, feedvalue]
dependencies: []
---

## Problem Statement

No tests verify what happens when `init()` fails and whether subsequent operations behave correctly in the error state.

**Why it matters:** If config fetch fails (network issue, invalid widget ID, API down), the SDK must properly set error state, emit error event, and prevent operations that depend on being ready.

## Findings

**Agent:** pr-test-analyzer

**Location:** `/packages/core/src/feedvalue.test.ts`

## Proposed Solutions

### Add Missing Tests

```typescript
it('should set error state when initialization fails', async () => {
  mockFetch.mockRejectedValueOnce(new Error('API unavailable'));
  const errorCallback = vi.fn();

  const instance = FeedValue.init({ widgetId: 'test-widget-123' });
  instance.on('error', errorCallback);

  await new Promise((resolve) => setTimeout(resolve, 50));

  const state = instance.getSnapshot();
  expect(state.error).toBeInstanceOf(Error);
  expect(state.error?.message).toBe('API unavailable');
  expect(state.isReady).toBe(false);
  expect(errorCallback).toHaveBeenCalledWith(expect.any(Error));
});

it('should handle 404 for invalid widget ID', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ detail: 'Widget not found' }),
  });

  const instance = FeedValue.init({ widgetId: 'invalid-id' });
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(instance.getSnapshot().error?.message).toBe('Widget not found');
});

it('should handle destroy() called multiple times', async () => {
  const instance = FeedValue.init({ widgetId: 'test-widget-123' });
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(() => {
    instance.destroy();
    instance.destroy();
  }).not.toThrow();
});

it('should handle operations after destroy gracefully', async () => {
  const instance = FeedValue.init({ widgetId: 'test-widget-123' });
  await new Promise((resolve) => setTimeout(resolve, 50));

  instance.destroy();

  expect(() => instance.open()).not.toThrow();
  expect(() => instance.close()).not.toThrow();
});
```

## Technical Details

**Affected Files:**
- `packages/core/src/feedvalue.test.ts`

## Acceptance Criteria

- [ ] Init failure state test added
- [ ] 404 handling test added
- [ ] Double destroy test added
- [ ] Operations after destroy test added
- [ ] All tests pass

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by pr-test-analyzer agent |
