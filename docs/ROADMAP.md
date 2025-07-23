# Revised Public Roadmap: Refactoring OBT Helper GPT to Self-Hostable AI WhatsApp Bot Manager

## Revised Evaluation Summary
(Re-evaluated PRD vs. codebase/docs): Gaps remain as before, but deepened analysis shows needs for specific integrations (e.g., Twilio for WhatsApp codes), dependency installs (e.g., for charts if not present), and more tests (extend integration.test.ts for 80%+ coverage). Refactor stays minimal: 80% extensions to existing files. Added granularity for autonomous execution—each sub-task specifies tools (e.g., edit_file, run_terminal_cmd), files, and ship criteria. Assumes tools like Netlify CLI installed; if not, install via npm.

## Phased Task List / Roadmap (Detailed Edition)
Phases = Major semver (e.g., 2.0.0). Steps = Minor (e.g., 2.1.0). Sub-tasks = Atomic commits that ship. For each sub-task: Use tools to edit/read/run; test with npm run test:integration; build with npm run build; deploy with netlify deploy --prod or git push (assuming CI); validate via manual prod check or script (e.g., curl to endpoints). If fails, rollback and retry (up to 3x per file). Bump versions with npm run version:minor/major. Track publicly in GitHub Issues.

### Phase 1: Core Refactor and MVP Enhancements (Major: 2.0.0 - Est. 1-2 weeks)
Focus: Add memory basics, admin cost tools. Dependencies: Ensure chart lib (e.g., Chart.js) if needed—install via npm i chart.js.

- **Step 1.1: Session and Memory Foundations (Minor: 2.1.0)**  
  - Sub-task 1.1.1: Add timeout logic to utils/whatsapp-session.js (set 30min inactivity trigger; use setTimeout). Edit file: utils/whatsapp-session.js. Test: Add Vitest unit test for timeout. Build/Deploy. Validate: In prod, idle a session >30min, check if summarized (log via console or Blobs check).  
  - Sub-task 1.1.2: Integrate LLM summary generation (call openai.js with prompt like "Summarize this chat:"). Edit: utils/whatsapp-session.js (add function), netlify/functions/chat.js (trigger on expire). Test: Playwright E2E for full chat flow. Build/Deploy. Validate: End prod chat, query Blobs for summary key.  
  - Sub-task 1.1.3: Add query interface in src/lib/components/ChatInterface.svelte (parse input for "recall" keywords, fetch from Blobs). Edit: ChatInterface.svelte, add store in stores/chat.js. Test: Vitest for component parsing. Build/Deploy. Validate: Type "recall last chat" in prod, see summary response.  
  - Sub-task 1.1.4: Docs update—add memory section to ARCHITECTURE.md; archive old session notes if any. Edit: docs/ARCHITECTURE.md. Test: N/A (manual review). Build/Deploy. Validate: Prod docs page renders updated content.

- **Step 1.2: Admin Analytics and Cost Basics (Minor: 2.2.0)**  
  - Sub-task 1.2.1: Extend logging in src/lib/utils/ai-usage.js (add token calc per call, store in Blobs append-only). Edit: ai-usage.js, add function in netlify/functions/ai-usage-stats.js. Test: Integration test for logging. Build/Deploy. Validate: Run prod chat, check stats endpoint (curl /.netlify/functions/ai-usage-stats).  
  - Sub-task 1.2.2: Add viz charts in src/routes/admin/+page.svelte (use Chart.js for usage graphs). Install if needed: run_terminal_cmd "npm i chart.js". Edit: +page.svelte. Test: Vitest for chart render. Build/Deploy. Validate: View prod admin, see populated charts.  
  - Sub-task 1.2.3: Implement ceilings and downgrade in admin/tools/[id]/+page.svelte (form field for ceiling, logic in openai.js to check/swap model). Edit: +page.svelte, openai.js. Test: E2E for form submit and downgrade trigger. Build/Deploy. Validate: Set low ceiling in prod, exceed it, confirm model switches (log check).  
  - Sub-task 1.2.4: Add override UI in admin chat previews (text input to inject responses). Edit: src/routes/admin/tools/[id]/+page.svelte. Test: Playwright for injection flow. Build/Deploy. Validate: Override in prod preview, see it reflect in simulated chat.

### Phase 2: Advanced Integrations and Sharing (Major: 3.0.0 - Est. 2 weeks)
Focus: WhatsApp depth, sharing. Dependencies: Twilio SDK if not present—npm i twilio.

- **Step 2.1: WhatsApp Intent and Linking (Minor: 3.1.0)**  
  - Sub-task 2.1.1: Add intent inference in netlify/functions/whatsapp.js (LLM call to match message to tool via openai.js). Edit: whatsapp.js. Test: Script in scripts/test-whatsapp-sync.js with curl sim. Build/Deploy. Validate: Send prod WA message (via real Twilio), check reply confirmation.  
  - Sub-task 2.1.2: Implement linking form in src/routes/chat/[toolId]/+page.svelte (phone input, generate code, send via Twilio). Edit: +page.svelte, add function in netlify/functions/verify-sync.js. Test: E2E for form and code receipt. Build/Deploy. Validate: Enter phone in prod, receive/reply code, confirm session link (check Blobs).  
  - Sub-task 2.1.3: Add bidirectional mirroring (sync messages between web/WA). Edit: whatsapp.js and chat.js (shared session ID). Test: Integration test with simulated messages. Build/Deploy. Validate: Message in prod web, see it in WA (manual).  
  - Sub-task 2.1.4: Update docs/WHATSAPP_TOOL_SYNC_PLAN.md with new linking flows. Edit: WHATSAPP_TOOL_SYNC_PLAN.md. Build/Deploy. Validate: Docs update visible.

- **Step 2.2: Tool Sharing and Templates (Minor: 3.2.0)**  
  - Sub-task 2.2.1: Add export button in admin/tools/[id]/+page.svelte (JSON download). Edit: +page.svelte. Test: Vitest for export function. Build/Deploy. Validate: Export prod tool, check JSON file.  
  - Sub-task 2.2.2: Add import form (upload JSON, validate/save to Blobs). Edit: src/routes/admin/tools/+page.svelte. Test: E2E for import flow. Build/Deploy. Validate: Import in prod, see new tool appear.  
  - Sub-task 2.2.3: Add deploy buttons/docs in docs/DEPLOYMENT.md (Netlify/Cloudflare links). Edit: DEPLOYMENT.md. Build/Deploy. Validate: Click links from prod docs.  
  - Sub-task 2.2.4: Update README.md with forking notes. Edit: README.md. Build/Deploy. Validate.

### Phase 3: Future-Proofing and Optimizations (Major: 4.0.0 - Est. 1-2 weeks)
Focus: Multimodal, offline, swaps. Dependencies: Workbox for service workers—npm i workbox-window.

- **Step 3.1: Multimodal and Offline Stubs (Minor: 4.1.0)**  
  - Sub-task 3.1.1: Add image/audio upload stubs in ChatInterface.svelte (file input, placeholder handlers). Edit: ChatInterface.svelte. Test: Vitest for upload. Build/Deploy. Validate: Upload dummy file in prod.  
  - Sub-task 3.1.2: Register service worker for offline caching (sessions in IndexedDB). Run: npm i workbox-window; Edit: src/app.html (script tag), add sw.js in static/. Test: Playwright offline mode. Build/Deploy. Validate: Disconnect prod, resume chat.  
  - Sub-task 3.1.3: Stub audio handlers (Web Audio API placeholders). Edit: src/lib/components/VoiceControls.svelte. Test: Integration. Build/Deploy. Validate: Prod voice with dummy audio.  
  - Sub-task 3.1.4: Update ARCHITECTURE.md with stubs. Edit: ARCHITECTURE.md. Build/Deploy. Validate.

- **Step 3.2: Vendor Agnostic and Scaling (Minor: 4.2.0)**  
  - Sub-task 3.2.1: Refactor openai.js to adapter pattern (e.g., class with swap method for Claude). Edit: openai.js. Test: Unit test for swap. Build/Deploy. Validate: Config swap in prod, use mock endpoint.  
  - Sub-task 3.2.2: Add scaling caps (e.g., rate limit in functions). Edit: netlify.toml (for functions), add utils/rate-limiter.js. Test: Load test script. Build/Deploy. Validate: Stress prod with multiple requests.  
  - Sub-task 3.2.3: Add user cost UI in ChatInterface.svelte (real-time token display). Edit: ChatInterface.svelte. Test: Vitest. Build/Deploy. Validate: See costs during prod chat.  
  - Sub-task 3.2.4: Stub A/B testing in admin (toggle prompts). Edit: admin/tools/[id]/+page.svelte. Test: E2E. Build/Deploy. Validate: Toggle in prod.  
  - Sub-task 3.2.5: Final docs update in PRODUCTION_DEPLOYMENT.md. Edit: PRODUCTION_DEPLOYMENT.md. Build/Deploy. Validate.

## Final Delivery Notes
- **Granularity**: Now executable autonomously—each sub-task is self-contained with tools/files/tests.  
- **Ship Guarantee**: If a commit fails validation, use tools to debug/fix (e.g., read_file for errors, run_terminal_cmd for logs). Loop retries as needed.  
- **Public Tracking**: Create GitHub Project board with these issues.