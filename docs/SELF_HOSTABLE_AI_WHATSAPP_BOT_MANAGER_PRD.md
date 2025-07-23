# Product Requirements Document (PRD): Self-Hostable AI-Powered WhatsApp Bot Manager Site

## Executive Summary

The Self-Hostable AI-Powered WhatsApp Bot Manager Site is a lightweight, open-source platform enabling admins to deploy and manage customizable AI assistants accessible via web and WhatsApp. Built for antifragility, it runs on minimal serverless infrastructure (e.g., Netlify or Cloudflare), supports stateless operations, and emphasizes zero vendor lock-in with easy forking and redeployment. Key features include sandboxed chat sessions, intelligent tool switching, episodic memory summaries, admin dashboards for tool management and cost tracking, and future-ready architecture for multimodal inputs (audio/image). The MVP focuses on OpenAI integration but is modular for other LLMs. This PRD outlines a production-grade implementation path, targeting scalability on pennies-per-month costs, with no multi-tenancy needs—it's a single-org toolkit.

**Objectives**: Deliver a scalable, intuitive platform for AI assistant management without user accounts, prioritizing privacy, cost efficiency, and community shareability.  
**Success Metrics**: Deployment in under 30 minutes, <1s response times, monthly costs under $5 for moderate use, 99% uptime via edge computing.  
**Timeline Estimate**: MVP in 4-6 weeks, assuming extension of existing OBT Helper GPT codebase.  
**Risks**: Browser-specific voice limitations (mitigate with fallbacks); OpenAI API costs (mitigate with ceilings and downgrades).

## User Personas & Roles

1. **Admin (e.g., Marcia Suzuki - Primary User)**: Tech-savvy manager deploying AI bots for personal/business use. Needs to create/customize tools, monitor costs, override responses, and export configs. Pain points: High LLM bills, complex setups; Goals: Easy self-hosting, real-time analytics.  
2. **End-User (Anonymous Chatter)**: Casual users interacting via web or WhatsApp. No tech expertise; expects simple, responsive chats with optional voice. Pain points: Context loss on switches; Goals: Seamless AI help without logins.  
3. **Developer/Contributor**: Open-source enthusiasts forking the repo. Needs clear docs, modular code for extensions (e.g., new LLMs). Pain points: Vendor lock-in; Goals: Quick redeployment to Cloudflare.  
4. **Auditor/QA Role (Admin Subset)**: Reviews logs, summaries for training/feedback. Needs access to private memory archives without exposing user data.

## Detailed Functional Requirements

Aligning with the query's functional objectives:

1. **Frontend UX**  
   - Homepage: Grid of ToolCards (extend existing src/lib/components/ToolCard.svelte) showing name, description, icon. Click to enter sandboxed chat (routes/chat/[toolId]/+page.svelte).  
   - Chat Interface: Reactive text input, message history, voice controls (extend VoiceControls.svelte). Warn on tool switch: "Switching will reset context—continue?" Use natural language query for resuming via summaries (e.g., "Recall my last recipe chat").  
   - Responsiveness: TailwindCSS for mobile/desktop; dark mode optional.

2. **WhatsApp Integration**  
   - Unified Bot: Webhook (extend netlify/functions/whatsapp.js) infers tool from message intent using lightweight LLM call (e.g., GPT-4o-mini). Confirm switch: "Switch to Recipe Helper? Reply YES."  
   - Session Sync: Per-user/per-tool context; use phone number as anonymous ID.  
   - Linking: Web form for phone entry; send one-time code via WhatsApp for sync (store in edge KV).

3. **Admin Dashboard**  
   - Routes: /admin/tools/[id] for CRUD (extend existing). Export/import as JSON.  
   - Analytics: Visualize usage (extend ai-usage.js), token costs, WhatsApp metrics. Set per-tool cost ceilings with auto-downgrade (e.g., to cheaper model).  
   - Override: Human-in-loop via impersonation in chat previews.

4. **Conversation Memory**  
   - Episodic: Sessions timeout after inactivity (e.g., 30min) or switch; summarize via LLM and store.  
   - Archival: Queryable summaries (e.g., "What did we discuss about math?"); private to instance, admin-accessible.  
   - Storage: Edge KV (Netlify Blobs → Cloudflare KV migration).

5. **Tool Sharing and Templates**  
   - Forkable: All tools exportable as JSON templates.  
   - Deployment: One-click buttons for Netlify/Cloudflare; full docs in /docs.

6. **LLM and API Layer**  
   - Integration: OpenAI GPT-4o family via utils/openai.js; modular for swaps.  
   - Plugins: Config-defined helpers (e.g., API calls in tool prompts).  
   - Validation: Preflight checks on save (e.g., prompt syntax).

## Architecture Diagram & Component Breakdown

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   SvelteKit     │◀───▶│ Edge Functions   │◀───▶│  LLM Provider   │
│   Frontend      │     │ (Netlify/Workers)│     │  (OpenAI, etc.) │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │ Edge Storage     │◀───────────┘
         │              │ (Blobs/KV/R2)   │
         │              │                  │
         └─────────────▶└──────────────────┘
                        │
                        ▼
                 ┌──────────────────┐
                 │ WhatsApp Webhook │
                 │ (Twilio, etc.)   │
                 └──────────────────┘
```

- **Frontend**: SvelteKit routes for homepage, chats, admin (existing + extensions). Components: ChatInterface, ToolCard, VoiceControls.  
- **Backend**: Serverless functions for chat, tools CRUD, WhatsApp webhook, usage stats.  
- **Storage**: Edge-compatible for configs, summaries, logs.  
- **Integrations**: OpenAI API, WhatsApp via webhooks, optional external APIs in tools.

## Storage and Persistence Strategy

- **Primary**: Netlify Blobs for MVP (existing); migrate to Cloudflare KV/Durable Objects for self-hosting. Fallback to local files in dev.  
- **Data Types**: Tool configs (JSON), memory summaries (per-user keyed), usage logs (append-only).  
- **Antifragile Design**: Stateless reads/writes; no databases—simple key-value. Private per-instance; exportable for backups.  
- **Migration Path**: Scripts to port from Blobs to KV.

## Session Lifecycle and Memory Management

- **Lifecycle**: Start on first message; ID by anonymous token (web) or phone (WhatsApp). Expire after timeout; summarize and archive.  
- **Memory**: In-session: Browser memory + edge cache. Post-session: LLM-generated summary stored in KV. Query via natural language (embeddings optional for scale). Sandbox per-tool to prevent pollution.  
- **Admin Access**: View/export summaries for QA; no user PII beyond opt-in phone.

## Model Switching Logic

- **Config**: Per-tool model/temperature in admin (e.g., GPT-4o for complex, mini for simple).  
- **Dynamic**: Auto-downgrade on cost ceiling hit (e.g., if >80% budget, switch to cheaper). Recommend in dashboard: "Downgrade to mini to save 30%?"  
- **Modular**: Abstract in utils/openai.js; swap via config (e.g., to Claude via adapter).

## WhatsApp <-> Web Linking Design

- **Process**: User enters phone on web; system sends code via WhatsApp bot. Reply with code to link sessions. Store mapping in KV (expires after 24h).  
- **Context Sync**: Mirror messages bidirectionally; infer tool switches. Fallback: "Continue on web? Scan QR."  
- **Security**: No persistent user data; opt-in only.

## Admin Dashboard Features

- **Core**: Tool CRUD, prompt editor with live preview (existing extension).  
- **Analytics**: Charts for usage, costs (extend ai-usage.js); set ceilings with alerts.  
- **Overrides**: Impersonate in chats; manual response injection.  
- **Auth**: Simple email/phone + password (existing Netlify Identity fallback).

## Deployment Instructions & DevEx Considerations

- **Self-Hosting**: Fork repo; deploy via Netlify CLI or Cloudflare Pages. Scripts in /scripts for setup (e.g., version.js for semver).  
- **Dev Workflow**: npm run dev for local; auto-start Netlify functions. Env vars: OPENAI_API_KEY, etc. (docs/DEVELOPMENT.md).  
- **Docs**: Auto-gen API.md; Markdown help in /docs for all features.

## Testing & QA Strategy

- **Unit**: Vitest for components (existing in lib/components/*.test.js).  
- **E2E**: Playwright for flows (extend tests/integration.test.ts); cover chats, WhatsApp sims, admin.  
- **CI/CD**: GitHub Actions; 100% coverage for major paths. Manual QA: Admin overrides for human-in-loop.  
- **Edge Cases**: Offline fallbacks, cost ceilings, multimodal stubs.

## Performance, Cost, and Scaling Guidelines

- **Performance**: <1s TTFB via edge; streaming responses. Optimize with lazy loads.  
- **Cost**: Track tokens per interaction (ai-usage.js); ceilings enforce shutdowns. Aim < $0.01/chat.  
- **Scaling**: Serverless auto-scales; cap at 100 concurrent via functions. Monitor via Netlify logs.

## Future Enhancements

- **Multimodal**: Add image/audio handlers in chat (Web APIs); store in R2.  
- **Offline**: Service workers for on-device sessions; local LLM stubs.  
- **Vendor Agnostic**: Adapters for Claude/Mistral.  
- **Templates**: Community repo for shared tools.  
- **Advanced**: Real-time cost UI for users; A/B prompt testing.