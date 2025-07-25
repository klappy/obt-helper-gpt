# Troubleshooting Guide

**Scope**: Common issues, solutions, and debugging procedures  
**Audience**: Developers, users, support  
**Last Updated**: Version 1.0.0-beta.1

## Critical Issues

### Netlify Functions Body Parsing ⚠️ **CRITICAL PATTERN**

**Problem:** Netlify Functions receive empty `req.body` objects (`{}`) instead of the actual JSON payload, causing "Missing required fields" and similar errors.

**Root Cause:** In Netlify Functions, `req.body` is often an empty object when the request contains JSON. The actual body content must be retrieved using `await req.text()`.

**❌ WRONG PATTERN (causes empty body):**

```javascript
// This gives empty object {} even with valid JSON payload
let bodyData;
if (typeof req.body === "string") {
  bodyData = JSON.parse(req.body);
} else {
  bodyData = req.body; // ❌ Empty object!
}
```

**✅ CORRECT PATTERN (works reliably):**

```javascript
// This correctly retrieves the actual body content
let bodyData;
const bodyText = typeof req.body === "string" ? req.body : await req.text();
bodyData = JSON.parse(bodyText);
```

**When this happens:**

- Frontend sends valid JSON with proper `Content-Type: application/json`
- Netlify receives the request (Content-Length shows payload size)
- But `req.body` is an empty object `{}`
- Destructuring gives `undefined` values
- Functions return "Missing required fields" or similar errors

**Files that use this pattern:**

- ✅ `send-link-code.js` - FIXED
- ✅ `verify-link-code.js` - FIXED
- ✅ `log-action.js` - FIXED
- ✅ `chat.js` - Already correct (reference implementation)

**🚨 MANDATORY: When creating new Netlify Functions that accept POST requests, always use the CORRECT PATTERN above!**

**How to verify the fix:**

1. Check function logs for `req.body raw: {}`
2. If empty, apply the correct pattern above
3. Deploy and test - should receive proper data

**Reference implementation:** See `netlify/functions/chat.js` line 69 for the working pattern.

---

## Other Common Issues

### Netlify Dev Not Working ("Function not found")

**Symptoms**:

- `netlify dev` starts successfully
- API functions return 404 or "Function not found"
- Frontend shows "Function not found" instead of the app

**Root Cause**: Corrupted build cache directories from previous builds, debugging, or package changes.

**Solution**: Clean all build directories before starting:

```bash
rm -rf .svelte-kit build .netlify
netlify dev
```

**Why This Happens**:

- `.svelte-kit/` - SvelteKit build cache
- `build/` - Production build output
- `.netlify/` - Netlify function builds and cache

When these get corrupted (during adapter upgrades, manual file changes, etc.), `netlify dev` cannot properly integrate SvelteKit with Netlify Functions.

**Prevention**: Always clean build directories after:

- Package updates (especially SvelteKit or adapter changes)
- Manual changes to function files
- Switching git branches with build changes

### Development Environment

#### CSS Not Loading

**Symptoms**: Styles not applied, unstyled content
**Solutions**:

```bash
# Check PostCSS configuration
npm run build  # Should complete without errors

# Verify Tailwind import
grep -n "@tailwind" src/app.css

# Clear cache and restart
rm -rf .svelte-kit node_modules/.vite
npm install
npm run dev
```

#### Functions Not Working Locally

**Symptoms**: 500 errors, function not found
**Solutions**:

```bash
# Ensure Netlify CLI is running
netlify dev  # Not npm run dev

# Check function syntax
node -c netlify/functions/tools.js

# Verify environment variables
cat .env  # Should contain OPENAI_API_KEY
```

#### Voice Features Not Working

**Symptoms**: Microphone not responding, speech not recognized
**Solutions**:

- **Browser Support**: Use Chrome or Edge (Web Speech API limitation)
- **Permissions**: Allow microphone access when prompted
- **HTTPS**: Voice features require secure context (https:// or localhost)

### Production Issues

#### Netlify Blobs Errors

**Symptoms**: BlobsConsistencyError, storage failures
**Solutions**:

```javascript
// Check environment configuration
console.log(process.env.NETLIFY_DEV);

// Verify fallback chain is working
// Should fall back to in-memory storage
```

#### OpenAI API Failures

**Symptoms**: Chat not responding, API errors
**Solutions**:

- **Rate Limits**: Check OpenAI dashboard for usage
- **API Key**: Verify key is valid and has credits
- **Model Access**: Ensure access to GPT-4o/GPT-4o-mini

### Admin Panel Issues

#### Can't Access Admin

**Symptoms**: Redirected from /admin, authentication failing
**Solutions**:

- **Password**: Use "admin123" (case sensitive)
- **JavaScript**: Ensure JS is enabled in browser
- **Local Storage**: Clear browser data and retry

#### Tool Updates Not Saving

**Symptoms**: Changes revert after refresh
**Solutions**:

```bash
# Check storage backend
ls -la .netlify/blobs-local/  # Should contain tools-data.json

# Verify function logs
netlify dev  # Watch for storage errors

# Manual backup/restore
cp .netlify/blobs-local/tools-data.json backup.json
```

#### WhatsApp Not Using Updated Tools

**Symptoms**: WhatsApp uses old prompts after admin updates
**Solutions**:

```bash
# Test sync status
npm run test:whatsapp-sync

# Check sync endpoint
curl http://localhost:8888/.netlify/functions/verify-sync

# Debug storage backend
# Look for "EMERGENCY FIX" comment in tools.js
grep -n "EMERGENCY FIX" netlify/functions/tools.js
```

**Root Causes**:

- Environment detection hardcoded to production mode
- Storage backend mismatch between dev and prod
- Caching issues in Netlify Blobs

**Quick Fix**:

```javascript
// In netlify/functions/tools.js, update:
function isLocalDevelopment() {
  return (
    process.env.NETLIFY_DEV === "true" ||
    process.env.NODE_ENV === "development" ||
    !process.env.DEPLOY_URL
  );
}
```

## Error Messages

### Function Errors

**"BlobsConsistencyError"**

```
Netlify Blobs has failed to perform a read using strong consistency
because the environment has not been configured with a 'uncachedEdgeURL' property
```

**Solution**: This is expected in local development. The app falls back to file storage automatically.

**"OpenAI API Error"**

```
OpenAI API request failed with status 429
```

**Solution**: Rate limit exceeded. Wait and retry, or check API usage in OpenAI dashboard.

**"Tool not found"**

```
No tool with ID: invalid-tool-id
```

**Solution**: Verify tool ID exists in tools list, check for typos.

### Browser Errors

**"Speech recognition not supported"**

```
SpeechRecognition is not supported in this browser
```

**Solution**: Use Chrome or Edge browser for voice features.

**"Microphone access denied"**

```
Permission denied for microphone access
```

**Solution**: Allow microphone permissions in browser settings.

## Debugging Procedures

### Local Development Debugging

#### Enable Verbose Logging

```javascript
// Add to netlify/functions/tools.js
console.log("Debug:", { request, environment: process.env.NETLIFY_DEV });
```

#### Check Network Requests

1. Open browser DevTools (F12)
2. Go to Network tab
3. Trigger the issue
4. Look for failed requests (red entries)
5. Check request/response details

#### Inspect Local Storage

```javascript
// In browser console
console.log("Local storage:", localStorage.getItem("tools-cache"));
console.log("Session storage:", sessionStorage.getItem("admin-auth"));
```

### Production Debugging

#### Netlify Function Logs

1. Go to Netlify dashboard
2. Navigate to Functions tab
3. Click on function name
4. View recent invocations and logs

#### Performance Monitoring

```bash
# Check function execution time
grep "Duration:" netlify-logs.txt

# Monitor memory usage
grep "Memory:" netlify-logs.txt
```

## Performance Issues

### Slow Chat Responses

**Causes**:

- Large conversation history
- Complex system prompts
- OpenAI API latency

**Solutions**:

- Limit conversation history to last 10 messages
- Optimize system prompts for brevity
- Use GPT-4o-mini for faster responses

### High Memory Usage

**Causes**:

- Large tool configurations
- Memory leaks in functions
- Excessive logging

**Solutions**:

```javascript
// Optimize tool configurations
const optimizedTool = {
  ...tool,
  systemPrompt: tool.systemPrompt.substring(0, 1000), // Limit length
};

// Clear conversation history periodically
if (messages.length > 20) {
  messages = messages.slice(-10);
}
```

## Browser Compatibility

### Supported Browsers

- **Chrome 60+**: Full support including voice
- **Firefox 55+**: Chat only (no voice)
- **Safari 14+**: Chat only (no voice)
- **Edge 79+**: Full support including voice

### Known Limitations

- **Voice Features**: Chrome/Edge only (Web Speech API)
- **Streaming**: All modern browsers
- **Admin Panel**: All modern browsers

## Recovery Procedures

### Reset Tool Configuration

```bash
# Backup current config
cp .netlify/blobs-local/tools-data.json backup-$(date +%Y%m%d).json

# Reset to defaults
rm .netlify/blobs-local/tools-data.json
netlify dev  # Will recreate with defaults
```

### Clear All Data

```bash
# Development
rm -rf .netlify/blobs-local/
rm -rf .svelte-kit/
npm run dev

# Browser
# Clear site data in DevTools > Application > Storage
```

### Rollback Version

```bash
# Find previous version
git tag -l | tail -2

# Checkout previous version
git checkout v1.0.0-beta.0
npm install
npm run build
```

## Getting Help

### Before Reporting Issues

1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Test in different browser
4. Try with default configuration

### Information to Include

- **Version**: Check footer or admin panel
- **Browser**: Name and version
- **Environment**: Development or production
- **Error Messages**: Exact text from console
- **Steps to Reproduce**: Detailed sequence
- **Expected vs Actual**: What should happen vs what does

### Log Collection

```bash
# Development logs
netlify dev 2>&1 | tee debug.log

# Browser console
# Right-click > Inspect > Console > Save as file

# Function logs
# Netlify dashboard > Functions > View logs
```

---

_For additional support, see [DEVELOPMENT.md](./DEVELOPMENT.md) or create an issue_
