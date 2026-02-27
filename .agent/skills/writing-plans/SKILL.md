---
name: writing-plans
description: Writes comprehensive implementation plans for multi-step tasks before coding begins. Use this when the user asks to plan a feature, create a spec, or break down a task.
---

# Writing Plans

## When to use this skill
- When you have a spec or requirements for a multi-step task
- When the user asks to "plan out" an implementation or feature
- Before touching code for any new or complex task

## Workflow

1.  **Assume Zero Context**: Write plans assuming the executing engineer has zero context for the codebase and questionable taste. Document everything needed: files to touch, code, testing, and docs.
2.  **Bite-Sized Tasks**: Break the plan into 2-5 minute actionable steps.
3.  **Create the Plan Document**: Save plans to `docs/plans/YYYY-MM-DD-<feature-name>.md`.
4.  **Handoff**: Present execution options to the user (Subagent-Driven vs Parallel Session).

## Instructions

**Plan Document Header:**
Every plan MUST start with this header:

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

**Task Structure Constraint:**
Each step must be a single action (e.g., "Write the failing test", "Run it to make sure it fails", "Implement minimal code to pass", "Run tests", "Commit").

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

**Key Rules:**
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Execution Handoff
After saving the plan, offer the execution choice to the user:

**"Plan complete and saved to `docs/plans/<filename>.md`. Two execution options:**
**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration
**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?"**
