# Test Suite Documentation

## Overview

This test suite validates the workshop features including multi-user authentication, helper creation, conversation history, and public gallery.

## Test Files

### `integration.test.ts`
Original integration tests for basic app functionality (homepage, chat interface, admin panel).

### `workshop-features.test.ts`
Comprehensive tests for all new workshop features:
- User authentication (register/login)
- Helper creation with Helper Assistant
- Dashboard and helper management
- Helper editor
- Public gallery
- Chat with conversation saving
- Conversation history UI
- API endpoint validation
- Error handling

### `workshop-e2e-flow.test.ts`
End-to-end user flow tests:
- Complete user journey from registration to conversation history
- Authentication persistence
- Parallel user scenarios

## Running Tests

### All Tests
```bash
npm run test:all
```

### Workshop Features Only
```bash
npm run test:workshop
```

### Workshop Features (Parallel, Faster)
```bash
npm run test:workshop:parallel
```

### UI Mode (Interactive)
```bash
npm run test:integration:ui
```

### Headed Mode (See Browser)
```bash
npm run test:integration:headed
```

## Test Configuration

- **Parallel Execution**: Tests run in parallel by default (4 workers locally, 2 on CI)
- **Retries**: 2 retries on CI, 0 locally
- **Timeout**: 120 seconds for server to start
- **Base URL**: `http://localhost:8888`
- **Screenshots**: On failure only
- **Video**: On failure only
- **Trace**: On retry only

## Test Coverage

### User Authentication
- ? User registration
- ? User login
- ? Invalid login handling
- ? Protected route redirects
- ? Session persistence

### Helper Management
- ? Helper creation with Helper Assistant
- ? Helper editing
- ? Publishing/unpublishing
- ? Helper listing in dashboard

### Conversation Management
- ? Conversation history UI
- ? Conversation saving during chat
- ? Empty state handling

### Public Gallery
- ? Published helpers listing
- ? Search functionality
- ? Share link access

### API Endpoints
- ? User registration/login APIs
- ? Helper management APIs
- ? Public helpers API
- ? Error handling

### Parallel Execution
- ? Multiple simultaneous users
- ? Concurrent operations

## Notes

- Tests generate unique emails for each run to avoid conflicts
- Tests clean up after themselves (closing browser contexts)
- API tests validate both success and error scenarios
- E2E tests verify complete user journeys

## Troubleshooting

If tests fail:
1. Ensure `netlify dev` is running (tests start it automatically)
2. Check that port 8888 is available
3. Verify environment variables are set correctly
4. Check test output for specific error messages
