# Workshop Scaling Plan

**Scope**: Architecture changes to support 50 concurrent users creating their own helpers  
**Purpose**: Enable workshop participants to create, test, and publish their own GPTs  
**Status**: Planning Phase  
**Last Updated**: 2025-01-15

## The Big Picture

**Current System**: Single admin, global tools list, simple email whitelist auth  
**Workshop Needs**: 50 users, each creating their own helpers, with a Helper Assistant to guide creation

## What Needs to Happen

1. **User accounts** ? Add email/password registration (workshop context, skip email verification)
2. **Helper ownership** ? Store helpers in user namespaces using RESTful conventions
3. **Helper Assistant** ? A meta-helper that guides users through creating their helper
4. **Publishing and sharing** ? Generate unique links for published helpers
5. **Public gallery** ? Show published helpers on homepage for browsing and testing

## Architecture Changes

### Storage Architecture

**Current**: Global `tools-data.json` blob with flat array of tools  
**New**: User-scoped storage with RESTful naming convention:

```
users/{userId}/helpers/{helperId}.json
```

**Storage Path Examples**:
- `users/abc123/helpers/creative-writing.json`
- `users/abc123/helpers/email-assistant.json`
- `users/def456/helpers/my-custom-helper.json`

### Authentication

**Current**: Email whitelist only  
**New**: Email/password registration with fallback recovery

**Backup Plan for Forgotten Emails**:
- **Primary**: Email/password login
- **Workshop Backup**: Admin can provide temporary password reset link (workshop context only)
- **Alternative**: Workshop coordinator maintains a simple lookup table (email ? temp password) for immediate access
- **Post-Workshop**: Can add proper email recovery flow if needed

**Note**: No email verification required for workshop context.

### RESTful API Endpoints

All endpoints follow RESTful conventions with user namespacing:

#### User Management
- `POST /api/users` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user (from session)

#### Helper Management (User-Scoped)
- `GET /api/users/{userId}/helpers` - List all helpers for a user
- `POST /api/users/{userId}/helpers` - Create new helper
- `GET /api/users/{userId}/helpers/{helperId}` - Get specific helper
- `PUT /api/users/{userId}/helpers/{helperId}` - Update helper
- `DELETE /api/users/{userId}/helpers/{helperId}` - Delete helper
- `POST /api/users/{userId}/helpers/{helperId}/publish` - Publish helper (makes it public)
- `POST /api/users/{userId}/helpers/{helperId}/unpublish` - Unpublish helper

#### Public Helpers
- `GET /api/helpers` - List all published helpers (public gallery)
- `GET /api/helpers/{helperId}` - Get published helper by ID (for shared links)

#### Helper Assistant
- `POST /api/users/{userId}/helpers/{helperId}/assistant` - Chat with Helper Assistant during creation

#### Chat (Existing Pattern, Updated)
- `POST /api/chat` - Chat with a helper (works with both user helpers and published helpers)

### Frontend Routes

- `/create-helper` - Helper creation flow with Helper Assistant
- `/helpers/my-helpers` - User's dashboard showing their helpers
- `/helpers/{helperId}` - Shared helper link (works for any published helper)
- `/` - Homepage with public gallery of published helpers

## Implementation Plan

### Phase 1: User Authentication (Week 1, Days 1-2)

**What**:
- Add user registration/login endpoints
- Implement session management (Netlify serverless cookies)
- Add auth middleware for protected routes
- Create simple password hash storage (workshop context, no security hardening needed)

**Endpoints**:
- `POST /api/users` - Register
- `POST /api/users/login` - Login
- `GET /api/users/me` - Get current user

**Storage**:
- User accounts: `users/{userId}/profile.json`
- Session: Netlify serverless cookies

**Frontend**:
- Registration page
- Login page
- Update auth store to support user sessions

### Phase 2: RESTful Helper Storage (Week 1, Days 3-5)

**What**:
- Refactor storage to use user-scoped paths
- Update all helper endpoints to RESTful conventions
- Add helper ownership tracking
- Ensure existing admin tools continue working (migration not needed, per feedback)

**Endpoints to Create/Update**:
- `GET /api/users/{userId}/helpers` - List user's helpers
- `POST /api/users/{userId}/helpers` - Create helper
- `GET /api/users/{userId}/helpers/{helperId}` - Get helper
- `PUT /api/users/{userId}/helpers/{helperId}` - Update helper
- `DELETE /api/users/{userId}/helpers/{helperId}` - Delete helper

**Storage Pattern**:
```javascript
// Storage path convention
const storagePath = `users/${userId}/helpers/${helperId}.json`;

// Helper metadata includes ownership
{
  id: "helper-id",
  userId: "user-id",
  name: "Helper Name",
  // ... rest of helper config
}
```

**Backward Compatibility**:
- Existing admin tools continue using global `tools-data.json` blob
- No migration needed (per user feedback)
- Admin can optionally migrate their tools to user accounts if desired

### Phase 3: Helper Assistant (Week 2, Days 1-3)

**What**:
- Create meta-helper that guides users through helper creation
- Conversational flow to gather requirements
- Auto-populate helper configuration as user answers questions
- Allow testing during creation process

**Helper Assistant Flow**:
1. User clicks "Create New Helper"
2. Helper Assistant greets and asks about the idea
3. Gathers: problem statement, target audience, name, description, icon preference
4. Drafts system prompt based on conversation
5. User can test helper while Assistant refines configuration
6. Assistant saves helper configuration progressively

**Endpoint**:
- `POST /api/users/{userId}/helpers/{helperId}/assistant` - Chat with Helper Assistant

**Frontend**:
- `/create-helper` route with integrated chat interface
- Side-by-side view: Assistant chat + Helper preview/test area

### Phase 4: Publishing & Sharing (Week 2, Days 4-5)

**What**:
- Add publish/unpublish functionality
- Generate unique, shareable links
- Make published helpers discoverable

**Endpoints**:
- `POST /api/users/{userId}/helpers/{helperId}/publish` - Publish helper
- `POST /api/users/{userId}/helpers/{helperId}/unpublish` - Unpublish helper
- `GET /api/helpers` - List all published helpers
- `GET /api/helpers/{helperId}` - Get published helper (for shared links)

**Storage**:
- Published helpers metadata: `helpers/published/{helperId}.json` (index)
- Helper data remains in user namespace
- Index includes: helperId, userId, name, description, icon, publishedAt

**Frontend**:
- Publish button in helper editor
- Share link generation (`/helpers/{helperId}`)
- Public gallery on homepage

### Phase 5: Public Gallery (Week 3, Days 1-2)

**What**:
- Homepage shows grid of published helpers
- Users can browse and test published helpers
- No authentication required to view published helpers

**Frontend**:
- Update homepage with published helpers grid
- Filter/search functionality (optional, nice-to-have)
- "Try this helper" links

### Phase 6: Testing & Refinement (Week 3, Days 3-5)

**What**:
- End-to-end testing with multiple users
- Performance testing (50 concurrent users)
- UX refinements based on feedback
- Cost monitoring (ensure API usage stays within budget)

## Technical Details

### Storage Implementation

**Netlify Blobs Structure**:
```
obt-helper-tools/
  users/
    {userId}/
      profile.json
      helpers/
        {helperId}.json
  helpers/
    published/
      {helperId}.json (index entries)
```

**Local Development Fallback**:
```
.netlify/blobs-local/
  users/
    {userId}/
      profile.json
      helpers/
        {helperId}.json
  helpers/
    published/
      {helperId}.json
```

### Session Management

**Approach**: Netlify serverless cookies
- Cookie-based session after login
- Middleware checks session for protected routes
- No JWT needed for workshop context

### Helper Assistant Implementation

**System Prompt** (meta-helper):
```
You are the Helper Assistant, guiding users through creating their own AI helper.

Your goal is to:
1. Understand what problem they want to solve
2. Identify their target audience
3. Help them name and describe their helper
4. Draft an effective system prompt
5. Test and refine the helper together

Ask questions one at a time. Be conversational. Once you have enough info, start drafting the helper configuration. Show it to the user and let them test it while you refine.
```

**Assistant Workflow**:
1. Start conversation: "What problem do you want your helper to solve?"
2. Gather: problem, audience, use cases
3. Suggest name/description based on conversation
4. Draft system prompt, show to user
5. User tests helper, Assistant refines based on feedback
6. Save helper when user is satisfied

### Publishing Flow

**Publish Process**:
1. User clicks "Publish"
2. System validates helper (has name, description, system prompt)
3. Create entry in published index: `helpers/published/{helperId}.json`
4. Generate shareable link: `/helpers/{helperId}`
5. Helper appears in public gallery

**Unpublish Process**:
1. User clicks "Unpublish"
2. Remove from published index
3. Helper still exists in user namespace but not publicly visible

## Scalability Analysis

### 50 Concurrent Users

**Storage**:
- Each user: ~5-10 helpers average = 250-500 helper files
- Storage size: ~50KB per helper = ~25MB total (well within Netlify Blobs limits)
- Read/write operations: Distributed across user namespaces (no contention)

**API Load**:
- Chat requests: 50 users ? 10 requests/min = 500 requests/min (within limits)
- Helper creation: ~50 helpers created in workshop = manageable
- Published helpers: ~50-100 public helpers = fast to list/query

**Performance**:
- User-scoped storage = fast lookups (no scanning entire tool list)
- Published index = efficient public gallery queries
- No global lock on helper list = concurrent creation works smoothly

## Cost Analysis

### API Usage Estimates (50 Users Workshop)

**Helper Creation** (per user):
- Helper Assistant chat: ~20 messages ? 500 tokens avg = 10K tokens
- Testing during creation: ~10 messages ? 500 tokens avg = 5K tokens
- **Total per user**: ~15K tokens ? $0.15/1M (GPT-4o-mini) = $0.002

**Helper Usage** (during workshop):
- Each user tests their helper: ~20 messages ? 500 tokens = 10K tokens
- **Total per user**: ~10K tokens = $0.002

**Total Workshop Cost**:
- 50 users ? ($0.002 + $0.002) = **$0.20** (assuming GPT-4o-mini)
- Using GPT-4o: ~$2.00 (10x cost)

**Recommendation**: Use GPT-4o-mini for Helper Assistant and default helper model to keep costs low. Allow users to upgrade to GPT-4o if they want during creation.

## Risk Mitigation

### Cost Risks

**Risk**: Users create many helpers and test extensively  
**Mitigation**: 
- Set reasonable defaults (GPT-4o-mini)
- Monitor costs during workshop
- Optional: Add simple rate limiting per user

### Performance Risks

**Risk**: 50 users hitting API simultaneously  
**Mitigation**:
- User-scoped storage distributes load
- Netlify Functions auto-scale
- Published index kept small (only published helpers)

### UX Risks

**Risk**: Helper Assistant conversation too complex  
**Mitigation**:
- Keep Assistant conversational and simple
- Progressive disclosure (ask one question at a time)
- Allow users to skip steps and edit directly

**Risk**: Users forget their email/password  
**Mitigation**:
- Workshop coordinator maintains lookup table
- Admin can provide temp password reset
- Simple recovery flow for workshop context

### Storage Risks

**Risk**: Storage paths become complex  
**Mitigation**:
- Use consistent RESTful naming convention
- Clear separation: user helpers vs published index
- Local dev fallback matches production structure

## Migration Strategy

**Per User Feedback**: No migration needed for existing admin tools.

**Existing Admin Tools**:
- Continue using global `tools-data.json` blob
- Admin can optionally create a user account and migrate their tools if desired
- No breaking changes required

**New User Helpers**:
- Store in user namespaces from day one
- No backward compatibility concerns

## Testing Plan

### Unit Tests
- User authentication endpoints
- Helper CRUD operations
- Publishing/unpublishing logic
- Storage path generation

### Integration Tests
- Full user registration ? helper creation ? publish flow
- Helper Assistant conversation flow
- Public gallery display
- Shared helper links

### Load Tests
- 50 concurrent users creating helpers
- 50 concurrent users chatting with helpers
- Public gallery with 100+ published helpers

### UX Tests
- Helper Assistant conversation feels natural
- Helper creation flow is intuitive
- Published helpers are discoverable
- Shared links work correctly

## Next Steps

1. **Review this plan** - Confirm approach aligns with workshop goals
2. **Start Phase 1** - Implement user authentication
3. **Test incrementally** - Each phase should be testable independently
4. **Workshop dry run** - Test with small group before full workshop

## Questions to Resolve

1. **Email recovery**: What's the workshop coordinator's preferred approach for forgotten passwords? (lookup table vs admin reset vs both)
2. **Default model**: Should all helpers default to GPT-4o-mini, or allow user choice during creation?
3. **Helper limits**: Should users have a max number of helpers they can create? (probably not needed for workshop)
4. **Published helpers**: Should there be moderation, or can anyone publish immediately? (workshop context suggests immediate publish is fine)

---

**Status**: Ready for review and feedback
