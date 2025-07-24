# Phase 1 Issues – Core Refactor & MVP Enhancements (Epic 1)

> Major Release 2.0.0  |  Minor Releases 2.1.x / 2.2.x

## Status Legend
- ☑ Closed
- ☐ Open

---

### Step 1.1 – Session & Memory Foundations (Minor 2.1.0)

| ID | Issue | Status | Files / Touchpoints | Tests | Validation Criteria |
|----|-------|--------|---------------------|-------|---------------------|
| 1.1.1 | Add 30-min timeout logic to `utils/whatsapp-session.js` | ☐ Open | `utils/whatsapp-session.js` | Vitest unit timeout | Session summarises after idle ≥30 min in prod logs |
| 1.1.2 | Integrate LLM summary generation | ☐ Open | `utils/whatsapp-session.js`, `netlify/functions/chat.js` | Playwright E2E | Summary stored in Blobs; retrievable key exists |
| 1.1.3 | Implement natural-language recall in `ChatInterface.svelte` | ☐ Open | `src/lib/components/ChatInterface.svelte`, `src/lib/stores/chat.js` | Vitest component parsing | Typing “recall last chat” returns summary in prod |
| 1.1.4 | Update docs with Memory section | ☐ Open | `docs/ARCHITECTURE.md` | Manual | Section visible in prod docs |

---

### Step 1.2 – Admin Analytics & Cost Basics (Minor 2.2.0)

| ID | Issue | Status | Files / Touchpoints | Tests | Validation Criteria |
|----|-------|--------|---------------------|-------|---------------------|
| 1.2.1 | Extend token logging in `ai-usage.js` & stats function | ☐ Open | `src/lib/utils/ai-usage.js`, `netlify/functions/ai-usage-stats.js` | Integration test | Hitting stats endpoint returns recent usage |
| 1.2.2 | Add Chart.js usage viz to `admin/+page.svelte` | ☐ Open | `src/routes/admin/+page.svelte` | Vitest render | Charts display data in prod admin |
| 1.2.3 | Implement cost ceilings + auto-downgrade | ☐ Open | `admin/tools/[id]/+page.svelte`, `src/lib/utils/openai.js` | Playwright | Setting low ceiling swaps model in prod logs |
| 1.2.4 | Add human override UI in admin preview | ☐ Open | `admin/tools/[id]/+page.svelte` | Playwright | Admin override message appears in chat preview |

---

## Closing Criteria for Epic 1
- All eight issues ☑ closed.
- Minor versions 2.1.0 and 2.2.0 deployed to production with validation.