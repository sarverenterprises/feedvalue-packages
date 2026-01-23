# Memory Leak: AudioContext Not Properly Cleaned Up

---
status: pending
priority: p1
issue_id: "003"
tags: [code-review, performance, memory-leak]
dependencies: []
---

## Problem Statement

The `getAudioFingerprint()` function creates an AudioContext that leaks if an exception occurs before `close()` is called. Additionally, it uses the deprecated `createScriptProcessor` API.

**Why it matters:** Each failed fingerprint generation leaks an AudioContext. On high-traffic sites with error conditions, this accumulates rapidly and can cause browser performance issues.

## Findings

**Agent:** performance-oracle

**Location:** `/packages/core/src/fingerprint.ts` lines 134-168

```typescript
async function getAudioFingerprint(): Promise<string | null> {
  try {
    const audioContext = new AudioContext();
    const processor = audioContext.createScriptProcessor(4096, 1, 1);  // DEPRECATED
    // ... operations ...
    audioContext.close();  // Never reached if exception thrown above
  } catch {
    return null;  // AudioContext leaks!
  }
}
```

**Issues:**
1. AudioContext leaks on early exception
2. Using deprecated `createScriptProcessor`
3. No `finally` block for cleanup

## Proposed Solutions

### Option 1: Add Finally Block (Recommended)
**Pros:** Fixes leak, simple change
**Cons:** Still uses deprecated API
**Effort:** Low
**Risk:** None

```typescript
async function getAudioFingerprint(): Promise<string | null> {
  let audioContext: AudioContext | null = null;
  try {
    audioContext = new AudioContext();
    // ... operations ...
    return hashString(/* result */);
  } catch {
    return null;
  } finally {
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close().catch(() => {});
    }
  }
}
```

### Option 2: Remove Audio Fingerprinting (Per Simplicity Review)
**Pros:** Eliminates issue entirely, reduces bundle
**Cons:** Slightly less unique fingerprints
**Effort:** Low
**Risk:** None

The simplicity review recommends removing audio fingerprinting entirely as overkill for an MVP feedback widget.

### Option 3: Use AnalyserNode Instead
**Pros:** Modern API, no deprecation warnings
**Cons:** More effort
**Effort:** Medium
**Risk:** Low

## Recommended Action

Option 2 aligns with simplification goals, but if fingerprinting is kept, Option 1 is essential.

## Technical Details

**Affected Files:**
- `packages/core/src/fingerprint.ts`

## Acceptance Criteria

- [ ] No AudioContext leaks under any error condition
- [ ] Deprecated API warning removed (if keeping audio fingerprint)
- [ ] Tests verify cleanup on error paths

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by performance-oracle agent |

## Resources

- [MDN AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)
- [ScriptProcessorNode deprecation](https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode)
