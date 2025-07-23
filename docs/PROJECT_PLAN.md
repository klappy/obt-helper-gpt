# OBT Helper GPT - Project Plan

## 🎯 Project Status: 90% COMPLETE ✨

**What's Working:**

- ✅ Complete SvelteKit application with 6 AI tools
- ✅ Real-time streaming chat with OpenAI integration
- ✅ Full admin panel with system prompt editing
- ✅ Voice input/output (speech-to-text & text-to-speech)
- ✅ Local persistence (file-based) + production persistence (Netlify Blobs)
- ✅ Mobile-responsive design with modern UI
- ✅ Live prompt preview with actual OpenAI responses

**Ready for:** Production deployment, browser testing, performance optimization

---

## Overview

We're building a self-hostable AI-powered WhatsApp Bot Manager Site, enabling admins to deploy and manage AI assistants via web and WhatsApp, without user ChatGPT accounts. It extends the original OBT Helper GPT with PRD-aligned features like episodic memory, cost tracking, and multimodal readiness.

## Tech Stack

- **Frontend**: SvelteKit (modern, fast)
- **Styling**: Tailwind CSS
- **Hosting**: Netlify (serverless functions) or Cloudflare Workers
- **Storage**: Netlify Blobs (MVP) with migration to Cloudflare KV
- **AI**: OpenAI API (GPT-4o family), modular for alternatives
- **Auth**: Simple password + email/phone verification
- **Voice**: Web Speech API (with fallbacks)
- **Testing**: Vitest (unit), Playwright (E2E)

## Core Features

### 1. Public-Facing Website

- Homepage with tool grid
- Sandboxed chat per tool
- Voice input/output
- Responsive design
- Anonymous access

### 2. AI Tools

Each tool includes:

- Name, description, icon
- Custom system prompt
- Model, temperature, max tokens
- Cost ceilings with downgrade
- Exportable templates

### 3. Chat Interface

- Streaming responses
- Episodic memory summaries
- Natural language recall
- Tool switching warnings
- Token/cost indicators

### 4. Admin Panel

- Simple auth
- Tool CRUD with previews
- Usage analytics and viz
- Cost management
- Human overrides

### 5. WhatsApp Integration

- Intent-based tool inference
- Web <-> WA linking via codes
- Session syncing
- Unified bot interface

## Architecture

### Frontend Structure

```
src/
├── routes/
│   ├── +page.svelte              # Landing page
│   ├── +layout.svelte            # Main layout
│   ├── chat/[toolId]/
│   │   └── +page.svelte          # Chat interface
│   └── admin/
│       ├── +layout.svelte        # Admin layout (protected)
│       ├── +page.svelte          # Dashboard
│       └── tools/
│           ├── +page.svelte      # Tools list
│           └── [id]/
│               └── +page.svelte  # Edit tool
├── lib/
│   ├── components/
│   │   ├── ToolCard.svelte
│   │   ├── ChatInterface.svelte
│   │   ├── VoiceControls.svelte
│   │   └── MessageBubble.svelte
│   ├── stores/
│   │   ├── chat.js
│   │   └── auth.js
│   └── utils/
│       └── openai.js
└── app.html
```

### Backend Structure (Netlify Functions)

```
netlify/functions/
├── chat.js                 # Main chat endpoint
├── tools-list.js          # Get all active tools
├── tools-get.js           # Get single tool
├── tools-create.js        # Admin: Create tool
├── tools-update.js        # Admin: Update tool
├── tools-delete.js        # Admin: Delete tool
└── auth-check.js          # Verify admin status
```

### Data Structure (Netlify Blobs)

```javascript
// Stored in Netlify Blobs under key "tools-config"
{
  "tools": [
    {
      "id": "uuid-here",
      "name": "Creative Writing Assistant",
      "description": "Help with stories and creative content",
      "icon": "✍️",
      "systemPrompt": "You are a creative writing assistant...",
      "model": "gpt-4o-mini",
      "temperature": 0.7,
      "maxTokens": 2048,
      "isActive": true,
      "orderIndex": 1,
      "createdAt": "2025-01-15T...",
      "updatedAt": "2025-01-15T..."
    }
  ]
}
```

## API Flow

### Chat Flow

1. User selects a tool and opens chat
2. User sends message (text or voice)
3. Frontend calls `/api/chat` with:
   - toolId
   - message
   - sessionId (for context)
4. Netlify function:
   - Fetches tool config from Blobs
   - Adds system prompt to OpenAI request
   - Streams response back
5. Frontend displays streaming response
6. Optional: TTS speaks the response

### Admin Flow

1. Admin logs in via Netlify Identity
2. Frontend checks auth status
3. Admin can:
   - View all tools
   - Edit system prompts
   - Test changes in preview
   - Reorder tools
   - Enable/disable tools
4. Changes saved to Netlify Blobs
5. Updates reflect immediately

## Development Phases

See detailed roadmap in docs/ROADMAP.md for phased refactoring to PRD specs.

## Environment Variables

```
# .env
OPENAI_API_KEY=sk-...
PUBLIC_SITE_URL=https://obthelper.com
```

## Future Enhancements

- Multimodal (image/audio) support
- Offline capabilities
- Vendor-agnostic LLM adapters
- Tool template sharing
- Real-time cost tracking for users

## Success Metrics

- Deployment <30min
- Response <1s
- Costs <$5/month moderate use
- 99% uptime
- Full PRD feature coverage

## Notes

- Align all development to PRD in docs/SELF_HOSTABLE_AI_WHATSAPP_BOT_MANAGER_PRD.md
- Maintain antifragile, serverless design
- Document only current implementation

---

_"It's like we're building a Swiss Army knife, but for AI conversations. And unlike actual Swiss Army knives, people will actually use all the tools."_ - Nate
