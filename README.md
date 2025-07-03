# OBT Helper GPT

A modern AI tools platform that hosts specialized AI assistants internally instead of redirecting to ChatGPT. Built with SvelteKit and powered by OpenAI's GPT-4o models.

**Live Demo**: [Coming Soon]  
**Current Version**: 1.0.0-beta.1

> 🤖 **FOR AI AGENTS**: Before making any suggestions, read [docs/AGENTS.md](./docs/AGENTS.md) and [docs/ARCHIVE.md](./docs/ARCHIVE.md) to understand failed approaches that must not be repeated.

## What It Does

OBT Helper GPT provides a curated collection of AI tools, each with specialized system prompts for specific tasks:

- **Creative Writing Assistant** - Help with stories, poems, and creative projects
- **Math Tutor** - Step-by-step math problem solving and explanations
- **Recipe Helper** - Cooking advice, recipe suggestions, and meal planning
- **Code Helper** - Programming assistance and code review
- **Language Learning Buddy** - Practice conversations and grammar help
- **Business Strategy Advisor** - Strategic planning and business insights

### Key Features

- **Real-time Chat**: Streaming responses with character-by-character display
- **Voice Integration**: Speech-to-text input and text-to-speech output (Chrome/Edge)
- **Admin Panel**: Manage AI tools, edit system prompts, and preview changes
- **Responsive Design**: Works on desktop and mobile devices
- **Persistent Storage**: Tool configurations saved across sessions

## Quick Start

### For Users

1. Visit the deployed site (coming soon)
2. Choose an AI tool from the homepage
3. Start chatting with your specialized AI assistant
4. Use the microphone button for voice input (Chrome/Edge only)

### For Developers

```bash
# Clone the repository
git clone [repository-url]
cd obt-helper-gpt

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your OpenAI API key to .env

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app locally.

## Technology Stack

- **Frontend**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o and GPT-4o-mini
- **Hosting**: Netlify with serverless functions
- **Storage**: Netlify Blobs (production) / Local files (development)
- **Voice**: Web Speech API

## Project Structure

```
obt-helper-gpt/
├── src/
│   ├── lib/components/    # Svelte components
│   ├── routes/           # Pages and layouts
│   └── app.html         # HTML template
├── netlify/functions/   # Serverless API endpoints
├── docs/               # Complete documentation
├── static/            # Static assets
└── scripts/          # Build and utility scripts
```

## Admin Panel

Access the admin panel at `/admin` (password: "admin123") to:

- Edit AI tool configurations
- Modify system prompts that control AI behavior
- Preview prompt changes with live AI responses
- Manage tool settings (temperature, max tokens, etc.)
- Enable/disable specific tools

## Voice Features

Voice capabilities work in Chrome and Edge browsers:

- **Speech-to-Text**: Click microphone to dictate messages
- **Text-to-Speech**: AI responses can be read aloud
- **Auto-Send**: Messages automatically send after 2 seconds of silence
- **Hands-Free**: Full voice interaction supported

## Documentation

All project documentation is organized in the `/docs` folder:

- **[docs/README.md](./docs/README.md)** - Documentation index and navigation guide
- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Local development setup and workflows
- **[docs/API.md](./docs/API.md)** - API endpoints and data structures
- **[docs/VERSIONING.md](./docs/VERSIONING.md)** - Version management and release process
- **[docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

For complete documentation, see the [Documentation Index](./docs/README.md).

## Contributing

1. Check the [Development Guide](./docs/DEVELOPMENT.md) for setup instructions
2. Review [Documentation Standards](./docs/DOCUMENTATION_STANDARDS.md) for writing guidelines
3. Follow the [Versioning Guide](./docs/VERSIONING.md) for releases
4. See [Troubleshooting](./docs/TROUBLESHOOTING.md) if you encounter issues

## License

[Add your license here]

## Support

- **Issues**: Create a GitHub issue for bugs or feature requests
- **Documentation**: Check the `/docs` folder for detailed guides
- **Troubleshooting**: See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

---

_Built with ❤️ using SvelteKit and OpenAI_
