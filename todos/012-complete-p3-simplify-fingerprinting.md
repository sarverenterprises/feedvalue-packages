# Simplification: Over-Engineered Fingerprinting System

---
status: pending
priority: p3
issue_id: "012"
tags: [code-review, simplification, yagni]
dependencies: []
---

## Problem Statement

The fingerprinting system (195 lines) includes canvas, WebGL, and audio fingerprinting which is overkill for an MVP feedback widget. It also raises privacy concerns.

**Why it matters:** ~150 lines of complex code that provides marginal anti-abuse value at the cost of privacy concerns and technical debt (deprecated APIs).

## Findings

**Agent:** code-simplicity-reviewer

**Location:** `/packages/core/src/fingerprint.ts` (entire file)

**Current complexity:**
- Canvas fingerprinting (lines 80-107)
- WebGL fingerprinting (lines 112-129)
- Audio fingerprinting with deprecated API (lines 134-168)
- SHA-256 hashing

## Proposed Solutions

### Simplify to Session UUID

```typescript
export function generateFingerprint(): string {
  const stored = sessionStorage.getItem('fv_fp');
  if (stored) return stored;
  const fp = crypto.randomUUID();
  sessionStorage.setItem('fv_fp', fp);
  return fp;
}
```

**Impact:** 195 lines → 7 lines

## Technical Details

**Affected Files:**
- `packages/core/src/fingerprint.ts`

## Acceptance Criteria

- [ ] Fingerprinting reduced to simple session-based approach
- [ ] No privacy-invasive techniques
- [ ] No deprecated APIs
- [ ] Tests updated

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by code-simplicity-reviewer agent |
