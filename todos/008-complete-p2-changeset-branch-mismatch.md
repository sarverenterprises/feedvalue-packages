# Config: Changeset Base Branch Mismatch

---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, config, changesets]
dependencies: []
---

## Problem Statement

The changeset configuration references `main` as the base branch, but the repository uses `master`.

**Why it matters:** Changesets may not work correctly for PR detection and versioning.

## Findings

**Agent:** architecture-strategist

**Location:** `/packages/.changeset/config.json`

```json
{
  "baseBranch": "main"  // Should be "master"
}
```

## Proposed Solutions

### Fix the Branch Name

```json
{
  "baseBranch": "master"
}
```

## Technical Details

**Affected Files:**
- `packages/.changeset/config.json`

## Acceptance Criteria

- [ ] baseBranch matches actual default branch
- [ ] Changesets workflow runs successfully

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-23 | Created from code review | Identified by architecture-strategist agent |
