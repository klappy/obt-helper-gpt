# OBT Helper GPT - Technical Architecture

## System Architecture Overview

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

## Key Design Decisions

### 1. Why SvelteKit?
- Modern, fast, and lightweight
- Built-in routing and SSR capabilities
- Smaller bundle sizes than React/Next.js
- Great developer experience
- Easy integration with Netlify

### 2. Why Netlify Blobs?
- Edge-compatible storage
- Simple KV for configs/summaries
- Migration path to Cloudflare KV

### 3. Why Serverless Functions?
- No server management
- Automatic scaling
- Pay-per-use pricing
- Secure API key handling
- Easy deployment

## Data Flow

### User Chat Flow
```
1. User opens tool chat (/chat/creative-writing)
2. SvelteKit loads tool config from Netlify Function
3. User sends message
4. Frontend POST to /api/chat function
5. Function retrieves tool's system prompt from Blobs
6. Function calls OpenAI API with prompt + message
7. Streams response back to frontend
8. Frontend displays in chat interface
```

### Admin Update Flow
```
1. Admin logs in (Netlify Identity)
2. Navigates to tool editor (/admin/tools/[id])
3. Updates system prompt
4. Frontend POST to /api/tools-update
5. Function validates admin auth
6. Updates tool config in Netlify Blobs
7. Changes reflect immediately for users
```

## Memory Architecture

### Session Lifecycle
1. **Session Creation**: New session starts on first user message
2. **Activity Tracking**: All interactions (messages, tool changes, saves) reset 30-minute timeout
3. **Automatic Timeout**: After 30 minutes of inactivity, session triggers summary generation
4. **Summary Storage**: LLM-generated summary stored in edge KV storage with session metadata
5. **Session Cleanup**: Active session data cleared, only persistent summary remains

### Timeout Implementation
```javascript
// Session timeout tracking in whatsapp-session.js
let sessionTimeouts = new Map();

function startSessionTimeout(sessionId, callback) {
  clearTimeout(sessionTimeouts.get(sessionId));
  const timeoutId = setTimeout(() => {
    callback(sessionId);  // Triggers summary generation
    sessionTimeouts.delete(sessionId);
  }, 30 * 60 * 1000); // 30 minutes
  sessionTimeouts.set(sessionId, timeoutId);
}
```

### Summary Generation
- **Model**: Uses `gpt-4o-mini` for cost efficiency
- **Format**: 2-3 sentence summaries focusing on key topics and outcomes
- **Trigger**: Automatic via session timeout or manual admin action
- **Storage**: Dedicated Blobs store (`obt-helper-summaries`) with metadata

```javascript
// Summary storage format
{
  "sessionId": "whatsapp_1234567890",
  "summary": "User discussed recipe modifications and cooking techniques for pasta dishes.",
  "messageCount": 15,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Natural Language Recall
- **Keywords**: Simple detection for `recall`, `remember`, `last chat`, `previous`, `earlier`, `before`, `history`
- **Query Processing**: Intercepts user messages before OpenAI API calls
- **Response Format**: Chronological list of past conversation summaries with dates and message counts
- **Limitation**: Returns last 3 conversations for relevance and performance

```javascript
// Recall query example
User: "recall our last chat"
Assistant: "Here's what we discussed in our previous conversations:

1. 1/14/2025: User discussed recipe modifications and cooking techniques for pasta dishes. (15 messages)
2. 1/12/2025: User asked about meal planning and grocery shopping tips. (8 messages)"
```

### Memory Storage Strategy
- **Active Sessions**: In-memory with timeout tracking
- **Conversation History**: Temporary (cleared on timeout)
- **Summaries**: Persistent in edge storage
- **Retrieval**: Fast KV lookups by session prefix
- **Cleanup**: Automatic removal of old summaries (30+ days)

### Error Handling
- **Summary Generation Failures**: Graceful degradation, session still cleaned up
- **Storage Errors**: Logged but non-blocking to chat functionality
- **Recall Failures**: User-friendly error messages, system continues normally
- **Timeout Issues**: Fallback cleanup mechanisms prevent memory leaks

## Security Architecture

### API Keys
- OpenAI key stored in Netlify environment variables
- Never exposed to frontend
- All API calls go through serverless functions

### Authentication
- Netlify Identity for admin access
- JWT tokens for session management
- Admin routes protected by middleware

### Data Protection
- No user data stored permanently
- Chat sessions exist only in browser memory
- System prompts secured in Netlify Blobs
- HTTPS everywhere (Netlify default)

## Scalability Considerations

### Current Design (MVP)
- Edge KV for tools/summaries
- Browser/edge cache for sessions
- Modular OpenAI calls

### Future Scaling Options
- Auto-downgrade models on costs
- Service workers for offline
- Vendor adapters for LLMs

## Performance Optimizations

### Frontend
- Lazy load chat components
- Preload tool configs on hover
- Service worker for offline support
- Optimize images and icons

### Backend
- Edge functions for static data
- Streaming responses (no buffering)
- Efficient blob reads/writes
- Connection pooling for external services

## Error Handling Strategy

### User-Facing Errors
- Friendly error messages
- Fallback UI states
- Retry mechanisms
- Offline detection

### System Errors
- Structured logging
- Error boundaries in Svelte
- Function timeout handling
- Rate limit management

## Monitoring & Analytics

### Basic Metrics
- Function invocation counts
- Response times
- Error rates
- Token usage per tool

### Future Additions
- User engagement metrics
- Popular tools tracking
- Conversation quality scores
- A/B testing infrastructure

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run Netlify functions locally
netlify dev
```

### Deployment
```bash
# Deploy to Netlify
git push origin main
# Netlify auto-deploys on push
```

### Environment Setup
```
OPENAI_API_KEY=sk-...
NETLIFY_BLOBS_CONTEXT=... (auto-set by Netlify)
PUBLIC_ADMIN_EMAIL=admin@obthelper.com
```

## Testing Strategy

### Unit Tests
- Svelte components with Vitest
- Function logic testing
- Prompt validation tests

### Integration Tests
- API endpoint testing
- Auth flow testing
- Error scenario testing

### E2E Tests
- User chat flows
- Admin workflows
- Voice feature testing

---

*"This architecture is like a well-organized garage. Everything has its place, and you can actually find what you need. Unlike my actual garage."* - Nate
