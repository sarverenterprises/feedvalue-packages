# Test Gap: Network Error Handling Not Tested

---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, testing, api-client]
dependencies: []
---

## Problem Statement

Tests only cover HTTP error responses (4xx/5xx), not actual network failures where `fetch` throws. This is a critical path for real-world reliability.

**Why it matters:** If a user's network is flaky or the API is down, the SDK should handle this gracefully without crashing.

## Findings

**Agent:** pr-test-analyzer

**Location:** `/packages/core/src/api-client.test.ts`

**Missing test scenarios:**
1. Network failure (`TypeError: Failed to fetch`)
2. Timeout/abort errors
3. Token refresh on 403
4. Cache TTL expiration

## Proposed Solutions

### Add Missing Tests

```typescript
it('should handle network failure (fetch throws)', async () => {
  mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await expect(client.fetchConfig('test-widget')).rejects.toThrow('Failed to fetch');
});

it('should handle timeout/abort errors', async () => {
  mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
  await expect(client.fetchConfig('test-widget')).rejects.toThrow('Aborted');
});

it('should refresh token and retry on 403 with token error', async () => {
  // Setup: get config
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockConfigResponse),
  });
  await client.fetchConfig('test-widget');

  // Submit fails with 403
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 403,
    json: () => Promise.resolve({ detail: 'token expired' }),
  });

  // Refresh config
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ ...mockConfigResponse, submission_token: 'new' }),
  });

  // Retry succeeds
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ feedback_id: 'fb-123' }),
  });

  const result = await client.submitFeedback('test-widget', { message: 'Test' });
  expect(result.feedback_id).toBe('fb-123');
});

it('should refresh cache after TTL expires', async () => {
  vi.useFakeTimers();
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockConfigResponse) });

  await client.fetchConfig('test-widget');
  expect(mockFetch).toHaveBeenCalledTimes(1);

  vi.advanceTimersByTime(5 * 60 * 1000 + 1);

  await client.fetchConfig('test-widget');
  expect(mockFetch).toHaveBeenCalledTimes(2);

  vi.useRealTimers();
});
```

## Technical Details

**Affected Files:**
- `packages/core/src/api-client.test.ts`

## Acceptance Criteria

- [ ] Network failure test added
- [ ] Abort/timeout test added
- [ ] Token refresh retry test added
- [ ] Cache TTL expiration test added
- [ ] All tests pass

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by pr-test-analyzer agent |
