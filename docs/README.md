# OBT Helper GPT Documentation

This directory contains all project documentation organized for both AI agents and human developers.

## Documentation Philosophy

Our documentation follows a **current-state-only approach**:

- **Current Implementation Only**: Document what exists and works now
- **Aggressive Archival**: Outdated information moved to consolidated archive immediately
- **Failure Prevention**: Archive failed approaches to prevent repetition
- **Context Efficiency**: Minimize outdated information in active documentation
- **Single Source of Truth**: One authoritative document per topic

## 🤖 FOR AI AGENTS: READ FIRST

- **[AGENTS.md](./AGENTS.md)** - 🚨 MANDATORY reading for all AI agents before making any code changes

## Documentation Structure

### Core Documentation

- **[VERSIONING.md](./VERSIONING.md)** - Complete guide to version management and release process
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and system design
- **[API.md](./API.md)** - API endpoints and data structures

### Development Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Local development setup and workflows
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[TESTING.md](./TESTING.md)** - Testing strategies and procedures

### Project Management

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Original project specifications and requirements
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes (auto-generated)
- **[RELEASE_NOTES.md](./RELEASE_NOTES.md)** - User-facing release information

### Reference Documentation

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md)** - How we write docs for AI and humans
- **[ARCHIVE.md](./ARCHIVE.md)** - ⚠️ Failed approaches and outdated implementations (DO NOT USE)

## Documentation Standards

### For AI Agents

- Start each document with scope and purpose
- Use consistent heading hierarchy (H1 → H2 → H3)
- Include code examples with file paths
- Keep sections under 500 words when possible
- Use bullet points for scannable information

### For Human Developers

- Include practical examples and use cases
- Explain the "why" not just the "what"
- Cross-reference related documents
- Maintain up-to-date links and references
- Use clear, jargon-free language

## Quick Navigation

**🤖 Are you an AI agent?** → **START HERE**: [AGENTS.md](./AGENTS.md) - MANDATORY reading  
**Need to understand the codebase?** → Start with [ARCHITECTURE.md](./ARCHITECTURE.md)  
**Setting up development?** → Go to [DEVELOPMENT.md](./DEVELOPMENT.md)  
**Making a release?** → Follow [VERSIONING.md](./VERSIONING.md)  
**Something broken?** → Try [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)  
**Wondering why something was changed?** → Check [ARCHIVE.md](./ARCHIVE.md) for failed approaches

---

_Last updated: Version 1.0.0-beta.1_
