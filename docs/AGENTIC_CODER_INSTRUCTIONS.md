# Agentic Coder Instructions: Systematic Roadmap Execution

## Mission Brief
You are an autonomous agent tasked with implementing the Self-Hostable AI WhatsApp Bot Manager by systematically completing all epics, phases, and issues defined in the roadmap. Work through each issue sequentially, ship every commit, and validate in production.

## Critical Rules
1. **Read First**: Always start by reading `docs/AGENTS.md` and checking `docs/ARCHIVE.md` for failed approaches
2. **Ship Every Commit**: Each issue must result in a working, deployed state
3. **No Breaking Changes**: Extend existing code, don't rewrite unless specified
4. **Test Everything**: Run tests before committing
5. **Document Changes**: Update relevant docs immediately
6. **One Issue at a Time**: Complete and validate before moving to next

## Environment Setup

### Pre-flight Checklist
```bash
# 1. Verify environment
npm --version  # Should be 8+
node --version # Should be 18+

# 2. Install dependencies
npm install

# 3. Install Netlify CLI if missing
npm install -g netlify-cli

# 4. Verify environment variables
cat .env | grep OPENAI_API_KEY

# 5. Test local development
netlify dev
# Visit http://localhost:8888 to verify app loads
```

## Execution Loop

### For Each Issue:

#### 1. Pick Next Open Issue
```bash
# Check current status
cat docs/issues/phase1.md | grep "☐ Open" | head -1
```

#### 2. Read Issue Details
- Note the ID, files to modify, tests required, validation criteria
- Check if dependencies need installation (e.g., Chart.js, Twilio)

#### 3. Implementation Pattern
```bash
# a. Create feature branch
git checkout -b issue-[ID]-description

# b. Read current implementation
# Use codebase_search or read_file for context

# c. Make minimal changes
# Follow existing patterns, don't reinvent

# d. Test locally
npm run test
npm run test:integration
netlify dev  # Manual testing

# e. Commit with clear message
git add .
git commit -m "feat(issue-[ID]): description of change"
```

#### 4. Deploy & Validate
```bash
# Deploy to production
git push origin main  # Assumes CI/CD configured
# OR
netlify deploy --prod

# Validate per issue criteria
# e.g., curl endpoints, check UI, verify logs
```

#### 5. Update Issue Status
Edit the relevant phase file to mark issue as closed:
```markdown
| 1.1.1 | Add timeout logic | ☑ Closed | ... |
```

#### 6. Version Bump (Per Step Completion)
```bash
# After completing all issues in a step
npm run version:minor  # e.g., 2.1.0 -> 2.2.0

# After completing all steps in a phase
npm run version:major  # e.g., 2.2.0 -> 3.0.0
```

## Phase-Specific Instructions

### Phase 1: Core Refactor (2.0.0)
Priority: Memory and cost tracking foundations

#### Dependencies to Install:
```bash
npm install chart.js  # For analytics viz
```

#### Key Implementation Notes:
- Session timeout: Use `setTimeout` in `whatsapp-session.js`
- Summary generation: Call OpenAI with "Summarize this chat:" prompt
- Natural language recall: Parse for keywords like "recall", "last chat"
- Cost tracking: Calculate tokens using OpenAI's tokenizer estimates

### Phase 2: Advanced Integrations (3.0.0)
Priority: WhatsApp depth and sharing

#### Dependencies to Install:
```bash
npm install twilio  # For WhatsApp messaging
```

#### Key Implementation Notes:
- Intent inference: Lightweight prompt "Which tool best matches: [message]"
- Linking codes: Generate 6-digit codes, store with TTL in Blobs
- Bidirectional sync: Share session IDs between web/WhatsApp
- Export format: Standard JSON with schema validation

### Phase 3: Future-Proofing (4.0.0)
Priority: Modularity and stubs

#### Dependencies to Install:
```bash
npm install workbox-window  # For service workers
```

#### Key Implementation Notes:
- Image/audio stubs: `<input type="file">` with placeholder handlers
- Service worker: Cache chat sessions in IndexedDB
- LLM adapter: Factory pattern with `createLLMClient(provider)`
- Rate limiting: Simple token bucket in memory

## Validation Scripts

### Create Test Scripts
For each phase, create validation scripts:

```javascript
// scripts/validate-phase1.js
async function validatePhase1() {
  // Test memory
  const chatRes = await fetch('/chat/test-session');
  await wait(30 * 60 * 1000); // Wait 30 min
  const summaryExists = await checkBlobs('summary-test-session');
  
  // Test costs
  const statsRes = await fetch('/.netlify/functions/ai-usage-stats');
  const hasUsage = statsRes.ok && (await statsRes.json()).length > 0;
  
  console.log('Phase 1 Validation:', { summaryExists, hasUsage });
}
```

## Error Recovery

### If Tests Fail:
1. Check error logs: `netlify logs:function [function-name]`
2. Rollback if needed: `git revert HEAD`
3. Fix and retry (max 3 attempts per issue)
4. If stuck, document blocker in issue comments

### If Deploy Fails:
1. Check build logs
2. Verify environment variables in Netlify
3. Test locally with `netlify build`
4. Clear cache and retry

## Progress Tracking

### Daily Status Check:
```bash
# Count completed issues
grep -c "☑ Closed" docs/issues/*.md

# Show current version
cat package.json | grep version

# Check deploy status
netlify status
```

### Weekly Report Format:
```markdown
## Week [N] Progress
- Issues Completed: X/25
- Current Version: X.X.X
- Blockers: None / [List]
- Next Week: Issues [IDs]
```

## Success Criteria

### Per Issue:
- Code changes minimal and focused
- Tests pass (unit + integration)
- Deploys successfully
- Validation criteria met in production
- Documentation updated
- Issue marked closed

### Per Phase:
- All issues in phase closed
- Major version bumped
- Phase features work end-to-end
- No regressions in existing features

### Overall:
- All 25 issues closed
- Version 4.2.0+ reached
- PRD requirements fulfilled
- App self-hostable with docs

## Emergency Stop

If you encounter:
- Data loss risks
- Security vulnerabilities
- Architectural conflicts with PRD
- Repeated failures (>3) on same issue

STOP and document the issue clearly before proceeding.

---

## Final Notes

Remember: You're building on a working foundation. The app already has:
- SvelteKit frontend with routes/components
- Netlify functions for backend
- Basic WhatsApp integration
- Admin panel with auth
- Voice features

Your job is to enhance, not rebuild. Follow the roadmap, trust the process, ship incrementally.

_"It's like following a GPS that actually knows where it's going. Just don't take any shortcuts through the swamp."_ - Nate