---
name: brainstorming
description: Explores user intent, requirements, and design before implementation. Use this before any creative work, creating features, building components, or modifying behavior.
---

# Brainstorming Ideas Into Designs

## When to use this skill
- Before starting any creative work or implementation
- When building new features, components, or modifying behavior
- When the user asks for design ideas or architectural approaches

**<HARD-GATE>**
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.
**</HARD-GATE>**

## Workflow

You MUST create a task for each of these items and complete them in order:

1.  **Explore project context** — check files, docs, recent commits.
2.  **Ask clarifying questions** — one at a time, understand purpose/constraints/success criteria.
3.  **Propose 2-3 approaches** — with trade-offs and your recommendation.
4.  **Present design** — in sections scaled to their complexity, get user approval after each section.
5.  **Write design doc** — save to `docs/plans/YYYY-MM-DD-<topic>-design.md` and commit.
6.  **Transition to implementation** — invoke the `writing-plans` skill to create the implementation plan.

## Instructions

**1. Exploring the Idea:**
- Check out the current project state first (files, docs, recent commits).
- Ask questions one at a time to refine the idea.
- Prefer multiple choice questions when possible, but open-ended is fine too.
- Only one question per message - if a topic needs more exploration, break it into multiple questions.

**2. Exploring Approaches:**
- Propose 2-3 different approaches with trade-offs.
- Present options conversationally with your recommendation and reasoning.
- Lead with your recommended option and explain why.

**3. Presenting the Design:**
- Once you believe you understand what you're building, present the design.
- Scale each section to its complexity: a few sentences if straightforward, up to 200-300 words if nuanced.
- Ask after each section whether it looks right so far.
- Cover: architecture, components, data flow, error handling, testing.
- Be ready to go back and clarify if something doesn't make sense.

**4. After the Design (Documentation & Handoff):**
- Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`.
- Commit the design document to git.
- **CRITICAL:** Invoke the `writing-plans` skill to create a detailed implementation plan. Do NOT invoke any other skill.

## Key Principles
- **One question at a time** - Don't overwhelm with multiple questions.
- **Multiple choice preferred** - Easier to answer than open-ended when possible.
- **YAGNI ruthlessly** - Remove unnecessary features from all designs.
- **Incremental validation** - Present design, get approval before moving on.
