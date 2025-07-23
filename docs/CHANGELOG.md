# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-07-23

### Added

- **Secure Email-Based Authentication**: Replace hardcoded "admin123" password with environment-based authentication
- **Email Whitelist System**: Only specified emails can access admin panel (VITE_ALLOWED_ADMIN_EMAILS)
- **Tool Persistence Fix**: Fixed tools not saving properly in local development
- **Session Management**: Proper session persistence across page refreshes
- **Admin Email Display**: Show logged-in admin email in navigation header
- **Sync Verification Endpoint**: New `/verify-sync` function to check tool synchronization status
- **Comprehensive Testing**: Scripts for testing WhatsApp-tool synchronization
- **Documentation Updates**: Email auth setup guide, Google SSO migration plan, troubleshooting updates

### Changed

- Admin login now requires both email and password (breaking change)
- Fixed `isLocalDevelopment()` detection for proper local tool storage
- Improved error messages in admin login form
- Updated authentication store with email validation

### Security

- Environment-based password storage (VITE_ADMIN_PASSWORD)
- Email whitelist authorization (VITE_ALLOWED_ADMIN_EMAILS)
- Removed hardcoded credentials
- Secure session token management

### Fixed

- Tool edits now persist correctly in development environment
- WhatsApp integration properly accesses updated tools
- Storage backend detection for local vs production
- Admin authentication flow

### Documentation

- Added EMAIL_AUTH_SETUP.md for quick setup guide
- Added GOOGLE_SSO_IMPLEMENTATION_PLAN.md for future OAuth migration
- Updated TROUBLESHOOTING.md with persistence issues
- Added testing and verification scripts

## [1.0.0-beta.1] - 2025-01-02

### Added

- Complete SvelteKit application with modern UI
- 6 AI tools with custom system prompts:
  - Creative Writing Assistant (GPT-4o-mini)
  - Math Tutor (GPT-4o-mini)
  - Recipe Helper (GPT-4o-mini)
  - Code Helper (GPT-4o)
  - Language Learning Buddy (GPT-4o-mini)
  - Business Strategy Advisor (GPT-4o)
- Real-time streaming chat interface with OpenAI integration
- Voice input/output capabilities using Web Speech API
- Speech-to-text transcription with auto-send after pause
- Text-to-speech for AI responses
- Complete admin panel with authentication (password: admin123)
- Live system prompt editing with real-time preview
- Tool management (CRUD operations)
- Dual persistence system:
  - Local file storage for development (.netlify/blobs-local/)
  - Netlify Blobs for production deployment
- Mobile-responsive design with Tailwind CSS
- Loading states and error handling
- Backup/restore functionality for tool configurations

### Technical Details

- SvelteKit framework with TypeScript support
- Netlify Functions for serverless backend
- OpenAI API integration with streaming responses
- Web Speech API for voice features
- Local development with Netlify CLI
- File-based persistence that survives function reloads

### Known Issues

- Voice features require Chrome/Edge (Web Speech API limitation)
- Some TypeScript linting warnings in voice components
- Netlify Blobs requires production environment for full functionality

## [0.1.0] - 2025-01-02

### Added

- Initial project setup
- Basic SvelteKit configuration
- Tailwind CSS integration
- Project planning and architecture documentation

---

## Version Numbering

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backwards compatible manner
- **PATCH** version when you make backwards compatible bug fixes
- **Pre-release** identifiers (alpha, beta, rc) for testing versions

### Current Status

- **1.0.0-beta.1**: Feature-complete beta ready for testing
- **Target 1.0.0**: Production-ready release after browser testing and deployment
