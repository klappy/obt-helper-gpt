# Documentation Standards

**Scope**: Guidelines for maintaining current documentation and archiving outdated approaches  
**Audience**: Contributors, maintainers, AI agents  
**Last Updated**: Version 1.0.0-beta.1

## Philosophy

Our documentation follows a **current-state-only design** that maintains accuracy by aggressively archiving outdated information. This prevents confusion, reduces context pollution, and prevents oscillation between failed approaches.

### Core Principles

1. **Current Implementation Only**: Document what exists and works now
2. **Aggressive Archival**: Move outdated docs to consolidated archive immediately
3. **Failure Prevention**: Summarize failed approaches to prevent repetition
4. **Context Efficiency**: Minimize outdated information in active documentation
5. **Single Source of Truth**: One authoritative document per topic

## Documentation Lifecycle

### Active Documentation

- **Purpose**: Document current, working implementation
- **Scope**: Latest version features and APIs only
- **Maintenance**: Updated immediately when code changes
- **Content**: Current patterns, working examples, active procedures

### Archive Documentation

- **Purpose**: Prevent repetition of failed approaches
- **Scope**: Brief summaries of what didn't work and why
- **Location**: `docs/ARCHIVE.md` - single consolidated file
- **Content**: Concise failure descriptions, dates, reasons for abandonment

## Archive System

### When to Archive

Immediately archive documentation when:

- **Implementation replaced**: New approach supersedes old one
- **Feature removed**: Functionality no longer exists
- **Pattern abandoned**: Design pattern proved problematic
- **API changed**: Breaking changes make docs invalid
- **Tool deprecated**: Third-party dependency replaced

### Archive Entry Format

```markdown
### [YYYY-MM-DD] Brief Description of Approach

**Replaced by**: Current implementation reference
**Why abandoned**: Concise reason (1-2 sentences)
**Key lesson**: What to avoid in future

---
```

### Archive Categories

- **Failed Architectures**: System designs that didn't work
- **Abandoned Features**: Functionality that was removed
- **Deprecated APIs**: Old endpoints or data structures
- **Failed Integrations**: Third-party tools that didn't work
- **Problematic Patterns**: Code patterns that caused issues

## Current Documentation Standards

### Document Structure Requirements

Every active document must:

```markdown
# Document Title

**Scope**: What this covers in current implementation
**Audience**: Who needs this information  
**Last Updated**: Version when last modified
**Status**: CURRENT (always explicitly stated)
```

### Content Rules

- **No version comparisons**: Don't document "old vs new"
- **No deprecated sections**: Archive instead of marking deprecated
- **Current examples only**: All code examples must work with latest version
- **Active links only**: All references must point to current resources
- **Present tense**: Write as if describing current state

### Prohibited Content

❌ **Don't include**:

- "Previously we used..."
- "In older versions..."
- "Deprecated but still supported..."
- "Legacy approach..."
- Multiple implementation options for same feature

✅ **Do include**:

- Current implementation only
- Working examples
- Active procedures
- Present-state descriptions

## Archive Management

### Creating Archive Entries

When archiving documentation:

1. **Extract key information** about what failed and why
2. **Create concise summary** (50-100 words maximum)
3. **Add to `docs/ARCHIVE.md`** with date and reason
4. **Remove all references** from active documentation
5. **Update cross-references** to point to current alternatives

### Archive Entry Template

```markdown
### [2025-01-15] localStorage-based Persistence

**Replaced by**: Netlify Blobs with file fallback (see API.md)
**Why abandoned**: Only worked locally, no cross-user persistence
**Key lesson**: Need server-side storage for shared state

### [2025-01-15] Multiple Storage Backend Options

**Replaced by**: Single fallback chain approach (see DEVELOPMENT.md)
**Why abandoned**: Too complex, hard to debug, inconsistent behavior
**Key lesson**: Prefer simple fallback chains over multiple parallel options

---
```

### Archive Maintenance

- **Quarterly review**: Check if archived items can be permanently deleted
- **Size limit**: Keep archive under 2000 words total
- **Consolidation**: Merge similar failures into single entries
- **Relevance check**: Remove entries older than 2 years unless still relevant

## Implementation Guidelines

### For New Features

1. **Document current state only** - no comparison to previous approaches
2. **Remove conflicting docs** - archive anything that contradicts new implementation
3. **Update all cross-references** - ensure links point to current docs
4. **Test all examples** - verify code snippets work with current version

### For Breaking Changes

1. **Archive old documentation** completely before updating
2. **Rewrite from scratch** using current implementation
3. **No migration guides** - document current state only
4. **Update dependent docs** - ensure consistency across all files

### For Deprecations

1. **Immediate archival** - don't wait for removal
2. **Update all references** - point to current alternatives
3. **Remove from navigation** - don't link to deprecated approaches
4. **Archive with context** - explain why approach failed

## Quality Assurance

### Documentation Review Checklist

- [ ] **Current only**: No outdated information present
- [ ] **Working examples**: All code snippets tested with latest version
- [ ] **Active links**: All references point to current resources
- [ ] **Consistent terminology**: Uses current naming conventions
- [ ] **Archive compliance**: Outdated info moved to archive
- [ ] **Single approach**: Only one way documented per task

### Automated Checks

```bash
# Verify no outdated terminology
npm run docs:check-outdated

# Test all code examples
npm run docs:test-examples

# Validate all links
npm run docs:check-links

# Check for archive violations
npm run docs:check-archive-compliance
```

## AI Agent Guidelines

### When Reading Documentation

- **Trust current docs completely** - no need to verify against old versions
- **Ignore archive unless debugging** - focus on current implementation
- **Report inconsistencies immediately** - help maintain single source of truth
- **Use latest examples** - all code should work with current version

### When Contributing

- **Archive first, then update** - never leave outdated info in active docs
- **Document current state only** - no historical context needed
- **Test all examples** - ensure code works with latest implementation
- **Update cross-references** - maintain link integrity

## Benefits of This Approach

### For AI Agents

- **Reduced context pollution**: No conflicting information
- **Clear guidance**: Single authoritative approach per topic
- **Faster processing**: Less irrelevant information to parse
- **Consistent patterns**: No oscillation between old and new approaches

### For Human Developers

- **Clearer documentation**: No confusion about which approach to use
- **Faster onboarding**: Learn current patterns only
- **Better maintenance**: Easier to keep docs accurate
- **Reduced cognitive load**: Less information to process

### For Project Health

- **Prevents regression**: Archive shows what not to do
- **Maintains quality**: Forces regular doc cleanup
- **Improves accuracy**: Current-only docs stay more accurate
- **Reduces maintenance**: Less total documentation to maintain

## Migration from Current State

### Phase 1: Create Archive

1. Review all existing documentation
2. Identify outdated sections and approaches
3. Create initial `docs/ARCHIVE.md` with current failures
4. Remove outdated content from active docs

### Phase 2: Establish Process

1. Update all active docs to current-only format
2. Implement archive workflow for future changes
3. Train contributors on new standards
4. Set up automated checks

### Phase 3: Maintain Standards

1. Regular archive reviews
2. Aggressive pruning of outdated information
3. Continuous improvement of current docs
4. Monitor for compliance violations

---

_This document practices what it preaches - it describes only the current documentation approach_
