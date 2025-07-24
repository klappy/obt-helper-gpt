# One-Click Deployment Guide

Deploy your own instance of the OBT Helper GPT in minutes with these one-click deployment options.

## 🚀 Deploy to Netlify (Recommended)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/klappy/obt-helper-gpt)

### Setup Steps:
1. **Click the deploy button above**
2. **Connect your GitHub account** if not already connected
3. **Fork the repository** when prompted
4. **Set environment variables** in Netlify dashboard:
   - `OPENAI_API_KEY`: Your OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
   - `VITE_ADMIN_PASSWORD`: Secure admin password (choose something strong)
   - `TWILIO_ACCOUNT_SID`: For WhatsApp integration ([Twilio Console](https://console.twilio.com/))
   - `TWILIO_AUTH_TOKEN`: For WhatsApp authentication token
   - `TWILIO_WHATSAPP_NUMBER`: Your Twilio WhatsApp number (format: +1234567890)

### Environment Variables Details

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for AI responses | `sk-...` |
| `VITE_ADMIN_PASSWORD` | ✅ Yes | Password for admin panel access | `secure_password_123` |
| `TWILIO_ACCOUNT_SID` | ⚠️ WhatsApp only | Twilio account identifier | `AC...` |
| `TWILIO_AUTH_TOKEN` | ⚠️ WhatsApp only | Twilio authentication token | `...` |
| `TWILIO_WHATSAPP_NUMBER` | ⚠️ WhatsApp only | Your Twilio WhatsApp number | `+15551234567` |

### After Deployment

1. **Access your admin panel**: `https://your-site.netlify.app/admin`
2. **Log in** with your `VITE_ADMIN_PASSWORD`
3. **Customize your AI tools** in the tools section
4. **Set up WhatsApp integration** (optional) in the WhatsApp admin section

---

## ☁️ Deploy to Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/klappy/obt-helper-gpt)

### Setup Steps:
1. **Click the deploy button above**
2. **Connect your GitHub account** and fork the repository
3. **Configure build settings**:
   - **Build command**: `npm run build`
   - **Output directory**: `build`
   - **Node.js version**: `18.x`
4. **Add environment variables** in the Cloudflare Pages dashboard
5. **Enable Functions** for serverless backend functionality

### Cloudflare-Specific Notes
- Uses Cloudflare Pages Functions instead of Netlify Functions
- Storage uses Cloudflare KV/R2 (configure in `wrangler.toml` if needed)
- Some features may require additional Cloudflare services

---

## 🛠️ Manual Deployment

### Prerequisites
- Node.js 18+ installed
- Git installed
- OpenAI API account

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/klappy/obt-helper-gpt.git
cd obt-helper-gpt

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env file with your API keys
nano .env
```

### Environment File Setup (`.env`)

```bash
# Required for basic functionality
OPENAI_API_KEY=sk-your-openai-key-here
VITE_ADMIN_PASSWORD=your_secure_admin_password

# Optional: WhatsApp Integration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+15551234567

# Development only (automatically set in production)
NETLIFY_SITE_ID=your-site-id
```

### Development Commands

```bash
# Start local development server
npm run dev
# Visit http://localhost:5173

# Test serverless functions locally
npm run netlify:dev
# Visit http://localhost:8888

# Run tests
npm test

# Build for production
npm run build
```

### Manual Production Deployment

#### Option 1: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from local build
npm run build
netlify deploy --prod --dir=build
```

#### Option 2: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option 3: Traditional Hosting
```bash
# Build the project
npm run build

# Upload the 'build' directory to your web server
# Note: Serverless functions won't work with traditional hosting
```

---

## 🔧 Configuration

### Customizing Your Instance

1. **Tools Configuration**: Edit tools in `/admin` or modify `src/lib/stores/tools.js`
2. **Styling**: Customize colors and layout in `src/app.css` and component files
3. **Features**: Enable/disable features by modifying the admin panel settings

### Cost Management

- Set **cost ceilings** for each AI tool to prevent overspending
- Monitor usage in the admin dashboard
- Use **model downgrade** features for cost optimization

### WhatsApp Integration

1. **Sign up for Twilio** ([Get started](https://www.twilio.com/whatsapp))
2. **Get WhatsApp Business approval** through Twilio
3. **Configure webhook** in Twilio Console:
   - Webhook URL: `https://your-site.netlify.app/.netlify/functions/whatsapp`
   - HTTP Method: `POST`

---

## 🚨 Troubleshooting

### Common Issues

**502 Bad Gateway Errors**
- Check that all environment variables are set correctly
- Verify OpenAI API key is valid and has credits
- Check function logs in Netlify/Cloudflare dashboard

**Admin Panel Won't Load**
- Verify `VITE_ADMIN_PASSWORD` is set
- Clear browser cache and cookies
- Check for JavaScript errors in browser console

**WhatsApp Not Working**
- Verify Twilio credentials are correct
- Check webhook URL in Twilio Console
- Ensure WhatsApp Business is approved

**Cost Issues**
- Monitor usage in admin dashboard
- Set appropriate cost ceilings
- Use cheaper models (gpt-4o-mini instead of gpt-4o)

### Getting Help

- **GitHub Issues**: [Report bugs](https://github.com/klappy/obt-helper-gpt/issues)
- **Documentation**: Check other docs in the `/docs` folder
- **Logs**: Check function logs in your deployment platform

---

## 📖 Next Steps

After successful deployment:

1. **Explore the Admin Panel** - Customize your AI tools and settings
2. **Set Up Cost Controls** - Configure spending limits for each tool
3. **Enable WhatsApp** - Connect your Twilio account for WhatsApp bot functionality
4. **Share Your Instance** - Export/import tools between different deployments
5. **Monitor Usage** - Keep track of AI usage and costs in the dashboard

**Happy AI building!** 🤖✨