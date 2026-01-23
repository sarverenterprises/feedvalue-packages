# Security: Insufficient Input Validation for Feedback

---
status: pending
priority: p2
issue_id: "011"
tags: [code-review, security, input-validation]
dependencies: []
---

## Problem Statement

Input validation for feedback submission is minimal - only message presence is checked. No validation for sentiment, customFieldValues, or metadata.

**Why it matters:** Server-side injection if backend doesn't validate, prototype pollution, log injection.

## Findings

**Agent:** security-sentinel

**Location:** `/packages/core/src/feedvalue.ts` lines 353-388

```typescript
if (!feedback.message?.trim()) {
  throw new Error('Feedback message is required');
}
// No validation for sentiment, customFieldValues, metadata
```

## Proposed Solutions

### Add Client-Side Validation

```typescript
const VALID_SENTIMENTS = ['angry', 'disappointed', 'satisfied', 'excited'] as const;

function validateFeedback(feedback: Partial<FeedbackData>): void {
  if (!feedback.message?.trim()) {
    throw new Error('Feedback message is required');
  }

  if (feedback.sentiment && !VALID_SENTIMENTS.includes(feedback.sentiment)) {
    throw new Error('Invalid sentiment value');
  }

  // Validate customFieldValues are string key-value pairs
  if (feedback.customFieldValues) {
    for (const [key, value] of Object.entries(feedback.customFieldValues)) {
      if (typeof key !== 'string' || typeof value !== 'string') {
        throw new Error('Custom field values must be strings');
      }
    }
  }

  // Limit metadata field lengths
  if (feedback.metadata) {
    for (const [key, value] of Object.entries(feedback.metadata)) {
      if (typeof value === 'string' && value.length > 1000) {
        throw new Error(`Metadata field ${key} exceeds maximum length`);
      }
    }
  }
}
```

## Technical Details

**Affected Files:**
- `packages/core/src/feedvalue.ts`

## Acceptance Criteria

- [ ] Sentiment is validated against allowed values
- [ ] customFieldValues are validated as string key-value pairs
- [ ] Metadata field lengths are limited
- [ ] Tests cover validation edge cases

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by security-sentinel agent |
