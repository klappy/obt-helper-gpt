# OBT Helper GPT - Self-Hostable AI WhatsApp Bot Manager

> Build and manage your own suite of AI assistants, accessible via web and WhatsApp, without requiring user ChatGPT accounts.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/klappy/obt-helper-gpt)

## ✨ Features

- 🤖 **Multiple specialized AI tools** (writing, math, recipes, code help, etc.)
- 💬 **Web chat interface** with voice input/output support
- 📱 **WhatsApp integration** with intelligent tool switching
- 📊 **Cost tracking** and automated model downgrading
- 🔄 **Session memory** and conversation recall
- 👩‍💼 **Admin panel** for tool management and analytics
- 📤 **Tool import/export** for community sharing
- 🔒 **Simple authentication** (password + email/phone)
- 🌐 **Self-hostable** on Netlify, Cloudflare Pages, or any serverless platform

## 🚀 Quick Start

### Option 1: One-Click Deploy (Recommended)

1. **Deploy to Netlify**: Click the button above
2. **Connect GitHub**: Fork the repository when prompted
3. **Set Environment Variables**:
   - `OPENAI_API_KEY`: Your OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
   - `VITE_ADMIN_PASSWORD`: Secure admin password
   - Optional WhatsApp vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
4. **Access your site**: `https://your-site.netlify.app`

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/klappy/obt-helper-gpt.git
cd obt-helper-gpt

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your OpenAI API key

# Start development server
npm run dev
# Visit http://localhost:5173

# Or test with serverless functions
netlify dev
# Visit http://localhost:8888
```

## 🍴 Forking & Customization

This project is **designed to be easily forkable and customizable**:

### What You Can Customize

- **🎨 AI Tools**: Add/modify system prompts for your specific use cases
- **🎭 UI/UX**: Customize the interface with your branding and styling
- **🤖 Models**: Switch between OpenAI models or add other LLM providers
- **⚙️ Features**: Enable/disable WhatsApp, voice, admin features as needed
- **🚀 Deployment**: Deploy to any serverless platform (Netlify, Cloudflare, Vercel)

### Fork-Friendly Features

- **🔧 Modular Architecture**: Each feature is self-contained and optional
- **📝 Environment-Based Config**: Easy customization via environment variables
- **📦 Zero Vendor Lock-in**: Works with multiple deployment platforms
- **📖 Comprehensive Docs**: Detailed guides for customization and deployment
- **🧪 Full Test Suite**: Confident deployment with automated testing

### Customization Examples

```bash
# Customize AI tools
edit src/lib/stores/tools.js

# Change styling and branding  
edit src/app.css
edit src/lib/components/

# Add new LLM providers
edit src/lib/utils/openai.js

# Modify admin features
edit src/routes/admin/
```

## 🏗️ Architecture

- **Frontend**: SvelteKit + TypeScript + Tailwind CSS
- **Backend**: Serverless functions (Netlify Functions / Cloudflare Workers)
- **Storage**: Edge storage (Netlify Blobs / Cloudflare KV/R2)
- **AI**: OpenAI GPT-4o family (configurable)
- **WhatsApp**: Twilio integration (optional)
- **Auth**: Simple password-based (admin) + anonymous users

## 📚 Documentation

- **[🚀 Deployment Guide](docs/DEPLOYMENT.md)** - One-click and manual deployment
- **[📋 Product Requirements](docs/SELF_HOSTABLE_AI_WHATSAPP_BOT_MANAGER_PRD.md)** - Full feature specification
- **[🗺️ Development Roadmap](docs/ROADMAP.md)** - Planned features and progress
- **[📱 WhatsApp Integration](docs/WHATSAPP_SYNC_SUMMARY.md)** - Setup and testing guide
- **[🏗️ Architecture Details](docs/ARCHITECTURE.md)** - Technical implementation

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test WhatsApp integration
npm run test:whatsapp

# Build for production
npm run build
```

## 🤝 Contributing

We welcome contributions! This project thrives on community customization:

1. **Fork the repository**
2. **Create your feature branch**: `git checkout -b my-new-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -am 'Add some feature'`
5. **Push to the branch**: `git push origin my-new-feature`
6. **Submit a pull request**

### Areas Where We'd Love Help

- 🔌 **New LLM Provider Integrations** (Anthropic, Cohere, local models)
- 🌍 **Internationalization** (i18n support for multiple languages)
- 🎨 **Themes and UI Components** (dark mode, mobile improvements)
- 📱 **Additional Messaging Platforms** (Telegram, Discord, Slack)
- 🧪 **Testing and Quality Assurance** (more comprehensive test coverage)

## 💡 Use Cases & Inspiration

This platform is perfect for:

- **🏢 Small Businesses**: Customer service bots with domain-specific knowledge
- **🎓 Educational Institutions**: Subject-specific tutoring assistants
- **👥 Communities**: Shared AI tools for hobby groups or professional networks  
- **🔬 Researchers**: Controlled AI environments for experimentation
- **🏠 Personal Use**: Your own private AI assistant suite

## 🛟 Support

- **📖 Documentation**: Check the `/docs` folder for detailed guides
- **🐛 Bug Reports**: [Open an issue](https://github.com/klappy/obt-helper-gpt/issues) on GitHub
- **💬 Questions**: Use GitHub Discussions for general questions
- **🚀 Deployment Help**: See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for troubleshooting

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

Built with ❤️ for the self-hosting community 🚀

---

### 🌟 Star this repo if you find it useful!

**Ready to build your own AI assistant platform?** Click the deploy button above and get started in minutes!
