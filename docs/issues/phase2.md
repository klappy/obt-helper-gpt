# Phase 2 Issues – Advanced Integrations & Sharing (Epic 2)

> **PRD Goal**: Enable intelligent WhatsApp bot switching and community tool sharing for maximum platform reach  
> **Major Release**: 3.0.0  |  **Minor Releases**: 3.1.x / 3.2.x

## Status Legend
- ☑ Closed
- ☐ Open

---

## Step 2.1 – WhatsApp Intent & Linking (Minor 3.1.0)
**Why This Matters**: PRD requires seamless tool switching and web<->WhatsApp session continuity for unified user experience across platforms.

### Issue 2.1.1: Add intent inference LLM call in `whatsapp.js`
- **Status**: ☑ Closed
- **Files**: `netlify/functions/whatsapp.js`
- **Dependencies**: Existing OpenAI integration
- **PRD Connection**: "Intelligently infers appropriate assistant based on user intent" from WhatsApp Integration

**Implementation Details**:
```javascript
// In whatsapp.js
import { inferToolFromMessage } from '../src/lib/utils/openai.js';

export default async function handler(req, context) {
  const { Body: message, From: phoneNumber } = req.body;
  
  // Get current session and tool
  const session = await getOrCreateSession(phoneNumber);
  const currentTool = session.currentTool;
  
  // Infer best tool for this message
  const suggestedTool = await inferToolFromMessage(message, currentTool);
  
  if (suggestedTool && suggestedTool !== currentTool) {
    // Ask for confirmation before switching
    const confirmMessage = `I think "${suggestedTool}" would be better for this. Switch tools? Reply YES to confirm or NO to continue with ${currentTool}.`;
    
    // Store pending switch
    session.pendingSwitch = {
      to: suggestedTool,
      originalMessage: message,
      timestamp: Date.now()
    };
    await saveSession(session);
    
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
      <Response><Message>${confirmMessage}</Message></Response>`, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
  
  // Handle confirmation responses
  if (session.pendingSwitch) {
    if (message.toLowerCase().includes('yes')) {
      session.currentTool = session.pendingSwitch.to;
      const originalMessage = session.pendingSwitch.originalMessage;
      session.pendingSwitch = null;
      await saveSession(session);
      
      // Process original message with new tool
      return await processMessageWithTool(originalMessage, session.currentTool, session);
    } else if (message.toLowerCase().includes('no')) {
      session.pendingSwitch = null;
      await saveSession(session);
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
        <Response><Message>Staying with ${currentTool}. How can I help?</Message></Response>`, {
        headers: { 'Content-Type': 'text/xml' }
      });
    }
  }
  
  // Continue with current tool
  return await processMessageWithTool(message, currentTool, session);
}
```

```javascript
// Add to openai.js
export async function inferToolFromMessage(message, currentTool) {
  const tools = await getAllTools();
  const toolDescriptions = tools.map(t => 
    `${t.id}: ${t.name} - ${t.description}`
  ).join('\n');
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cheaper for classification
    messages: [{
      role: 'system',
      content: `You are a tool classifier. Given a user message and available tools, suggest the BEST tool ID or return "none" if current tool is fine.

Available tools:
${toolDescriptions}

Current tool: ${currentTool}

Rules:
- Only suggest a switch if the new tool is CLEARLY better
- Return just the tool ID (e.g. "creative-writing") or "none"
- Be conservative - don't switch unless obvious`
    }, {
      role: 'user',
      content: `Message: "${message}"`
    }],
    max_tokens: 50,
    temperature: 0.1
  });
  
  const suggestion = response.choices[0].message.content.trim();
  return suggestion === 'none' ? null : suggestion;
}
```

**Testing Requirements**:
- Test script: `scripts/test-whatsapp-intent.js`
- Mock Twilio webhook with various messages
- Test switching confirmation flow

**Test Script Example**:
```javascript
// scripts/test-whatsapp-intent.js
const testCases = [
  { message: "Write me a story", currentTool: "math-tutor", expectSwitch: "creative-writing" },
  { message: "What's 2+2?", currentTool: "creative-writing", expectSwitch: "math-tutor" },
  { message: "Continue our conversation", currentTool: "recipe-helper", expectSwitch: null }
];

for (const test of testCases) {
  const result = await testIntentInference(test);
  console.log(`✓ ${test.message} -> ${result.suggestedTool || 'no switch'}`);
}
```

**Validation Criteria**:
- [ ] Messages clearly needing different tools trigger switch confirmation
- [ ] Generic messages don't trigger unnecessary switches
- [ ] Confirmation flow works (YES/NO responses)
- [ ] Original message processed after confirmed switch

**Success Definition**: WhatsApp bot intelligently suggests tool switches with user confirmation

---

### Issue 2.1.2: Implement phone/code linking form
- **Status**: ☑ Closed
- **Files**: `src/routes/chat/[toolId]/+page.svelte`, `netlify/functions/verify-sync.js`
- **Dependencies**: `npm install twilio` for SMS sending
- **PRD Connection**: "Web form for phone entry; send one-time code via WhatsApp" from Linking Design

**Implementation Details**:
```bash
npm install twilio
```

```svelte
<!-- Add to chat/[toolId]/+page.svelte -->
<script>
  let showLinkingForm = false;
  let phoneNumber = '';
  let verificationCode = '';
  let linkingStep = 'phone'; // 'phone', 'code', 'linked'
  let linkingStatus = '';
  
  async function sendLinkingCode() {
    try {
      const response = await fetch('/.netlify/functions/send-link-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber,
          sessionId: currentSessionId,
          toolId: $page.params.toolId
        })
      });
      
      if (response.ok) {
        linkingStep = 'code';
        linkingStatus = 'Code sent! Check your WhatsApp.';
      } else {
        linkingStatus = 'Failed to send code. Try again.';
      }
    } catch (error) {
      linkingStatus = 'Error sending code.';
    }
  }
  
  async function verifyLinkingCode() {
    try {
      const response = await fetch('/.netlify/functions/verify-link-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber,
          code: verificationCode,
          sessionId: currentSessionId
        })
      });
      
      if (response.ok) {
        linkingStep = 'linked';
        linkingStatus = 'Sessions linked! Messages will sync.';
        showLinkingForm = false;
      } else {
        linkingStatus = 'Invalid code. Try again.';
      }
    } catch (error) {
      linkingStatus = 'Verification failed.';
    }
  }
</script>

<!-- Add button to header -->
<button 
  on:click={() => showLinkingForm = true}
  class="btn-secondary text-sm"
  title="Link with WhatsApp"
>
  📱 Link WhatsApp
</button>

<!-- Linking modal -->
{#if showLinkingForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
      <h3 class="text-lg font-semibold mb-4">Link WhatsApp Session</h3>
      
      {#if linkingStep === 'phone'}
        <p class="text-sm text-gray-600 mb-4">
          Enter your WhatsApp number to sync this conversation
        </p>
        <input 
          type="tel"
          bind:value={phoneNumber}
          placeholder="+1234567890"
          class="w-full p-3 border rounded mb-4"
        />
        <div class="flex gap-2">
          <button 
            on:click={sendLinkingCode}
            class="btn-primary flex-1"
            disabled={!phoneNumber.trim()}
          >
            Send Code
          </button>
          <button 
            on:click={() => showLinkingForm = false}
            class="btn-secondary"
          >
            Cancel
          </button>
        </div>
      {/if}
      
      {#if linkingStep === 'code'}
        <p class="text-sm text-gray-600 mb-4">
          Enter the 6-digit code sent to your WhatsApp
        </p>
        <input 
          type="text"
          bind:value={verificationCode}
          placeholder="123456"
          maxlength="6"
          class="w-full p-3 border rounded mb-4 text-center text-lg"
        />
        <div class="flex gap-2">
          <button 
            on:click={verifyLinkingCode}
            class="btn-primary flex-1"
            disabled={verificationCode.length !== 6}
          >
            Verify
          </button>
          <button 
            on:click={() => linkingStep = 'phone'}
            class="btn-secondary"
          >
            Back
          </button>
        </div>
      {/if}
      
      {#if linkingStatus}
        <p class="text-sm mt-2 {linkingStatus.includes('Failed') || linkingStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}">
          {linkingStatus}
        </p>
      {/if}
    </div>
  </div>
{/if}
```

```javascript
// netlify/functions/send-link-code.js
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export default async function handler(req, context) {
  const { phoneNumber, sessionId, toolId } = JSON.parse(req.body);
  
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store with 10-minute expiry
  await storeBlob(`link-code-${phoneNumber}`, {
    code,
    sessionId,
    toolId,
    expires: Date.now() + 10 * 60 * 1000
  });
  
  try {
    // Send via WhatsApp
    await client.messages.create({
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
      to: 'whatsapp:' + phoneNumber,
      body: `Your OBT Helper link code: ${code}\n\nThis code expires in 10 minutes.`
    });
    
    return new Response('Code sent', { status: 200 });
  } catch (error) {
    console.error('Twilio error:', error);
    return new Response('Failed to send', { status: 500 });
  }
}
```

**Testing Requirements**:
- E2E test: Full linking flow with mock Twilio
- Test code expiry (10 minutes)
- Test invalid phone numbers

**Validation Criteria**:
- [ ] Phone input validates format
- [ ] Code sent via WhatsApp successfully
- [ ] 6-digit code verification works
- [ ] Invalid/expired codes rejected
- [ ] Successful linking persists across page refresh

**Success Definition**: Users can seamlessly link web and WhatsApp sessions via secure verification codes

---

### Issue 2.1.3: Enable bidirectional mirroring
- **Status**: ☑ Closed
- **Files**: `netlify/functions/whatsapp.js`, `netlify/functions/chat.js`
- **Dependencies**: Issue 2.1.2 (session linking)
- **PRD Connection**: "Mirror messages bidirectionally" from Linking Design

**Implementation Details**:
```javascript
// Enhanced session structure
const linkedSession = {
  sessionId: 'unique-id',
  webSessionId: 'web-session-id',
  whatsappNumber: '+1234567890',
  currentTool: 'creative-writing',
  linkedAt: '2025-01-15T10:30:00Z',
  lastSync: '2025-01-15T10:35:00Z'
};

// In chat.js - add mirroring after OpenAI response
export default async function handler(req, context) {
  // ... existing chat logic ...
  
  // After generating AI response
  const aiResponse = await callOpenAI(messages, tool);
  
  // Check for linked WhatsApp session
  const linkedSession = await getLinkedSession(sessionId);
  if (linkedSession) {
    await mirrorToWhatsApp(linkedSession.whatsappNumber, {
      userMessage: userMessage,
      aiResponse: aiResponse,
      tool: tool.name
    });
  }
  
  return new Response(JSON.stringify({ response: aiResponse }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// In whatsapp.js - add mirroring to web
async function processMessageWithTool(message, toolId, session) {
  // ... existing WhatsApp logic ...
  
  const aiResponse = await callOpenAI(messages, tool);
  
  // Mirror to web session if linked
  if (session.webSessionId) {
    await mirrorToWeb(session.webSessionId, {
      userMessage: message,
      aiResponse: aiResponse,
      source: 'whatsapp'
    });
  }
  
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
    <Response><Message>${aiResponse}</Message></Response>`, {
    headers: { 'Content-Type': 'text/xml' }
  });
}

// Mirroring utilities
async function mirrorToWhatsApp(phoneNumber, messageData) {
  const summary = `[Web] ${messageData.userMessage}\n[${messageData.tool}] ${messageData.aiResponse}`;
  
  await client.messages.create({
    from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
    to: 'whatsapp:' + phoneNumber,
    body: `🔄 Synced from web:\n\n${summary}`
  });
}

async function mirrorToWeb(webSessionId, messageData) {
  // Store in temporary sync queue for web to poll
  await storeBlob(`sync-${webSessionId}`, {
    messages: [messageData],
    timestamp: Date.now()
  });
}
```

```javascript
// Add to web chat - polling for synced messages
// In ChatInterface.svelte
onMount(() => {
  if (isLinkedSession) {
    // Poll for synced messages every 5 seconds
    const syncInterval = setInterval(async () => {
      const response = await fetch(`/.netlify/functions/get-synced-messages?sessionId=${sessionId}`);
      if (response.ok) {
        const syncData = await response.json();
        if (syncData.messages.length > 0) {
          syncData.messages.forEach(msg => {
            addMessage({
              role: 'user', 
              content: `📱 ${msg.userMessage}`,
              source: 'whatsapp'
            });
            addMessage({
              role: 'assistant',
              content: msg.aiResponse,
              source: 'whatsapp'
            });
          });
        }
      }
    }, 5000);
    
    return () => clearInterval(syncInterval);
  }
});
```

**Testing Requirements**:
- Integration test: Send message on web, verify WhatsApp receives mirror
- Test: Send message on WhatsApp, verify web receives mirror
- Test sync timing and formatting

**Validation Criteria**:
- [ ] Web messages appear in WhatsApp with clear source indicator
- [ ] WhatsApp messages appear in web with clear source indicator
- [ ] Message sync works in both directions
- [ ] Sync preserves conversation context

**Success Definition**: Linked sessions maintain perfect message synchronization across platforms

---

### Issue 2.1.4: Update WhatsApp docs
- **Status**: ☐ Open
- **Files**: `docs/WHATSAPP_TOOL_SYNC_PLAN.md`, `docs/WHATSAPP_SYNC_SUMMARY.md`
- **Dependencies**: Issues 2.1.1-2.1.3 complete
- **PRD Connection**: Documentation of implemented features

**Implementation Details**:
Update both files with new sections:

```markdown
## Intent-Based Tool Switching
- LLM analyzes incoming messages for tool relevance
- User confirmation required before switching
- Maintains conversation context across switches

## Session Linking
- 6-digit verification codes via WhatsApp
- 10-minute code expiry for security
- Bidirectional message mirroring
- Visual indicators for synced messages

## Testing Flows
1. Intent switching: Send message needing different tool
2. Linking: Link web session with WhatsApp number
3. Mirroring: Verify messages sync both directions
```

**Testing Requirements**: Manual documentation review

**Validation Criteria**:
- [ ] All new features documented with examples
- [ ] Testing procedures updated
- [ ] Architecture diagrams reflect new flows

**Success Definition**: Documentation accurately describes enhanced WhatsApp integration

---

## Step 2.2 – Tool Sharing & Templates (Minor 3.2.0)
**Why This Matters**: PRD requires community sharing and easy deployment for maximum platform adoption and ecosystem growth.

### Issue 2.2.1: Add export JSON button
- **Status**: ☑ Closed
- **Files**: `src/routes/admin/tools/[id]/+page.svelte`
- **Dependencies**: None
- **PRD Connection**: "All tools exportable as JSON templates" from Tool Sharing

**Implementation Details**:
```svelte
<!-- Add to tool editor page -->
<div class="flex gap-4 mt-6 pt-6 border-t">
  <button 
    on:click={exportTool}
    class="btn-secondary flex items-center gap-2"
  >
    📄 Export Tool
  </button>
  
  <button 
    on:click={() => showImportModal = true}
    class="btn-secondary flex items-center gap-2"
  >
    📂 Import Tool
  </button>
</div>

<script>
  async function exportTool() {
    // Clean tool data for export
    const exportData = {
      name: tool.name,
      description: tool.description,
      icon: tool.icon,
      systemPrompt: tool.systemPrompt,
      model: tool.model,
      temperature: tool.temperature,
      maxTokens: tool.maxTokens,
      costCeiling: tool.costCeiling,
      fallbackModel: tool.fallbackModel,
      // Metadata
      exportedAt: new Date().toISOString(),
      exportedBy: 'OBT Helper GPT',
      version: '1.0',
      // Don't export: id, createdAt, updatedAt, usage stats
    };
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.name.toLowerCase().replace(/\s+/g, '-')}-tool.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    // Log export action
    await fetch('/.netlify/functions/log-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'export_tool',
        toolId: tool.id,
        toolName: tool.name
      })
    });
  }
</script>
```

**Testing Requirements**:
- Component test: Verify export generates correct JSON
- Test filename format
- Test excluded sensitive data

**Validation Criteria**:
- [ ] Export button generates downloadable JSON file
- [ ] JSON contains all necessary tool configuration
- [ ] Sensitive data (IDs, stats) excluded from export
- [ ] Filename follows convention: "tool-name-tool.json"

**Success Definition**: Admins can export any tool as a portable JSON template

---

### Issue 2.2.2: Add import JSON form with validation
- **Status**: ☐ Open
- **Files**: `src/routes/admin/tools/+page.svelte`
- **Dependencies**: Issue 2.2.1 (export format)
- **PRD Connection**: "Import between instances" from Tool Sharing

**Implementation Details**:
```svelte
<!-- Import Modal -->
{#if showImportModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold mb-4">Import Tool</h3>
      
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">
          Select Tool JSON File
        </label>
        <input 
          type="file"
          accept=".json"
          on:change={handleFileSelect}
          class="w-full p-2 border rounded"
        />
      </div>
      
      {#if importPreview}
        <div class="mb-4 p-3 bg-gray-50 rounded">
          <h4 class="font-medium">Preview:</h4>
          <p><strong>Name:</strong> {importPreview.name}</p>
          <p><strong>Description:</strong> {importPreview.description}</p>
          <p><strong>Model:</strong> {importPreview.model}</p>
        </div>
      {/if}
      
      {#if importError}
        <div class="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {importError}
        </div>
      {/if}
      
      <div class="flex gap-2">
        <button 
          on:click={importTool}
          class="btn-primary flex-1"
          disabled={!importPreview || importError}
        >
          Import Tool
        </button>
        <button 
          on:click={closeImportModal}
          class="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<script>
  let showImportModal = false;
  let importPreview = null;
  let importError = null;
  
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const validation = validateImportData(data);
        
        if (validation.valid) {
          importPreview = data;
          importError = null;
        } else {
          importPreview = null;
          importError = validation.error;
        }
      } catch (error) {
        importPreview = null;
        importError = 'Invalid JSON file';
      }
    };
    reader.readAsText(file);
  }
  
  function validateImportData(data) {
    const required = ['name', 'description', 'systemPrompt', 'model'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
    }
    
    if (data.model && !['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'].includes(data.model)) {
      return { valid: false, error: 'Unsupported model type' };
    }
    
    if (data.temperature && (data.temperature < 0 || data.temperature > 2)) {
      return { valid: false, error: 'Temperature must be between 0 and 2' };
    }
    
    return { valid: true };
  }
  
  async function importTool() {
    try {
      // Generate new ID and timestamps
      const newTool = {
        ...importPreview,
        id: generateToolId(importPreview.name),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        importedAt: new Date().toISOString(),
        isActive: true
      };
      
      // Save via API
      const response = await fetch('/.netlify/functions/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTool)
      });
      
      if (response.ok) {
        // Refresh tools list
        await loadTools();
        closeImportModal();
        
        // Show success message
        showNotification(`Tool "${newTool.name}" imported successfully!`);
      } else {
        importError = 'Failed to save imported tool';
      }
    } catch (error) {
      importError = 'Import failed: ' + error.message;
    }
  }
</script>
```

**Testing Requirements**:
- E2E test: Export tool, import in different instance
- Test validation for malformed JSON
- Test validation for missing required fields

**Validation Criteria**:
- [ ] File upload accepts .json files only
- [ ] Validation catches missing required fields
- [ ] Validation catches invalid model/temperature values
- [ ] Successful import creates new tool with new ID
- [ ] Import preserves all tool configuration

**Success Definition**: Admins can reliably import tool templates from JSON files with proper validation

---

### Issue 2.2.3: Add one-click deploy docs/buttons
- **Status**: ☐ Open
- **Files**: `docs/DEPLOYMENT.md`
- **Dependencies**: None
- **PRD Connection**: "One-click buttons for Netlify/Cloudflare" from Deployment

**Implementation Details**:
```markdown
# One-Click Deployment

## Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/obt-helper-gpt)

### Setup Steps:
1. Click button above
2. Connect GitHub account
3. Set environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `VITE_ADMIN_PASSWORD`: Secure admin password
   - `TWILIO_ACCOUNT_SID`: For WhatsApp integration
   - `TWILIO_AUTH_TOKEN`: For WhatsApp integration
   - `TWILIO_WHATSAPP_NUMBER`: Your Twilio WhatsApp number

## Deploy to Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/obt-helper-gpt)

### Setup Steps:
1. Click button above
2. Connect GitHub account
3. Set build settings:
   - Build command: `npm run build`
   - Output directory: `build`
4. Add environment variables in Pages dashboard

## Manual Deployment

### Prerequisites
- Node.js 18+
- Git

### Steps
```bash
# Clone repository
git clone https://github.com/your-username/obt-helper-gpt.git
cd obt-helper-gpt

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Build and deploy
npm run build
netlify deploy --prod  # or your preferred deployment method
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | Yes | OpenAI API key | `sk-proj-...` |
| `VITE_ADMIN_PASSWORD` | Yes | Admin panel password | `secure-password-123` |
| `TWILIO_ACCOUNT_SID` | No | For WhatsApp features | `AC...` |
| `TWILIO_AUTH_TOKEN` | No | For WhatsApp features | `...` |
| `TWILIO_WHATSAPP_NUMBER` | No | WhatsApp bot number | `+14155238886` |

## Post-Deployment

1. Visit your deployed site
2. Go to `/admin` and log in
3. Customize your AI tools
4. Test the chat interface
5. Set up WhatsApp webhook (if using)

## Troubleshooting

### Build Fails
- Check Node.js version (18+ required)
- Verify all dependencies installed
- Check for TypeScript errors

### Functions Don't Work
- Verify environment variables set
- Check function logs in deployment dashboard
- Ensure OpenAI API key is valid

### WhatsApp Not Working
- Verify Twilio credentials
- Check webhook URL configuration
- Test with Twilio console
```

**Testing Requirements**: Manual verification of deploy buttons

**Validation Criteria**:
- [ ] Netlify button leads to correct deployment flow
- [ ] Cloudflare button leads to correct deployment flow
- [ ] Environment variables documented clearly
- [ ] Troubleshooting section covers common issues

**Success Definition**: Anyone can deploy the platform in under 30 minutes using one-click buttons

---

### Issue 2.2.4: Update README with forking guidance
- **Status**: ☐ Open
- **Files**: `README.md`
- **Dependencies**: Issue 2.2.3 (deployment docs)
- **PRD Connection**: "Forkable by default" from Tool Sharing

**Implementation Details**:
```markdown
# OBT Helper GPT - Self-Hostable AI WhatsApp Bot Manager

> Build and manage your own suite of AI assistants, accessible via web and WhatsApp, without requiring user ChatGPT accounts.

## ✨ Features

- 🤖 Multiple specialized AI tools (writing, math, recipes, etc.)
- 💬 Web chat interface with voice support
- 📱 WhatsApp integration with intelligent tool switching
- 📊 Cost tracking and automated model downgrading
- 🔄 Session memory and conversation recall
- 👩‍💼 Admin panel for tool management
- 📤 Tool import/export for community sharing
- 🔒 Simple authentication (password + email/phone)

## 🚀 Quick Start

### Option 1: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/obt-helper-gpt)

### Option 2: Local Development

```bash
git clone https://github.com/your-username/obt-helper-gpt.git
cd obt-helper-gpt
npm install
cp .env.example .env  # Add your OpenAI API key
npm run dev
```

## 🍴 Forking & Customization

This project is designed to be easily forkable and customizable:

### What You Can Customize
- **AI Tools**: Add/modify system prompts for different use cases
- **UI/UX**: Customize the interface with your branding
- **Models**: Switch between OpenAI models or add other providers
- **Features**: Enable/disable WhatsApp, voice, admin features
- **Deployment**: Deploy to any serverless platform

### Fork-Friendly Features
- ✅ No vendor lock-in (works on Netlify, Cloudflare, Vercel)
- ✅ Minimal dependencies (SvelteKit + OpenAI)
- ✅ Clear documentation and code structure
- ✅ Export/import tools between instances
- ✅ Environment-based configuration

### Community
- Share your custom tools via JSON export
- Contribute improvements via pull requests
- Join discussions in GitHub Issues

## 🛠 Development

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed setup instructions.

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design overview
- [API Reference](docs/API.md) - Function endpoints and data structures
- [Deployment](docs/DEPLOYMENT.md) - Hosting and environment setup
- [Testing](docs/TESTING.md) - Test strategies and commands
- [Roadmap](docs/ROADMAP.md) - Future development plans

## 🤝 Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- [Documentation](docs/) - Comprehensive guides
- [GitHub Issues](https://github.com/your-username/obt-helper-gpt/issues) - Bug reports and feature requests
- [Discussions](https://github.com/your-username/obt-helper-gpt/discussions) - Community help

---

**Built with ❤️ for the community. Fork it, make it yours!**
```

**Testing Requirements**: Manual review of README content

**Validation Criteria**:
- [ ] Clear value proposition in opening section
- [ ] Multiple deployment options explained
- [ ] Forking benefits and process outlined
- [ ] Community sharing encouraged
- [ ] All documentation links work

**Success Definition**: README encourages and enables easy forking and customization

---

## Closing Criteria for Epic 2
- [ ] All eight issues marked ☑ Closed
- [ ] Version bumped to 3.1.0 after Step 2.1 completion
- [ ] Version bumped to 3.2.0 after Step 2.2 completion
- [ ] All features validated in production environment
- [ ] WhatsApp intent switching works reliably
- [ ] Session linking and mirroring functional
- [ ] Tool export/import tested with real examples

**Epic Success Definition**: Platform enables intelligent cross-platform AI interactions and community-driven tool sharing, positioning it as a forkable, self-hostable alternative to proprietary AI services.