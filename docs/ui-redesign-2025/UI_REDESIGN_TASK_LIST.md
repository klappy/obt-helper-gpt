# UI Redesign Task List - 2025 Apple Design System

## Overview

Complete UI/UX transformation following Apple's 2025 design language. Each task must result in a working, deployable state with visual tests.

## Phase 0: Foundation & Setup (Version 5.0.0)

**Goal**: Establish design system and testing infrastructure without breaking existing functionality

### Epic 0.1: Design System Creation

| ID    | Task                             | Status | Files                                     | Tests                  | Validation                 |
| ----- | -------------------------------- | ------ | ----------------------------------------- | ---------------------- | -------------------------- |
| 0.1.1 | Create design tokens file        | ☑ Closed | `src/lib/styles/tokens.css`               | Visual regression      | Colors render correctly    |
| 0.1.2 | Build CSS reset and base styles  | ☑ Closed | `src/lib/styles/reset.css`, `src/app.css` | Playwright screenshots | No visual breaking changes |
| 0.1.3 | Remove all glassmorphism effects | ☑ Closed | `src/app.css`, `src/lib/styles/theme.css` | Visual comparison      | Clean, flat surfaces       |
| 0.1.4 | Implement spatial shadow system  | ☑ Closed | `src/lib/styles/shadows.css`              | Component gallery      | 5 shadow levels visible    |
| 0.1.5 | Set up animation curves          | ☑ Closed | `src/lib/styles/animations.css`           | Performance test       | 60fps animations           |

### Epic 0.2: Component Library Foundation

| ID    | Task                               | Status | Files                                             | Tests              | Validation               |
| ----- | ---------------------------------- | ------ | ------------------------------------------------- | ------------------ | ------------------------ |
| 0.2.1 | Create FloatingCard component      | ☑ Closed | `src/lib/components/ui/FloatingCard.svelte`       | Unit + visual      | Depth layers work        |
| 0.2.2 | Build AdaptiveButton component     | ☑ Closed | `src/lib/components/ui/AdaptiveButton.svelte`     | Interaction test   | All states render        |
| 0.2.3 | Implement SpatialGrid layout       | ☑ Closed | `src/lib/components/ui/SpatialGrid.svelte`        | Responsive test    | Adapts to viewports      |
| 0.2.4 | Create LiveMetric component        | ☑ Closed | `src/lib/components/ui/LiveMetric.svelte`         | Animation test     | Updates smoothly         |
| 0.2.5 | Build ConversationBubble component | ☑ Closed | `src/lib/components/ui/ConversationBubble.svelte` | Accessibility test | Screen reader compatible |

### Epic 0.3: Testing Infrastructure

| ID    | Task                              | Status | Files                                   | Tests       | Validation             |
| ----- | --------------------------------- | ------ | --------------------------------------- | ----------- | ---------------------- |
| 0.3.1 | Set up Playwright visual tests    | ☑ Closed | `tests/visual/`, `playwright.config.ts` | Self-test   | Screenshots captured   |
| 0.3.2 | Create component test harness     | ☑ Closed | `tests/components/test-harness.html`    | Render test | All components visible |
| 0.3.3 | Build accessibility test suite    | ☑ Closed | `tests/a11y/`                           | WCAG scan   | No violations          |
| 0.3.4 | Add performance monitoring        | ☑ Closed | `tests/performance/`                    | Lighthouse  | Score > 90             |
| 0.3.5 | Create visual regression workflow | ☑ Closed | `.github/workflows/visual-tests.yml`    | CI run      | Detects changes        |

## Phase 1: Homepage Transformation (Version 5.1.0)

**Goal**: Redesign homepage with WhatsApp-first approach and spatial design

### Epic 1.1: Homepage Structure

| ID    | Task                               | Status | Files                                | Tests            | Validation          |
| ----- | ---------------------------------- | ------ | ------------------------------------ | ---------------- | ------------------- |
| 1.1.1 | Clean navigation header            | ☑ Closed | `src/routes/+layout.svelte`          | Visual test      | Clean, minimal nav  |
| 1.1.2 | Remove existing hero section       | ☑ Closed | `src/routes/+page.svelte`            | Build test       | No broken imports   |
| 1.1.3 | Build new WhatsApp-first hero      | ☑ Closed | `src/routes/+page.svelte`            | Interaction test | Phone input works   |
| 1.1.4 | Implement phone number persistence | ☑ Closed | `src/routes/+page.svelte`            | Storage test     | Number saved/loaded |
| 1.1.5 | Add live demo preview component    | ☑ Closed | `src/lib/components/LiveDemo.svelte` | Mock test        | Shows fake messages |

### Epic 1.2: Assistant Grid Redesign

| ID    | Task                                   | Status | Files                                     | Tests            | Validation            |
| ----- | -------------------------------------- | ------ | ----------------------------------------- | ---------------- | --------------------- |
| 1.2.1 | Replace tool cards with spatial design | ☑ Closed | `src/lib/components/AssistantCard.svelte` | Visual test      | Depth effects visible |
| 1.2.2 | Add hover preview states               | ☑ Closed | `src/lib/components/AssistantCard.svelte` | Interaction test | Preview on hover      |
| 1.2.3 | Implement popularity-based depth       | ☑ Closed | `src/routes/+page.svelte`                 | Sort test        | Popular cards raised  |
| 1.2.4 | Add parallax scroll effect             | ☑ Closed | `src/routes/+page.svelte`                 | Scroll test      | Smooth parallax       |
| 1.2.5 | Create loading skeleton                | ☑ Closed | `src/routes/+page.svelte`                 | Loading test     | Graceful loading      |

### Epic 1.3: Trust & Metrics

| ID    | Task                          | Status | Files                                   | Tests            | Validation        |
| ----- | ----------------------------- | ------ | --------------------------------------- | ---------------- | ----------------- |
| 1.3.1 | Build floating metrics badges | ☑ Closed | `src/lib/components/TrustBadges.svelte` | Data test        | Shows real data   |
| 1.3.2 | Add real-time animations      | ☑ Closed | `src/lib/components/TrustBadges.svelte` | Animation test   | Smooth updates    |
| 1.3.3 | Implement metric tooltips     | ☑ Closed | `src/lib/components/TrustBadges.svelte` | Hover test       | Details on hover  |
| 1.3.4 | Add social proof section      | ☑ Closed | `src/routes/+page.svelte`               | Content test     | Testimonials load |
| 1.3.5 | Create CTA animations         | ☑ Closed | `src/routes/+page.svelte`               | Interaction test | Engaging CTAs     |

## Phase 2: Conversation Experience (Version 5.2.0)

**Goal**: Transform chat interface with spatial bubbles and multimodal input

### Epic 2.1: Message Area Redesign

| ID    | Task                              | Status | Files                                       | Tests            | Validation        |
| ----- | --------------------------------- | ------ | ------------------------------------------- | ---------------- | ----------------- |
| 2.1.1 | Replace flat bubbles with spatial | ☑ Closed | `src/lib/components/ChatInterface.svelte`   | Visual test      | Depth visible     |
| 2.1.2 | Add message reactions system      | ☑ Closed | `src/lib/components/MessageBubble.svelte`   | Interaction test | Double-tap works  |
| 2.1.3 | Implement typing indicators       | ☑ Closed | `src/lib/components/TypingIndicator.svelte` | Animation test   | Personality shows |
| 2.1.4 | Create system message style       | ☑ Closed | `src/lib/components/SystemMessage.svelte`   | Visual test      | Centered, subtle  |
| 2.1.5 | Add message status indicators     | ☑ Closed | `src/lib/components/MessageBubble.svelte`   | State test       | Shows delivery    |

### Epic 2.2: Input Enhancement

| ID    | Task                           | Status | Files                                          | Tests        | Validation         |
| ----- | ------------------------------ | ------ | ---------------------------------------------- | ------------ | ------------------ |
| 2.2.1 | Build multimodal input bar     | ☑ Closed | `src/lib/components/MultimodalInput.svelte`    | Feature test | All inputs work    |
| 2.2.2 | Add voice visualization        | ☑ Closed | `src/lib/components/VoiceVisualizer.svelte`    | Audio test   | Waveform displays  |
| 2.2.3 | Implement auto-resize textarea | ☑ Closed | `src/lib/components/AutoResizeTextarea.svelte` | Resize test  | Grows with content |
| 2.2.4 | Create quick actions menu      | ☑ Closed | `src/lib/components/QuickActions.svelte`       | Menu test    | Actions accessible |
| 2.2.5 | Add haptic feedback hooks      | ☑ Closed | `src/lib/utils/haptics.js`                     | Device test  | Vibrates on mobile |

### Epic 2.3: Assistant Presence

| ID    | Task                          | Status | Files                                         | Tests         | Validation        |
| ----- | ----------------------------- | ------ | --------------------------------------------- | ------------- | ----------------- |
| 2.3.1 | Build floating assistant card | ☑ Closed | `src/lib/components/AssistantPresence.svelte` | Position test | Floats correctly  |
| 2.3.2 | Add swipe gesture support     | ☑ Closed | `src/lib/components/AssistantPresence.svelte` | Gesture test  | Swipe switches    |
| 2.3.3 | Implement cost meter          | ☑ Closed | `src/lib/components/CostMeter.svelte`         | Update test   | Shows real cost   |
| 2.3.4 | Create session timer          | ☑ Closed | `src/lib/components/SessionTimer.svelte`      | Time test     | Accurate timing   |
| 2.3.5 | Add assistant personalities   | ☑ Closed | `src/lib/stores/assistants.js`                | Behavior test | Unique indicators |

## Phase 3: Admin Dashboard (Version 5.3.0)

**Goal**: Create spatial command center with visual assistant builder

### Epic 3.1: Dashboard Overview

| ID    | Task                        | Status | Files                                      | Tests            | Validation        |
| ----- | --------------------------- | ------ | ------------------------------------------ | ---------------- | ----------------- |
| 3.1.1 | Build spatial metrics cards | ☑ Closed | `src/routes/admin/+page.svelte`            | Visual test      | Depth hierarchy   |
| 3.1.2 | Add live activity feed      | ☑ Closed | `src/lib/components/ActivityFeed.svelte`   | Update test      | Real-time updates |
| 3.1.3 | Create expandable analytics | ☑ Closed | `src/lib/components/AnalyticsPanel.svelte` | Interaction test | Smooth expand     |
| 3.1.4 | Implement health indicators | ☐ Open | `src/lib/components/SystemHealth.svelte`   | Status test      | Accurate health   |
| 3.1.5 | Add quick stats summary     | ☑ Closed | `src/routes/admin/+page.svelte`            | Data test        | Correct numbers   |

### Epic 3.2: Assistant Builder

| ID    | Task                       | Status | Files                                             | Tests            | Validation        |
| ----- | -------------------------- | ------ | ------------------------------------------------- | ---------------- | ----------------- |
| 3.2.1 | Create split-view editor   | ☑ Closed | `src/routes/admin/tools/[id]/+page.svelte`        | Layout test      | Split works       |
| 3.2.2 | Build visual configuration | ☐ Open | `src/lib/components/AssistantConfigurator.svelte` | Drag test        | Modules draggable |
| 3.2.3 | Add personality sliders    | ☐ Open | `src/lib/components/PersonalityControls.svelte`   | Value test       | Settings apply    |
| 3.2.4 | Implement live preview     | ☐ Open | `src/lib/components/AssistantPreview.svelte`      | Preview test     | Real-time update  |
| 3.2.5 | Create cost estimator      | ☐ Open | `src/lib/components/CostEstimator.svelte`         | Calculation test | Accurate costs    |

### Epic 3.3: System Management

| ID    | Task                    | Status | Files                                       | Tests       | Validation        |
| ----- | ----------------------- | ------ | ------------------------------------------- | ----------- | ----------------- |
| 3.3.1 | Build ambient status bg | ☐ Open | `src/routes/admin/+layout.svelte`           | Color test  | Status visible    |
| 3.3.2 | Create floating alerts  | ☐ Open | `src/lib/components/FloatingAlerts.svelte`  | Alert test  | Notices appear    |
| 3.3.3 | Add log viewer          | ☐ Open | `src/lib/components/LogViewer.svelte`       | Scroll test | Logs readable     |
| 3.3.4 | Implement diagnostics   | ☐ Open | `src/lib/components/Diagnostics.svelte`     | Check test  | Issues detected   |
| 3.3.5 | Create batch operations | ☐ Open | `src/lib/components/BatchOperations.svelte` | Multi test  | Bulk actions work |

## Phase 4: Integration & Polish (Version 5.4.0)

**Goal**: Connect all experiences and add final polish

### Epic 4.1: WhatsApp Integration UI

| ID    | Task                        | Status | Files                                         | Tests          | Validation     |
| ----- | --------------------------- | ------ | --------------------------------------------- | -------------- | -------------- |
| 4.1.1 | Design connection flow      | ☐ Open | `src/lib/components/WhatsAppConnect.svelte`   | Flow test      | Steps clear    |
| 4.1.2 | Build QR code scanner       | ☐ Open | `src/lib/components/QRScanner.svelte`         | Scan test      | QR recognized  |
| 4.1.3 | Create SMS code input       | ☐ Open | `src/lib/components/SMSVerification.svelte`   | Input test     | Code accepted  |
| 4.1.4 | Add sync visualization      | ☐ Open | `src/lib/components/SyncVisualization.svelte` | Animation test | Flow visible   |
| 4.1.5 | Implement session inspector | ☐ Open | `src/lib/components/SessionInspector.svelte`  | Data test      | Sessions shown |

### Epic 4.2: Micro-interactions

| ID    | Task                        | Status | Files                                        | Tests            | Validation         |
| ----- | --------------------------- | ------ | -------------------------------------------- | ---------------- | ------------------ |
| 4.2.1 | Add button press effects    | ☐ Open | All button components                        | Interaction test | Feels responsive   |
| 4.2.2 | Implement card hover states | ☐ Open | All card components                          | Hover test       | Smooth transitions |
| 4.2.3 | Create loading animations   | ☐ Open | `src/lib/components/LoadingStates.svelte`    | Animation test   | Engaging loaders   |
| 4.2.4 | Add success animations      | ☐ Open | `src/lib/components/SuccessAnimation.svelte` | Completion test  | Celebratory feel   |
| 4.2.5 | Implement error states      | ☐ Open | `src/lib/components/ErrorStates.svelte`      | Error test       | Clear, helpful     |

### Epic 4.3: Performance & Polish

| ID    | Task                           | Status | Files                      | Tests         | Validation          |
| ----- | ------------------------------ | ------ | -------------------------- | ------------- | ------------------- |
| 4.3.1 | Optimize animation performance | ☐ Open | All animated components    | FPS test      | Consistent 60fps    |
| 4.3.2 | Add progressive enhancement    | ☐ Open | All interactive components | Fallback test | Works without JS    |
| 4.3.3 | Implement lazy loading         | ☐ Open | Route components           | Load test     | Fast initial load   |
| 4.3.4 | Create offline support         | ☐ Open | `static/sw.js`             | Offline test  | Basic functionality |
| 4.3.5 | Add prefers-reduced-motion     | ☐ Open | All animations             | Motion test   | Respects preference |

### Epic 4.4: Cross-platform Testing

| ID    | Task                     | Status | Files                     | Tests         | Validation           |
| ----- | ------------------------ | ------ | ------------------------- | ------------- | -------------------- |
| 4.4.1 | Test on Safari/WebKit    | ☐ Open | All components            | Browser test  | No Safari bugs       |
| 4.4.2 | Verify mobile experience | ☐ Open | All pages                 | Device test   | Touch-friendly       |
| 4.4.3 | Check tablet layouts     | ☐ Open | All responsive components | Viewport test | Looks good           |
| 4.4.4 | Test slow connections    | ☐ Open | All data fetching         | Network test  | Graceful degradation |
| 4.4.5 | Verify accessibility     | ☐ Open | All interactive elements  | WCAG test     | AA compliant         |

## Implementation Notes

### For Each Task:

1. Create branch: `ui-redesign-[epic]-[task-id]`
2. Make minimal changes to complete the task
3. Run visual tests: `npm run test:visual`
4. Verify no regressions: `npm run test:regression`
5. Deploy to staging: `netlify deploy`
6. Run validation checks
7. Merge to main only after validation passes

### Critical Path:

- Phase 0 MUST complete before any other phases
- Phase 1-3 can run in parallel after Phase 0
- Phase 4 requires all previous phases complete

### Blocking Prevention:

- All API endpoints mocked for testing
- Design tokens in CSS variables (no external deps)
- Components self-contained (no global state deps)
- Visual tests use static data
- No user input required for any task

### Emergency Fallbacks:

- If visual test fails: Screenshot diff in `tests/visual/diff/`
- If build fails: Check `npm run build:debug`
- If deploy fails: Use `netlify deploy --debug`
- If animation janky: Disable with CSS class `.no-motion`
