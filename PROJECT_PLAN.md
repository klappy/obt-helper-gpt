# OBT Helper GPT - Project Plan

## Overview
We're rebuilding obthelper.com from a ThingLink-based site to a modern web application. The new version will host AI-powered tools internally instead of redirecting to ChatGPT, with a clean 2025 design and an admin panel for managing system prompts.

## Tech Stack
- **Frontend**: SvelteKit (because we want to try something new)
- **Styling**: Tailwind CSS (for that 2025 polish)
- **Hosting**: Netlify (with serverless functions)
- **Database**: Netlify Blobs (simple key-value storage)
- **AI**: OpenAI API (GPT-4o and GPT-4o-mini)
- **Auth**: Netlify Identity (for admin access)
- **Voice**: Web Speech API (Chrome built-in features)

## Core Features

### 1. Public-Facing Website
- Modern landing page with tool grid
- Individual chat interface for each AI tool
- Voice input/output capabilities
- Mobile-responsive design
- No login required for users

### 2. AI Tools
Each tool consists of:
- Name and description
- Icon/emoji
- Custom system prompt
- Model selection (4o or 4o-mini)
- Temperature and token settings

Example tools might include:
- Creative Writing Assistant
- Math Tutor
- Recipe Helper
- Code Debugger
- Language Learning Buddy
- Business Strategy Advisor

### 3. Chat Interface
- Real-time streaming responses
- Message history (session-based)
- Copy/export functionality
- Voice transcription toggle
- Token usage indicator
- Clean, minimal design

### 4. Admin Panel
- Secure login (Netlify Identity)
- CRUD operations for tools
- System prompt editor with preview
- Model and parameter configuration
- Tool ordering/organization
- Usage analytics (optional)

### 5. Voice Features
- Speech-to-text input (Web Speech API)
- Text-to-speech output (speechSynthesis)
- Push-to-talk or continuous mode
- Language selection
- Fallback for non-Chrome browsers

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

### Phase 1: Foundation (Week 1)
- [ ] Set up SvelteKit project
- [ ] Configure Netlify deployment
- [ ] Implement Netlify Blobs storage
- [ ] Create basic landing page
- [ ] Set up Tailwind CSS

### Phase 2: Core Features (Week 2)
- [ ] Build chat interface component
- [ ] Implement OpenAI integration
- [ ] Create Netlify functions
- [ ] Add streaming responses
- [ ] Test with hardcoded tools

### Phase 3: Admin Panel (Week 3)
- [ ] Set up Netlify Identity
- [ ] Build admin routes
- [ ] Create tool management UI
- [ ] Implement CRUD operations
- [ ] Add prompt preview feature

### Phase 4: Voice & Polish (Week 4)
- [ ] Integrate Web Speech API
- [ ] Add TTS functionality
- [ ] Improve UI/UX
- [ ] Add loading states
- [ ] Error handling
- [ ] Mobile optimization

### Phase 5: Launch Prep
- [ ] Testing across browsers
- [ ] Performance optimization
- [ ] Documentation
- [ ] Set up error tracking
- [ ] Deploy to production

## Environment Variables
```
# .env
OPENAI_API_KEY=sk-...
PUBLIC_SITE_URL=https://obthelper.com
```

## Future Enhancements
- Analytics dashboard
- User accounts (optional)
- Conversation history
- Custom voices for TTS
- Multi-language support
- Rate limiting
- Export conversations
- Prompt templates library
- A/B testing for prompts

## Success Metrics
- Page load time < 2s
- Time to first AI response < 1s
- Mobile-friendly score > 95
- Zero ChatGPT redirects
- Admin changes reflect instantly

## Notes
- Keep the UI simple and clean
- Focus on speed and reliability
- Make prompt editing intuitive
- Ensure voice features degrade gracefully
- Plan for scale but start simple

---

*"It's like we're building a Swiss Army knife, but for AI conversations. And unlike actual Swiss Army knives, people will actually use all the tools."* - Nate
