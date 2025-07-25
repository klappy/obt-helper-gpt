# 🚀 AGENTIC CODER MISSION: Complete UI/UX Transformation

## Your Mission

You are tasked with implementing a complete UI/UX redesign for OBT Helper GPT, transforming it from its current broken state into a polished, WhatsApp-first conversational AI platform following Apple's 2025 design language.

## Critical Instructions

1. **READ FIRST** (in this exact order):
   - `@docs/AGENTIC_CODER_INSTRUCTIONS.md` - Your updated operational guidelines
   - `@docs/ui-redesign-2025/MODERN_UI_PRD_2025.md` - The vision and design specifications
   - `@docs/ui-redesign-2025/UI_REDESIGN_TASK_LIST.md` - Your complete task list (70 tasks)
   - `@docs/ui-redesign-2025/ARCHIVE_NOTICE.md` - What NOT to follow

2. **DO NOT STOP** until all 70 tasks in the UI_REDESIGN_TASK_LIST.md are marked as ☑ Closed

3. **START HERE**: Phase 0, Task 0.1.1 - Create design tokens file

## Key Requirements

### Design Direction

- **YES**: Apple 2025 spatial design (clean, layered, subtle shadows)
- **NO**: Glassmorphism, complex animations, purple gradients
- **FOCUS**: WhatsApp as the primary feature, not hidden in a demo page

### Technical Approach

- Each task must result in a working, deployable state
- Run visual tests after each task: `npm run test:visual`
- Never break existing functionality
- If unsure about a design choice, use the defaults specified in the PRD

### Decision Making

- **Color unsure?** Use the closest token from the design system
- **Spacing unsure?** Use 16px (standard spacing)
- **Animation unsure?** Use --spring-smooth
- **Feature complex?** Create a working stub first, enhance later
- **Never wait for user input** - make reasonable decisions and document them

## Task Execution Pattern

For each task in `@docs/ui-redesign-2025/UI_REDESIGN_TASK_LIST.md`:

1. Find next ☐ Open task
2. Create feature branch: `git checkout -b ui-redesign-[epic]-[task-id]`
3. Implement the specific changes
4. Run tests: `npm test && npm run test:visual`
5. Commit: `git commit -m "feat(ui-[task-id]): [description]"`
6. Deploy and validate
7. Mark task as ☑ Closed in the task list
8. Move to next task

## Phase Overview

- **Phase 0**: Foundation (Design system, components, testing) - MUST complete first
- **Phase 1**: Homepage transformation (WhatsApp-first approach)
- **Phase 2**: Conversation experience (Spatial bubbles, multimodal input)
- **Phase 3**: Admin dashboard (Visual builder, spatial metrics)
- **Phase 4**: Integration & polish (Micro-interactions, performance)

## What to Ignore

DO NOT look at or follow:

- Anything in `/docs/archive/conflicting-ui-plans/`
- Old phase1.md, phase2.md, phase3.md files
- Any mention of glassmorphism or gradient meshes
- Multimodal implementation (that comes after UI is fixed)

## Success Validation

After each phase, verify:

- All tasks in that phase are ☑ Closed
- Visual tests pass
- No console errors
- App still deploys successfully
- Design matches the PRD vision

## Emergency Protocol

If you encounter blockers:

1. Try the fallback approach listed in the task
2. Create a working stub if needed
3. Document the issue in comments
4. Continue to next task (don't stop)
5. Maximum 3 retry attempts per task

## Final Checklist

When all 70 tasks are complete:

- [ ] All tasks marked ☑ Closed
- [ ] Version bumped to 5.4.0
- [ ] All visual tests passing
- [ ] Homepage shows WhatsApp input prominently
- [ ] No glassmorphism effects anywhere
- [ ] Admin dashboard has visual builder
- [ ] All pages have consistent Apple 2025 design

## Remember

You have everything you need:

- Clear task list with validation criteria
- Design specifications and tokens
- Example components and patterns
- Fallback approaches for every decision

The user will be sleeping. Do not wait for input. Make reasonable decisions based on the PRD and document your choices. The goal is to wake up to a beautiful, working application that looks like Apple designed it in 2025.

Start with Phase 0, Task 0.1.1. Good luck! 🎯
