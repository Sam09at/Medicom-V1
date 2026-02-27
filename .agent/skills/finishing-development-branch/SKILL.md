---
name: finishing-development-branch
description: Guides completion of development work by presenting structured options for merge, PR, or cleanup. Use when implementation is complete, all tests pass, and you need to decide how to integrate the work.
---

# Finishing a Development Branch

## When to use this skill
- When implementation of a feature or bugfix is complete
- When the user says they are "done" with a branch or task
- Before merging, creating a pull request, or discarding temporary work

## Workflow

**Core principle:** Verify tests -> Present options -> Execute choice -> Clean up.

### Step 1: Verify Tests
Before presenting options, verify tests pass:
```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```
- If tests fail, show the failures and stop. Do not proceed until tests pass.
- If tests pass, continue to Step 2.

### Step 2: Determine Base Branch
```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```
Or ask: "This branch split from main - is that correct?"

### Step 3: Present Options
Present exactly these 4 options, concisely:
```text
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

## Instructions

### Option 1: Merge Locally
1. Switch to base branch (`git checkout <base-branch>`)
2. Pull latest (`git pull`)
3. Merge feature branch (`git merge <feature-branch>`)
4. Verify tests on merged result
5. If tests pass, delete branch (`git branch -d <feature-branch>`)
6. Clean up worktree (Step 5)

### Option 2: Push and Create PR
1. Push branch (`git push -u origin <feature-branch>`)
2. Create PR via GitHub CLI
3. Clean up worktree (Step 5)

### Option 3: Keep As-Is
1. Report: "Keeping branch <name>."
2. **Do NOT cleanup worktree.**

### Option 4: Discard
1. Confirm first by asking the user to type 'discard'.
2. If confirmed: 
   `git checkout <base-branch>`
   `git branch -D <feature-branch>`
3. Clean up worktree (Step 5)

### Step 5: Cleanup Worktree
For Options 1, 2, and 4: Pick up the current worktree via `git worktree list`, and if matched, remove it using `git worktree remove <worktree-path>`. Keep it for Option 3.

## Red Flags / Anti-Patterns
- **Never** proceed with failing tests.
- **Never** merge without verifying tests on result.
- **Never** delete work without confirmation.
- **Never** ask open-ended questions like "What should I do next?"; always present the 4 options.
