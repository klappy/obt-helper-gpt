# Phase 1 Issues – Core Refactor & MVP Enhancements (Epic 1)

> **PRD Goal**: Add episodic memory and cost tracking to create antifragile, self-managing AI assistant platform  
> **Major Release**: 2.0.0  |  **Minor Releases**: 2.1.x / 2.2.x

## Status Legend
- ☑ Closed
- ☐ Open

---

## Step 1.1 – Session & Memory Foundations (Minor 2.1.0)
**Why This Matters**: PRD requires episodic memory so users can recall past conversations and admins can analyze usage patterns.

### Issue 1.1.1: Add 30-min timeout logic to `utils/whatsapp-session.js`
- **Status**: ☑ Closed
- **Files**: `src/lib/utils/whatsapp-session.js`
- **Dependencies**: None
- **PRD Connection**: Implements session lifecycle from PRD Section "Session Lifecycle and Memory Management"

**Implementation Details**:
```javascript
// Add to whatsapp-session.js
let sessionTimeouts = new Map();

function startSessionTimeout(sessionId, callback) {
  clearTimeout(sessionTimeouts.get(sessionId));
  const timeoutId = setTimeout(() => {
    callback(sessionId);
    sessionTimeouts.delete(sessionId);
  }, 30 * 60 * 1000); // 30 minutes
  sessionTimeouts.set(sessionId, timeoutId);
}

function resetSessionTimeout(sessionId, callback) {
  startSessionTimeout(sessionId, callback);
}
```

**Testing Requirements**:
- Unit test: `npm run test -- whatsapp-session.test.js`
- Mock setTimeout to verify 30min = 1800000ms
- Test timeout callback triggers

**Validation Criteria**:
- [x] Session auto-expires after 30min idle in local dev
- [x] Timeout callback gets called with sessionId
- [x] New messages reset the timeout counter
- [x] Multiple sessions can have independent timeouts

**Success Definition**: Sessions automatically trigger summary generation after 30 minutes of inactivity

---

### Issue 1.1.2: Integrate LLM summary generation
- **Status**: ☑ Closed
- **Files**: `src/lib/utils/whatsapp-session.js`, `netlify/functions/chat.js`
- **Dependencies**: Existing OpenAI integration in `src/lib/utils/openai.js`
- **PRD Connection**: "LLM-generated summary stored in KV" from Session Management section

**Implementation Details**:
```javascript
// In whatsapp-session.js
import { generateSummary } from './openai.js';

async function summarizeAndStore(sessionId, messages) {
  const chatHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const summary = await generateSummary(chatHistory);
  
  // Store in Netlify Blobs with key: summary-{sessionId}
  await storeBlob(`summary-${sessionId}`, {
    sessionId,
    summary,
    messageCount: messages.length,
    timestamp: new Date().toISOString()
  });
}

// In openai.js
export async function generateSummary(chatHistory) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cheaper for summaries
    messages: [{
      role: 'system',
      content: 'Summarize this conversation in 2-3 sentences, focusing on key topics and outcomes.'
    }, {
      role: 'user',
      content: chatHistory
    }],
    max_tokens: 150
  });
  return response.choices[0].message.content;
}
```

**Testing Requirements**:
- E2E test: Start chat, send messages, trigger timeout, verify summary
- Mock OpenAI calls to return predictable summary
- Test Blobs storage with key format

**Validation Criteria**:
- [x] Summary generated when session expires
- [x] Summary stored in Blobs with correct key format
- [x] Summary is coherent 2-3 sentence text
- [x] Failed summaries don't crash session cleanup

**Success Definition**: Every expired session produces a stored summary accessible for later recall

---

### Issue 1.1.3: Implement natural-language recall in `ChatInterface.svelte`
- **Status**: ☑ Closed
- **Files**: `src/lib/components/ChatInterface.svelte`, `src/lib/stores/chat.js`
- **Dependencies**: Issue 1.1.2 (summary storage)
- **PRD Connection**: "Query via natural language" from Memory Management

**Implementation Details**:
```javascript
// In chat.js store
export async function handleRecallQuery(message) {
  // Simple keyword detection
  const recallKeywords = ['recall', 'remember', 'last chat', 'previous', 'earlier'];
  const isRecallQuery = recallKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
  
  if (isRecallQuery) {
    // Get recent summaries for this user/tool
    const summaries = await fetchUserSummaries();
    return {
      type: 'recall',
      summaries: summaries.slice(0, 3) // Last 3 conversations
    };
  }
  return null;
}
```

```svelte
<!-- In ChatInterface.svelte -->
<script>
  import { handleRecallQuery } from '$lib/stores/chat.js';
  
  async function sendMessage() {
    // Check for recall query before sending to OpenAI
    const recallResult = await handleRecallQuery(message);
    if (recallResult) {
      addMessage({
        role: 'assistant',
        content: formatRecallResponse(recallResult.summaries)
      });
      return;
    }
    // Continue with normal OpenAI flow...
  }
  
  function formatRecallResponse(summaries) {
    if (summaries.length === 0) {
      return "I don't have any previous conversations to recall.";
    }
    return "Here's what we discussed before:\n\n" + 
           summaries.map((s, i) => `${i+1}. ${s.summary}`).join('\n\n');
  }
</script>
```

**Testing Requirements**:
- Component test: Verify recall keywords trigger summary fetch
- Test with/without existing summaries
- Test message formatting

**Validation Criteria**:
- [x] Typing "recall last chat" shows previous summaries
- [x] Non-recall messages go to OpenAI normally
- [x] Empty summaries show appropriate message
- [x] Summaries display in readable format

**Success Definition**: Users can naturally ask to recall previous conversations and get meaningful responses

---

### Issue 1.1.4: Update docs with Memory section
- **Status**: ☑ Closed
- **Files**: `docs/ARCHITECTURE.md`
- **Dependencies**: Issues 1.1.1-1.1.3 complete
- **PRD Connection**: Documentation of implemented memory system

**Implementation Details**:
Add new section to ARCHITECTURE.md:

```markdown
## Memory Architecture

### Session Lifecycle
1. Session starts on first message
2. 30-minute inactivity timeout triggers summary
3. Summary stored in edge KV storage
4. Session cleaned up, memory persisted

### Natural Language Recall
- Users can type "recall last chat" or similar
- System searches recent summaries
- Returns formatted conversation history
- No complex NLP - simple keyword matching

### Storage Format
```json
{
  "sessionId": "user-tool-timestamp",
  "summary": "User discussed recipe modifications...",
  "messageCount": 15,
  "timestamp": "2025-01-15T10:30:00Z"
}
```
```

**Testing Requirements**: Manual review of documentation

**Validation Criteria**:
- [x] Memory section clearly explains timeout behavior
- [x] Recall functionality documented with examples
- [x] Storage format specified for future reference
- [x] Links to relevant code files included

**Success Definition**: Documentation provides clear understanding of memory implementation for future developers

---

## Step 1.2 – Admin Analytics & Cost Basics (Minor 2.2.0)
**Why This Matters**: PRD requires cost tracking and admin oversight to maintain "pennies-per-month" operation and prevent runaway AI costs.

### Issue 1.2.1: Extend token logging in `ai-usage.js` & stats function
- **Status**: ☐ Open
- **Files**: `src/lib/utils/ai-usage.js`, `netlify/functions/ai-usage-stats.js`
- **Dependencies**: `npm install tiktoken` for accurate token counting
- **PRD Connection**: "Real-time and historical cost tracking" from Cost Guidelines

**Implementation Details**:
```javascript
// Install tiktoken for accurate counting
// npm install tiktoken

// In ai-usage.js
import { encoding_for_model } from 'tiktoken';

export async function logAIUsage(toolId, model, prompt, response, userId = 'anonymous') {
  const enc = encoding_for_model(model);
  const promptTokens = enc.encode(prompt).length;
  const responseTokens = enc.encode(response).length;
  
  // Calculate costs (OpenAI pricing as of 2025)
  const costs = {
    'gpt-4o': { prompt: 0.03, response: 0.06 }, // per 1K tokens
    'gpt-4o-mini': { prompt: 0.00015, response: 0.0006 }
  };
  
  const cost = ((promptTokens * costs[model].prompt) + 
                (responseTokens * costs[model].response)) / 1000;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    toolId,
    model,
    promptTokens,
    responseTokens,
    cost: Math.round(cost * 10000) / 10000, // 4 decimal places
    userId
  };
  
  // Append to Blobs log file
  await appendToLog('ai-usage', logEntry);
}
```

**Testing Requirements**:
- Integration test with mock OpenAI responses
- Verify token counting accuracy
- Test cost calculations

**Validation Criteria**:
- [ ] Every OpenAI call generates usage log entry
- [ ] Token counts match tiktoken calculations
- [ ] Cost calculations accurate to 4 decimal places
- [ ] Stats endpoint returns usage data in JSON format

**Success Definition**: Admins can track exact AI costs per conversation and tool

---

### Issue 1.2.2: Add Chart.js usage viz to `admin/+page.svelte`
- **Status**: ☐ Open
- **Files**: `src/routes/admin/+page.svelte`
- **Dependencies**: `npm install chart.js`, Issue 1.2.1 (usage logging)
- **PRD Connection**: "Visualize usage, token costs" from Admin Dashboard Features

**Implementation Details**:
```bash
npm install chart.js
```

```svelte
<!-- In admin/+page.svelte -->
<script>
  import Chart from 'chart.js/auto';
  import { onMount } from 'svelte';
  
  let chartCanvas;
  let usageStats = [];
  
  onMount(async () => {
    const response = await fetch('/.netlify/functions/ai-usage-stats');
    usageStats = await response.json();
    createCharts();
  });
  
  function createCharts() {
    // Daily cost chart
    new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: getLast7Days(),
        datasets: [{
          label: 'Daily Cost ($)',
          data: aggregateDailyCosts(usageStats),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => '$' + value.toFixed(4)
            }
          }
        }
      }
    });
  }
</script>

<div class="grid grid-cols-2 gap-6">
  <div class="bg-white p-6 rounded-lg shadow">
    <h3 class="text-lg font-semibold mb-4">Daily AI Costs</h3>
    <canvas bind:this={chartCanvas}></canvas>
  </div>
  
  <div class="bg-white p-6 rounded-lg shadow">
    <h3 class="text-lg font-semibold mb-4">Usage Summary</h3>
    <div class="space-y-2">
      <p>Total Conversations: {usageStats.length}</p>
      <p>Total Cost: ${getTotalCost().toFixed(4)}</p>
      <p>Avg Cost/Chat: ${getAvgCost().toFixed(4)}</p>
    </div>
  </div>
</div>
```

**Testing Requirements**:
- Component test with mock usage data
- Verify chart renders with data
- Test responsive layout

**Validation Criteria**:
- [ ] Charts display real usage data in admin panel
- [ ] Daily cost trends visible over last 7 days
- [ ] Summary stats show totals and averages
- [ ] Charts responsive on mobile devices

**Success Definition**: Admins can visually track AI costs and usage patterns

---

### Issue 1.2.3: Implement cost ceilings + auto-downgrade
- **Status**: ☐ Open
- **Files**: `src/routes/admin/tools/[id]/+page.svelte`, `src/lib/utils/openai.js`
- **Dependencies**: Issue 1.2.1 (cost tracking)
- **PRD Connection**: "Auto-downgrade on cost ceiling hit" from Model Switching Logic

**Implementation Details**:
```svelte
<!-- In admin/tools/[id]/+page.svelte -->
<div class="form-group">
  <label for="costCeiling">Daily Cost Ceiling ($)</label>
  <input 
    type="number" 
    id="costCeiling"
    bind:value={tool.costCeiling}
    step="0.01"
    min="0"
    placeholder="e.g., 0.50"
  />
  <p class="text-sm text-gray-600">
    Auto-downgrade to cheaper model when exceeded
  </p>
</div>

<div class="form-group">
  <label for="fallbackModel">Fallback Model</label>
  <select bind:value={tool.fallbackModel}>
    <option value="gpt-4o-mini">GPT-4o Mini (Cheaper)</option>
    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cheapest)</option>
  </select>
</div>
```

```javascript
// In openai.js
export async function selectModelForTool(toolId, originalModel) {
  const todayCost = await getTodayCostForTool(toolId);
  const tool = await getTool(toolId);
  
  if (tool.costCeiling && todayCost >= tool.costCeiling) {
    console.log(`Cost ceiling hit for ${toolId}: $${todayCost} >= $${tool.costCeiling}`);
    return tool.fallbackModel || 'gpt-4o-mini';
  }
  
  return originalModel;
}
```

**Testing Requirements**:
- E2E test: Set low ceiling, trigger downgrade
- Test cost calculation accuracy
- Verify fallback model selection

**Validation Criteria**:
- [ ] Admin can set cost ceiling per tool
- [ ] Model downgrades when ceiling exceeded
- [ ] Downgrade logged for admin visibility
- [ ] Normal model resumes next day (reset)

**Success Definition**: Automated cost control prevents runaway AI expenses

---

### Issue 1.2.4: Add human override UI in admin preview
- **Status**: ☐ Open
- **Files**: `src/routes/admin/tools/[id]/+page.svelte`
- **Dependencies**: None
- **PRD Connection**: "Manual response injection" from Admin Dashboard Features

**Implementation Details**:
```svelte
<!-- Add to tool editor page -->
<div class="mt-8 border-t pt-6">
  <h3 class="text-lg font-semibold mb-4">Test & Override</h3>
  
  <div class="grid grid-cols-2 gap-6">
    <!-- Live Preview -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <h4 class="font-medium mb-2">Live Preview</h4>
      <div class="chat-preview max-h-64 overflow-y-auto mb-4">
        {#each previewMessages as message}
          <div class="message mb-2 p-2 rounded {message.role === 'user' ? 'bg-blue-100' : 'bg-white'}">
            <strong>{message.role}:</strong> {message.content}
          </div>
        {/each}
      </div>
      
      <input 
        type="text" 
        bind:value={testMessage}
        placeholder="Test message..."
        class="w-full p-2 border rounded"
        on:keypress={e => e.key === 'Enter' && sendTestMessage()}
      />
      <button 
        on:click={sendTestMessage}
        class="mt-2 btn-primary"
      >
        Send Test
      </button>
    </div>
    
    <!-- Override Controls -->
    <div class="bg-yellow-50 p-4 rounded-lg">
      <h4 class="font-medium mb-2">Admin Override</h4>
      <textarea 
        bind:value={overrideResponse}
        placeholder="Type custom response to inject..."
        class="w-full p-2 border rounded h-24"
      ></textarea>
      <button 
        on:click={injectOverride}
        class="mt-2 btn-secondary"
        disabled={!overrideResponse.trim()}
      >
        Override Last Response
      </button>
      <p class="text-xs text-gray-600 mt-1">
        Replaces AI response with your text for testing
      </p>
    </div>
  </div>
</div>
```

**Testing Requirements**:
- Component test for override functionality
- Test preview message display
- Verify override replaces AI response

**Validation Criteria**:
- [ ] Admin can test prompts in live preview
- [ ] Override replaces AI response in preview
- [ ] Override clearly marked as admin injection
- [ ] Preview resets when tool config changes

**Success Definition**: Admins can test and manually control AI responses for quality assurance

---

## Closing Criteria for Epic 1
- [ ] All eight issues marked ☑ Closed
- [ ] Version bumped to 2.1.0 after Step 1.1 completion
- [ ] Version bumped to 2.2.0 after Step 1.2 completion  
- [ ] All features validated in production environment
- [ ] No regressions in existing chat/admin functionality
- [ ] Memory and cost tracking fully operational

**Epic Success Definition**: Platform has episodic memory for conversation recall and comprehensive cost tracking with automated controls, maintaining antifragile operation under $5/month for moderate usage.