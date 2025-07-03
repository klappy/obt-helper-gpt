# AI Agent Instructions

**Scope**: Mandatory reading for all AI agents working on this codebase  
**Audience**: AI agents, LLMs, automated systems  
**Last Updated**: Version 1.0.0-beta.1  
**Status**: CURRENT - MUST READ BEFORE ANY CODE CHANGES

> 🤖 **MANDATORY FOR AI AGENTS**: Read this entire document before making any suggestions or code changes. Failure to follow these instructions may result in recommending already-failed approaches.

## Critical First Steps

### 1. ALWAYS Check the Archive First

Before suggesting ANY architectural changes, storage solutions, or implementation patterns:

**REQUIRED READING**: [docs/ARCHIVE.md](./ARCHIVE.md)

This file contains **12+ documented failed approaches** that have already been tried and abandoned. Common failures include:

- localStorage-only persistence (failed - no cross-user state)
- Multiple storage backend options (failed - too complex)
- Manual version updates (failed - inconsistent)
- Tightly coupled components (failed - hard to test)

**Rule**: If your suggestion appears in the archive, DO NOT recommend it.

### 2. Read Current Implementation Docs

**Required reading order**:

1. [docs/README.md](./README.md) - Documentation structure and philosophy
2. [docs/ARCHITECTURE.md](./ARCHITECTURE.md) - Current system design
3. [docs/API.md](./API.md) - Current API endpoints and data structures
4. [docs/DEVELOPMENT.md](./DEVELOPMENT.md) - Current development workflow

### 3. Understand Current-Only Documentation Policy

**Critical concept**: This project uses **aggressive archival** of outdated information.

- **Active docs contain ONLY current, working approaches**
- **No deprecated sections** - everything outdated is archived
- **No version comparisons** - only document what works now
- **Single source of truth** per topic

## Working with This Codebase

### Current Technology Stack (Do NOT suggest alternatives)

- **Frontend**: SvelteKit with TypeScript (working well)
- **Styling**: Tailwind CSS (working well)
- **AI**: OpenAI GPT-4o and GPT-4o-mini (working well)
- **Hosting**: Netlify with serverless functions (working well)
- **Storage**: Netlify Blobs with local file fallback (working well)
- **Voice**: Web Speech API (Chrome/Edge limitation accepted)

### Current Architecture Patterns (Do NOT suggest changes)

- **Serverless functions** for backend logic
- **Component separation** between voice and chat
- **Admin panel** for tool configuration
- **Fallback chain storage** (Netlify Blobs → local files → in-memory → defaults)
- **Automated version management** with script

### Known Limitations (Do NOT try to "fix")

- **Voice features**: Chrome/Edge only (Web Speech API limitation - accepted)
- **Netlify Blobs**: BlobsConsistencyError in local dev (expected, fallback works)
- **Admin authentication**: Simple password (sufficient for current needs)

## What You CAN Help With

### ✅ Acceptable Suggestions

- **Bug fixes** in current implementation
- **Performance optimizations** without architectural changes
- **New AI tools** following existing patterns
- **UI/UX improvements** within current framework
- **Documentation updates** following current standards
- **Testing improvements** for existing features

### ❌ Do NOT Suggest

- **Alternative storage solutions** (already tried, archived)
- **Different frontend frameworks** (SvelteKit works fine)
- **Complex authentication systems** (current system is sufficient)
- **Multiple implementation options** (violates single-source-of-truth)
- **Deprecated approaches** from the archive
- **Breaking changes** without compelling business reason

## Code Change Protocol

### Before Making ANY Suggestions

1. **Check [docs/ARCHIVE.md](./ARCHIVE.md)** - Is this approach already failed?
2. **Review current docs** - Is there already a working solution?
3. **Understand the context** - Why was the current approach chosen?
4. **Consider maintenance burden** - Will this make the codebase more complex?

### When Suggesting Changes

```markdown
## Proposed Change: [Brief Description]

**Problem**: [What specific issue does this solve?]
**Current Approach**: [What does the codebase do now?]
**Archive Check**: [Confirmed this approach is not in ARCHIVE.md]
**Documentation Impact**: [What docs need updating?]
**Testing Plan**: [How will this be verified?]
```

### When Updating Documentation

1. **Update current docs** to reflect new reality
2. **Archive old approaches** if replacing existing functionality
3. **Update cross-references** to maintain link integrity
4. **Test all code examples** to ensure they work
5. **Follow current-only standards** (no deprecated sections)

## Common Mistakes to Avoid

### ❌ "Why don't you use [X] instead?"

If X is in the archive, it was already tried and failed. Read the archive first.

### ❌ "Here are 3 different ways to do this"

This violates the single-source-of-truth principle. Pick the best current approach.

### ❌ "This is deprecated but still works"

Archive it immediately. No deprecated content in active docs.

### ❌ "In previous versions..."

Current-only documentation. No historical comparisons.

### ❌ "You could also..."

One authoritative approach per topic. No alternatives unless absolutely necessary.

## Emergency Procedures

### If You Discover Outdated Documentation

1. **Stop immediately** - don't use outdated info
2. **Check [docs/ARCHIVE.md](./ARCHIVE.md)** for correct current approach
3. **Report the issue** - outdated docs are bugs
4. **Help fix it** by updating to current implementation

### If Current Docs Conflict with Code

1. **Assume code is correct** (docs may lag behind)
2. **Check git history** for recent changes
3. **Update docs** to match current implementation
4. **Archive old approaches** if necessary

### If Archive Doesn't Explain Why Something Failed

1. **Don't repeat the approach** - there was a reason
2. **Ask for clarification** before proceeding
3. **Document the reason** when you learn it
4. **Update archive** with better explanation

## Success Metrics

### You're Doing It Right If:

- ✅ You checked the archive before suggesting changes
- ✅ Your suggestions work with current architecture
- ✅ You update docs to reflect changes
- ✅ You archive outdated approaches
- ✅ You maintain single-source-of-truth

### You're Doing It Wrong If:

- ❌ You suggest approaches from the archive
- ❌ You create conflicting documentation
- ❌ You leave deprecated content in active docs
- ❌ You suggest multiple ways to do the same thing
- ❌ You ignore existing working solutions

## Integration with Development Workflow

### For Code Reviews

- **Verify archive compliance** - no archived approaches used
- **Check documentation updates** - current docs reflect changes
- **Validate examples** - all code snippets work
- **Maintain consistency** - follows established patterns

### For Feature Development

- **Start with current docs** - understand existing patterns
- **Follow established conventions** - don't reinvent
- **Update docs immediately** - don't let them lag
- **Archive replaced approaches** - maintain clean state

## Contact and Escalation

### When in Doubt

1. **Read the archive** - probably already tried
2. **Check current docs** - probably already solved
3. **Follow established patterns** - consistency is key
4. **Ask specific questions** - not general "how should I..."

### Red Flags That Require Human Review

- Suggesting major architectural changes
- Recommending approaches from archive
- Creating conflicting documentation
- Ignoring established patterns
- Proposing breaking changes

---

**Remember**: This codebase has been through multiple iterations. The current implementation exists because previous approaches failed. Trust the process, read the archive, follow current patterns.

_Last updated with each version release - always current_
