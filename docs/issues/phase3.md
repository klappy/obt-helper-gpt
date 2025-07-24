# Phase 3 Issues – Future-Proofing & Optimizations (Epic 3)

> Major Release 4.0.0  |  Minor Releases 4.1.x / 4.2.x

## Status Legend
- ☑ Closed
- ☐ Open

---

### Step 3.1 – Multimodal & Offline Stubs (Minor 4.1.0)

| ID | Issue | Status | Files / Touchpoints | Tests | Validation Criteria |
|----|-------|--------|---------------------|-------|---------------------|
| 3.1.1 | Add image/audio upload stubs | ☐ Open | `ChatInterface.svelte` | Vitest | Upload UI visible, sends placeholder data |
| 3.1.2 | Register service worker with Workbox | ☐ Open | `src/app.html`, `static/sw.js` | Playwright offline | Chat resumes offline session |
| 3.1.3 | Stub audio handlers in VoiceControls | ☐ Open | `VoiceControls.svelte` | Integration | Dummy audio output plays in prod |
| 3.1.4 | Update architecture docs with stubs | ☐ Open | `docs/ARCHITECTURE.md` | Manual | Docs updated |

---

### Step 3.2 – Vendor Agnostic & Scaling (Minor 4.2.0)

| ID | Issue | Status | Files / Touchpoints | Tests | Validation Criteria |
|----|-------|--------|---------------------|-------|---------------------|
| 3.2.1 | Refactor openai.js to adapter pattern | ☐ Open | `src/lib/utils/openai.js` | Unit adapter swap | Config swap to mock LLM succeeds |
| 3.2.2 | Add rate-limiting middleware | ☐ Open | `netlify.toml`, `utils/rate-limiter.js` | Load test script | Excess requests return 429 in prod |
| 3.2.3 | Add real-time cost UI in chat | ☐ Open | `ChatInterface.svelte` | Vitest | Cost ticker updates during chat |
| 3.2.4 | Stub A/B testing toggle in admin | ☐ Open | `admin/tools/[id]/+page.svelte` | Playwright | Toggle saves variant flag |
| 3.2.5 | Final production deployment docs update | ☐ Open | `docs/PRODUCTION_DEPLOYMENT.md` | Manual | Docs section visible |

---

## Closing Criteria for Epic 3
- All nine issues ☑ closed.
- Minor versions 4.1.0 and 4.2.0 deployed with validation.