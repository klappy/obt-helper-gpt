# Phase 2 Issues – Advanced Integrations & Sharing (Epic 2)

> Major Release 3.0.0  |  Minor Releases 3.1.x / 3.2.x

## Status Legend
- ☑ Closed
- ☐ Open

---

### Step 2.1 – WhatsApp Intent & Linking (Minor 3.1.0)

| ID | Issue | Status | Files / Touchpoints | Tests | Validation Criteria |
|----|-------|--------|---------------------|-------|---------------------|
| 2.1.1 | Add intent inference LLM call in `whatsapp.js` | ☐ Open | `netlify/functions/whatsapp.js` | Curl sim via test script | WA message triggers switch confirmation |
| 2.1.2 | Implement phone/code linking form | ☐ Open | `src/routes/chat/[toolId]/+page.svelte`, `netlify/functions/verify-sync.js` | Playwright | Code sent via Twilio, verified, session linked |
| 2.1.3 | Enable bidirectional mirroring | ☐ Open | `whatsapp.js`, `netlify/functions/chat.js` | Integration | Web & WA messages sync in prod |
| 2.1.4 | Update WhatsApp docs | ☐ Open | `docs/WHATSAPP_TOOL_SYNC_PLAN.md`, `docs/WHATSAPP_SYNC_SUMMARY.md` | Manual | Docs show new flows |

---

### Step 2.2 – Tool Sharing & Templates (Minor 3.2.0)

| ID | Issue | Status | Files / Touchpoints | Tests | Validation Criteria |
|----|-------|--------|---------------------|-------|---------------------|
| 2.2.1 | Add export JSON button | ☐ Open | `admin/tools/[id]/+page.svelte` | Vitest | Downloaded file contains tool JSON |
| 2.2.2 | Add import JSON form with validation | ☐ Open | `src/routes/admin/tools/+page.svelte` | Playwright | Imported tool appears active |
| 2.2.3 | Add one-click deploy docs/buttons | ☐ Open | `docs/DEPLOYMENT.md` | Manual | Buttons link to Netlify/Cloudflare deploy flows |
| 2.2.4 | Update README with forking guidance | ☐ Open | `README.md` | Manual | Section visible |

---

## Closing Criteria for Epic 2
- All eight issues ☑ closed.
- Minor versions 3.1.0 and 3.2.0 deployed with validation.