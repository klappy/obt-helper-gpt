# Development Guide

**Scope**: Local development setup, workflows, and best practices  
**Audience**: Developers, contributors  
**Last Updated**: Version 1.0.0-beta.1

## Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- Git

### Setup

```bash
# Clone repository
git clone <repository-url>
cd obt-helper-gpt

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your OpenAI API key to .env

# Start development server
npm run dev
```

### Development URLs

- **Frontend**: http://localhost:5173
- **Netlify Functions**: http://localhost:8888/.netlify/functions/
- **Admin Panel**: http://localhost:5173/admin

## Project Structure

```
obt-helper-gpt/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte components
│   │   ├── stores/         # Application state
│   │   └── utils/          # Helper functions
│   └── routes/             # SvelteKit pages
├── netlify/functions/      # Serverless functions
├── docs/                   # Documentation
├── scripts/                # Build and utility scripts
└── static/                 # Static assets
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-ai-tool

# Make changes
npm run dev  # Start dev server

# Test changes
npm run test
npm run lint

# Commit changes
git add .
git commit -m "feat: add new AI tool"
```

### 2. Local Testing

- **Unit Tests**: `npm run test`
- **E2E Tests**: `npm run test:e2e`
- **Linting**: `npm run lint`
- **Type Checking**: `npm run check`

### 3. Version Management

```bash
# For bug fixes
npm run version:patch

# For new features
npm run version:minor

# For breaking changes
npm run version:major
```

## Environment Configuration

### Required Environment Variables

```bash
# .env file
OPENAI_API_KEY=sk-proj-...
VITE_APP_VERSION=1.0.0-beta.1
```

### Development vs Production

- **Local**: Uses file-based storage (`.netlify/blobs-local/`)
- **Production**: Uses Netlify Blobs storage

## Data Persistence

### Local Development Storage

```
.netlify/blobs-local/tools-data.json
```

### Storage Fallback Chain

1. **Production**: Netlify Blobs
2. **Development**: Local file storage
3. **Fallback**: In-memory storage
4. **Last Resort**: Default tools configuration

## Available Scripts

### Core Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing Commands

```bash
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run check        # Type check with TypeScript
npm run format       # Format code with Prettier
```

### Version Management

```bash
npm run version:patch   # Bug fix release
npm run version:minor   # Feature release
npm run version:major   # Breaking change release
npm run version:beta    # Pre-release version
```

## Component Development

### Creating New Components

```javascript
// src/lib/components/NewComponent.svelte
<script>
  export let prop1;
  export let prop2 = 'default';
</script>

<div class="component-wrapper">
  <!-- Component content -->
</div>

<style>
  .component-wrapper {
    /* Component styles */
  }
</style>
```

### Component Testing

```javascript
// src/lib/components/NewComponent.test.js
import { render } from "@testing-library/svelte";
import NewComponent from "./NewComponent.svelte";

test("renders correctly", () => {
  const { getByText } = render(NewComponent, {
    props: { prop1: "test" },
  });

  expect(getByText("test")).toBeInTheDocument();
});
```

## AI Tool Development

### Adding New AI Tools

1. **Update Default Tools**: `netlify/functions/tools.js`
2. **Create Tool Icon**: Add to `static/` directory
3. **Test System Prompt**: Use admin panel preview
4. **Update Documentation**: Add to relevant docs

### Tool Configuration Schema

```javascript
{
  id: 'unique-tool-id',
  name: 'Tool Display Name',
  description: 'Brief description',
  icon: '/icon-name.svg',
  model: 'gpt-4o-mini', // or 'gpt-4o'
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: 'AI behavior instructions...',
  active: true
}
```

## Common Development Tasks

### Adding a New Route

```javascript
// src/routes/new-page/+page.svelte
<script>
  // Page logic
</script>

<h1>New Page</h1>
```

### Updating Stores

```javascript
// src/lib/stores/newStore.js
import { writable } from "svelte/store";

export const newStore = writable(initialValue);
```

### Adding Netlify Functions

```javascript
// netlify/functions/new-function.js
export default async (request, context) => {
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
```

## Debugging

### Common Issues

**CSS not loading**

- Check PostCSS configuration
- Verify Tailwind import in `app.css`

**Functions not working locally**

- Ensure Netlify CLI is running (`netlify dev`)
- Check function syntax and exports

**Voice features not working**

- Test in Chrome/Edge (Web Speech API limitation)
- Check microphone permissions

### Debug Tools

- **Svelte DevTools**: Browser extension for component inspection
- **Network Tab**: Monitor API calls and function responses
- **Console Logs**: Check for JavaScript errors

## Performance Considerations

### Bundle Size

- Monitor with `npm run build`
- Use dynamic imports for large dependencies
- Optimize images and assets

### Runtime Performance

- Minimize reactive statements
- Use component-level stores
- Implement proper loading states

## Contributing Guidelines

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Write meaningful commit messages

### Pull Request Process

1. Create feature branch
2. Make changes with tests
3. Update documentation
4. Submit PR with description
5. Address review feedback

---

_For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)_
