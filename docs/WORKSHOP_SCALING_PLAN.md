# Workshop Scaling Plan: 50 Concurrent Users Creating GPTs

**Scope**: Transformation from single-user admin system to multi-user workshop platform  
**Goal**: Support 50 concurrent users creating, testing, and sharing their own "helpers" (GPTs)  
**Date**: 2025-01-16  
**Status**: PLANNING

---

## Executive Summary

This document outlines the transformation needed to scale the OBT Helper GPT platform from a single-admin tool management system to a multi-user workshop platform where 50 concurrent users can:
- Create accounts
- Browse and test existing helpers
- Create their own helpers via conversational AI guidance
- Test and refine helpers during creation
- Publish and share helpers with unique links

**Key Challenge**: Current system assumes single admin managing all tools. Need multi-user isolation, ownership, and sharing capabilities while maintaining cost efficiency (API-only usage).

---

## Current System Analysis

### What Works (Keep)
- ? SvelteKit frontend + Netlify Functions backend
- ? Netlify Blobs storage (can scale with namespaces)
- ? OpenAI API integration
- ? Chat interface component (reusable)
- ? Tool configuration structure
- ? Admin panel patterns

### What Needs to Change
- ? Single admin email whitelist ? Multi-user authentication
- ? Global tools storage ? User-owned tools + public sharing
- ? No user accounts ? User registration/login
- ? Single namespace storage ? User-scoped storage
- ? No tool creation UI ? Helper Assistant creation flow
- ? No sharing mechanism ? Unique link generation

---

## Workshop Flow Requirements

### 1. User Account Creation
- Simple email/password registration
- No email verification required (workshop context)
- Session-based authentication
- Account persists helpers even after session ends

### 2. Browse and Test Existing Helpers
- Public helpers gallery on homepage
- Filter/search capabilities
- One-click test before creating own
- See helper details (name, description, creator, usage stats)

### 3. Create New Helper Flow
- "Create New Helper" button triggers Helper Assistant
- Helper Assistant is an LLM-powered guide that:
  - Asks questions about the user's idea
  - Understands problem, target audience, use cases
  - Suggests name, description, icon
  - Drafts system prompt iteratively
  - Guides through testing
- User can test helper while still in creation mode
- User can consult Helper Assistant to refine settings/prompts
- Save as draft at any point
- Publish when ready

### 4. Helper Assistant Architecture
- Specialized "meta-helper" with system prompt for helping create helpers
- Maintains creation context across conversation
- Progressive disclosure: asks questions, builds config incrementally
- Can generate/modify system prompts, names, descriptions
- Can suggest icons, images (future)
- Validates helper configuration before publishing

### 5. Testing During Creation
- Embedded chat interface in creation flow
- Test against current draft configuration
- Real-time prompt editing with live preview
- Switch between "Edit" and "Test" modes seamlessly

### 6. Publishing and Sharing
- Generate unique shareable link (e.g., `/helper/{unique-id}`)
- Link works for anyone (no auth required to use shared helpers)
- Creator gets analytics (usage, cost attribution)
- Published helpers appear in public gallery (optional)
- Creator can unpublish/delete their helpers

---

## Technical Architecture Changes

### Authentication System

**Current**: Simple email whitelist in `src/lib/stores/auth.js`

**New**: User accounts with:
- Email/password registration
- JWT tokens for session management
- User profile storage in Netlify Blobs
- Session management via httpOnly cookies

**Implementation**:
```typescript
// New: src/lib/stores/user.js
export interface User {
  id: string; // UUID
  email: string;
  name?: string;
  createdAt: string;
  helpersCreated: number;
}

// New: netlify/functions/auth.js
// - POST /auth/register
// - POST /auth/login
// - POST /auth/logout
// - GET /auth/me
```

**Storage Pattern**:
```
netlify-blobs/
  users/
    {userId}/
      profile.json
      helpers/
        {helperId}.json
```

### Tool Ownership Model

**Current**: Global tools array in single blob

**New**: User-owned helpers with sharing:
- Each helper has `ownerId` field
- Helpers stored in user's namespace: `users/{userId}/helpers/{helperId}.json`
- Public helpers indexed separately: `public-helpers/{helperId}.json` (symbolic link)
- Shareable links map to helper IDs with lookup

**Helper Object Structure**:
```typescript
interface Helper {
  id: string; // unique ID (e.g., "creative-writing-abc123")
  ownerId: string; // user ID
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  model: "gpt-4o" | "gpt-4o-mini";
  temperature: number;
  maxTokens: number;
  isPublic: boolean; // appears in gallery
  isPublished: boolean; // has shareable link
  shareableLink?: string; // e.g., "/helper/creative-writing-abc123"
  createdAt: string;
  updatedAt: string;
  usageStats?: {
    conversations: number;
    messages: number;
    cost: number;
  };
}
```

### Helper Assistant Implementation

**New Meta-Helper**: Special helper for creating other helpers

```typescript
// Helper Assistant system prompt
const HELPER_ASSISTANT_PROMPT = `You are a Helper Assistant, an AI that helps users create their own AI helpers (GPTs).

Your role:
1. Interview users to understand what helper they want to create
2. Ask clarifying questions about:
   - Problem they want to solve
   - Target audience
   - Use cases and examples
   - Tone and style
3. Suggest name, description, and icon
4. Draft and refine system prompts
5. Guide them through testing

You have access to:
- Creating helper configurations
- Updating system prompts
- Testing helpers in real-time
- Validating helper configurations

Be conversational, helpful, and guide users step-by-step.`;

// Storage: users/{userId}/helper-creation-sessions/{sessionId}.json
interface HelperCreationSession {
  sessionId: string;
  userId: string;
  currentHelper: Partial<Helper>; // Work in progress
  conversationHistory: ChatMessage[];
  state: "interviewing" | "drafting" | "testing" | "publishing";
  createdAt: string;
  updatedAt: string;
}
```

**New Route**: `/create-helper`
- Shows Helper Assistant chat interface
- Maintains creation session state
- Side panel shows current helper config (live preview)
- "Test Helper" button switches to test mode
- "Publish" button finalizes and generates shareable link

### Storage Architecture

**Namespace Strategy**:
```
netlify-blobs/
  public-index/          # Fast lookup for public helpers
    {helperId} ? metadata
  users/                  # User data isolation
    {userId}/
      profile.json
      helpers/
        {helperId}.json   # Helper configs
      sessions/
        {sessionId}.json  # Chat sessions
      helper-creation/    # Helper creation sessions
        {sessionId}.json
```

**Blob Store Names**:
- `obt-helper-users` - User profiles and helpers
- `obt-helper-public` - Public helper index (denormalized for performance)
- `obt-helper-sessions` - Chat sessions (existing pattern)

### API Endpoints (New)

```
# Authentication
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me

# Helpers (User-owned)
GET    /helpers/my-helpers           # User's helpers
POST   /helpers                       # Create new helper
GET    /helpers/{helperId}            # Get helper (if owner or public)
PUT    /helpers/{helperId}            # Update helper (owner only)
DELETE /helpers/{helperId}            # Delete helper (owner only)
POST   /helpers/{helperId}/publish    # Publish helper (generate link)
POST   /helpers/{helperId}/unpublish # Unpublish helper

# Helper Assistant
POST   /helper-assistant/start        # Start creation session
POST   /helper-assistant/chat         # Chat with Helper Assistant
POST   /helper-assistant/save-draft   # Save current helper draft
GET    /helper-assistant/session/{sessionId} # Get creation session

# Public Gallery
GET    /helpers/public               # List public helpers
GET    /helpers/{helperId}/test       # Test helper (public access)

# Sharing
GET    /h/{shareId}                  # Resolve shareable link
```

### Frontend Routes (New)

```
/                         # Public gallery + login/register
/login                    # Login page
/register                 # Registration page
/dashboard                # User's helper dashboard
/create-helper            # Helper Assistant creation flow
/my-helpers               # User's created helpers list
/helper/{helperId}        # Public helper chat (shared link)
/helper/{helperId}/edit   # Edit helper (owner only)
```

---

## Scalability Considerations

### 50 Concurrent Users

**Storage Scaling**:
- Netlify Blobs handles this easily (unlimited storage)
- Namespace isolation prevents conflicts
- No database needed (workshop scope)

**API Rate Limits**:
- OpenAI API: 500 req/min (GPT-4o) or 1000 req/min (GPT-4o-mini)
- 50 users ? ~2 requests/min = 100 requests/min ? Well within limits
- Consider rate limiting per user to prevent abuse

**Cost Management**:
- Track costs per helper (owner attribution)
- Track costs per user (workshop budget tracking)
- Implement cost ceilings per user/helper if needed
- Use GPT-4o-mini for Helper Assistant (cost efficiency)

**Performance**:
- Edge functions scale automatically
- Blob reads are fast (edge-optimized)
- Consider caching public helper list
- No need for CDN (already edge-hosted)

### Limits and Constraints

**Per User**:
- Max helpers per user: Unlimited (or 50 for workshop)
- Max draft helpers: 10 (encourage publishing)
- Helper Assistant sessions: 1 active at a time

**Helper Constraints**:
- System prompt length: Max 4000 characters
- Name length: Max 100 characters
- Description length: Max 500 characters
- Max conversations per helper: No limit (usage tracked)

**Workshop-Specific**:
- Account expiration: Not required (workshop accounts persist)
- Email verification: Skip for workshop (simpler onboarding)
- Payment: Not needed (host pays API costs)

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] User authentication system (register/login/logout)
- [ ] User profile storage in Netlify Blobs
- [ ] Protected routes middleware
- [ ] User dashboard shell

**Files to Create/Modify**:
- `netlify/functions/auth.js` (new)
- `src/lib/stores/user.js` (new)
- `src/lib/stores/auth.js` (modify)
- `src/routes/login/+page.svelte` (new)
- `src/routes/register/+page.svelte` (new)
- `src/routes/dashboard/+page.svelte` (new)

### Phase 2: Helper Ownership (Week 1)
- [ ] Helper ownership model (ownerId field)
- [ ] User-scoped helper storage
- [ ] "My Helpers" page
- [ ] Create helper endpoint (basic)

**Files to Create/Modify**:
- `netlify/functions/helpers.js` (new)
- `src/lib/stores/helpers.js` (new)
- `src/routes/my-helpers/+page.svelte` (new)

### Phase 3: Helper Assistant (Week 2)
- [ ] Helper Assistant meta-helper prompt
- [ ] Creation session management
- [ ] `/create-helper` route with chat interface
- [ ] Live preview of helper config during creation
- [ ] Draft saving mechanism

**Files to Create/Modify**:
- `netlify/functions/helper-assistant.js` (new)
- `src/routes/create-helper/+page.svelte` (new)
- Helper Assistant system prompt configuration

### Phase 4: Testing & Refinement (Week 2)
- [ ] Embedded test interface in creation flow
- [ ] Toggle between "Edit" and "Test" modes
- [ ] Real-time prompt editing
- [ ] Helper Assistant refinement guidance

**Files to Create/Modify**:
- `src/routes/create-helper/+page.svelte` (enhance)
- `src/lib/components/HelperEditor.svelte` (new)

### Phase 5: Publishing & Sharing (Week 3)
- [ ] Publish helper endpoint
- [ ] Unique shareable link generation
- [ ] Public helper route `/helper/{helperId}`
- [ ] Public gallery on homepage
- [ ] Helper analytics (basic)

**Files to Create/Modify**:
- `netlify/functions/helpers.js` (add publish/unpublish)
- `src/routes/helper/[helperId]/+page.svelte` (new)
- `src/routes/+page.svelte` (add public gallery)

### Phase 6: Polish & Testing (Week 3)
- [ ] Error handling and validation
- [ ] Loading states and UX polish
- [ ] Cost tracking per helper/user
- [ ] Workshop testing with 10 users
- [ ] Performance optimization
- [ ] Documentation updates

---

## Migration Strategy

### Existing Admin Tools

**Option 1**: Keep admin tools separate
- Admin continues using `/admin` routes
- Admin can manage all helpers (super admin)
- Users create helpers via `/create-helper`

**Option 2**: Migrate admin tools to first user
- Convert admin email to first user account
- Admin helpers become user-owned
- Admin panel becomes user dashboard

**Recommendation**: Option 1 (safer, less disruption)

### Data Migration

1. Export existing tools from `obt-helper-tools` blob
2. Create admin user account (if Option 1) or migrate to user (if Option 2)
3. Import tools as admin-owned helpers
4. Mark as public if desired
5. Test public gallery

---

## Risk Mitigation

### Cost Overruns
- **Risk**: 50 users creating helpers simultaneously could spike API costs
- **Mitigation**: 
  - Use GPT-4o-mini for Helper Assistant (lower cost)
  - Implement rate limiting per user (e.g., 20 requests/min)
  - Monitor costs in real-time dashboard
  - Set daily cost ceiling per user if needed

### Storage Conflicts
- **Risk**: Race conditions when multiple users create helpers simultaneously
- **Mitigation**:
  - Use unique IDs (UUIDs) for helpers
  - Use user-scoped namespaces (prevents ID conflicts)
  - Netlify Blobs has strong consistency

### User Experience Issues
- **Risk**: Helper Assistant might be confusing for non-technical users
- **Mitigation**:
  - Provide example conversations
  - Start with simple guided questions
  - Allow skipping advanced options
  - Offer templates/examples users can customize

### Performance Under Load
- **Risk**: 50 concurrent users might slow down API responses
- **Mitigation**:
  - Edge functions auto-scale
  - Use streaming responses for chat (already implemented)
  - Cache public helper list
  - Monitor function execution times

---

## Success Metrics

### Workshop Day Metrics
- ? 50 user accounts created
- ? 40+ helpers created (80% creation rate)
- ? 35+ helpers published (88% publish rate)
- ? Average helper creation time: <15 minutes
- ? API cost per user: <$0.50 per workshop
- ? Zero critical bugs during workshop

### Technical Metrics
- ? Login success rate: >95%
- ? Helper creation completion rate: >80%
- ? Average API response time: <2 seconds
- ? Function timeout rate: <1%
- ? Storage operation success rate: >99%

---

## Open Questions

1. **Helper Templates**: Should we provide starter templates for common use cases?
   - **Recommendation**: Yes, offer 5-10 templates (e.g., "Social Media Helper", "Email Assistant", "Math Tutor")

2. **Helper Discovery**: How should users discover other users' helpers?
   - **Recommendation**: Public gallery on homepage, search/filter by category

3. **Helper Moderation**: Do we need content moderation for user-created helpers?
   - **Recommendation**: For workshop, rely on good faith. Add flag/report mechanism if needed.

4. **Workshop Analytics**: What metrics should workshop organizers see?
   - **Recommendation**: Total users, helpers created, API costs, most popular helpers

5. **Post-Workshop**: Should accounts persist or be archived?
   - **Recommendation**: Persist accounts (users can continue using helpers)

---

## Next Steps

1. **Review and Approve Plan** - Stakeholder review of this document
2. **Phase 1 Implementation** - Start with authentication foundation
3. **Weekly Check-ins** - Track progress against phases
4. **Workshop Testing** - Dry run with 5-10 users before main event
5. **Documentation** - Update user-facing docs for workshop flow

---

## Appendix: Helper Assistant Example Conversation

**Helper Assistant**: "Hi! I'm here to help you create your own AI helper. What problem would you like your helper to solve?"

**User**: "I want something that helps me write better emails at work."

**Helper Assistant**: "Great! Let me understand your needs better. What kinds of emails do you struggle with most?"

**User**: "Formal emails to clients and follow-ups mostly."

**Helper Assistant**: "Perfect. Who's your target audience - just you, or would others benefit from this helper too?"

**User**: "Mainly me, but I'd share it with my team if it's good."

**Helper Assistant**: "Got it. Let me suggest a name: 'Professional Email Assistant'. Does that work, or would you prefer something else?"

**User**: "That's good."

**Helper Assistant**: "Now let me draft the system prompt. Here's what I'm thinking: 'You are a professional email assistant...' [continues drafting]"

**User**: "Can you make it more concise?"

**Helper Assistant**: "Absolutely. Here's a revised version: [updates prompt]"

**User**: "Let me test this."

**Helper Assistant**: "Great! I've enabled test mode. Try asking it to draft a client email."

[User tests helper, then returns to edit]

**User**: "It's too formal. Can we make it more friendly?"

**Helper Assistant**: "I'll adjust the tone. Here's the updated prompt: [revises]"

**User**: "Perfect. Let's publish it."

**Helper Assistant**: "Done! Your helper is published. Here's your shareable link: https://app.com/helper/professional-email-abc123. Share it with anyone!"

---

_This plan assumes a 3-week timeline. Adjust phases based on available development time._