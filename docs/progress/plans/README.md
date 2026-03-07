# Planning Files

This directory contains **structured planning documents** for features, phases, and major work items. Each plan serves as a living document that tracks implementation progress, technical decisions, and success criteria.

## Purpose

Planning files serve as:
- **Scrum board replacements** - Track tasks, steps, and completion status
- **Technical specifications** - Document architecture decisions and implementation details
- **Progress tracking** - Check off steps as they're completed during implementation
- **Knowledge transfer** - Future developers can see what was built and why
- **Retrospective material** - Review estimates vs. actuals for process improvement

## File Naming Convention

```
YYYY-MM-DD-phase-or-feature-name.md
```

**Examples:**
- `2026-01-31-r5-phase4.3-player-reconnection.md`
- `2026-02-15-admin-bulk-import-questions.md`
- `2026-03-01-r6-phase1-leaderboard-persistence.md`

## Template Structure

Each planning file should include:

1. **Header** - Date, status, assignee, time estimate, dependencies
2. **Overview** - Current state, what's missing, context
3. **Goals** - High-level objectives (with checkboxes)
4. **Implementation Steps** - Detailed tasks with checkboxes for each step
5. **Technical Decisions** - Architecture choices and trade-offs
6. **Success Criteria** - Functional and non-functional requirements
7. **Files Changed** - New files and modifications
8. **Time Estimates** - Breakdown by task
9. **Notes & Observations** - Implementation notes as work progresses
10. **Completion Checklist** - Final quality gates

## Status Values

Use emoji prefixes for quick visual scanning:

- 📋 **Planning** - Not started, still designing
- 🚧 **In Progress** - Active implementation
- ✅ **Complete** - All steps done, tests passing
- ⏸️ **Paused** - Blocked or deprioritized
- ❌ **Cancelled** - Won't implement

## Workflow

### 1. Planning Phase
- Create planning file with all steps outlined
- Set status to 📋 Planning
- Review with team (if applicable)
- Add to session file as reference

### 2. Implementation Phase
- Update status to 🚧 In Progress
- Check off steps as you complete them
- Add notes/observations in real-time
- Update time estimates if scope changes

### 3. Completion Phase
- Check final completion checklist
- Update status to ✅ Complete
- Document actual time vs. estimate
- Write summary in session file

### 4. Retrospective
- Review what went well/poorly
- Update planning template if needed
- Archive completed plans (keep for reference)

## Integration with Session Files

Session files (`docs/progress/sessions/*.md`) should:
- Reference planning files at the top
- Summarize what was completed each day
- Link to specific plan steps when documenting decisions
- Avoid duplicating entire plans (keep them DRY)

**Example session file header:**
```markdown
# R5 Phase 4.3 Implementation Session

**Date:** 2026-01-31
**Plan:** [Phase 4.3 Player Reconnection](../plans/2026-01-31-r5-phase4.3-player-reconnection.md)
**Status:** 🚧 In Progress (Step 3/7)

## Today's Progress
- [x] Step 1: useNetworkStatus hook ✅
- [x] Step 2: Update usePresence with retry logic ✅
- [ ] Step 3: useReconnection hook (in progress)
```

## Best Practices

1. **Create plans BEFORE coding** - Avoid "plan as you go" unless it's a small bug fix
2. **Keep steps atomic** - Each checkbox should be completable in <1 hour
3. **Update in real-time** - Check off steps immediately, don't batch at end of day
4. **Document decisions** - Capture WHY, not just WHAT (future you will thank you)
5. **Be honest with estimates** - Track actual time to improve future planning
6. **Link to related docs** - Reference ADRs, architecture docs, prior sessions

## Examples

See existing planning files in this directory:
- [2026-01-31-r5-phase4.3-player-reconnection.md](2026-01-31-r5-phase4.3-player-reconnection.md)

---

**Note:** This system replaces ad-hoc "I'll just start coding" with structured planning. It's designed to work with the iterative development approach documented in `.github/copilot-instructions.md`.
