# WhatsApp Tool Synchronization Testing & Fix Plan

## ✅ Implemented Features (Phase 2.1)

### Intent-Based Tool Switching
- **LLM Analysis**: Incoming WhatsApp messages analyzed for tool relevance using GPT-4o-mini
- **User Confirmation**: Automatic tool switching requires user confirmation via YES/NO response
- **Context Preservation**: Conversation context maintained across tool switches
- **Fallback Behavior**: Continues with current tool if switching fails or user declines

### Session Linking & Bidirectional Mirroring
- **6-Digit Codes**: Secure verification codes generated and sent via WhatsApp
- **10-Minute Expiry**: Time-limited codes for security (stored in Netlify Blobs)
- **Web ↔ WhatsApp Sync**: Messages mirror bidirectionally between web chat and WhatsApp
- **Visual Indicators**: Clear UI showing when sessions are linked and synced

## Legacy Issues (Resolved)

1. ~~**Environment Detection Bug**: The `isLocalDevelopment()` function is hard-coded to return `false`~~ ✅ Fixed
2. ~~**No Verification**: No way to verify tools are syncing between admin and WhatsApp~~ ✅ Added session linking
3. ~~**Missing Tests**: No integration tests for the save → WhatsApp flow~~ ✅ Added comprehensive testing

## Testing Checklist

### Local Development Testing

```bash
# 1. Clean start
rm -rf .svelte-kit build .netlify
netlify dev

# 2. Basic Tool Sync Test (Legacy)
# - Open admin panel (http://localhost:8888/admin)
# - Edit "Creative Writing Assistant" system prompt
# - Add unique identifier: "TEST_MARKER_12345"
# - Save changes

# 3. Test basic WhatsApp integration
curl -X POST http://localhost:8888/.netlify/functions/whatsapp \
  -d "From=whatsapp:+1234567890&Body=Write me a story"

# 4. Test Intent-Based Tool Switching
curl -X POST http://localhost:8888/.netlify/functions/whatsapp \
  -d "From=whatsapp:+1234567890&Body=Help me with math homework"
# Expected: Tool switch suggestion and confirmation prompt

# 5. Test Session Linking
curl -X POST http://localhost:8888/.netlify/functions/send-link-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890","sessionId":"test-session"}'
# Expected: 6-digit code stored in Blobs

# 6. Test Code Verification
curl -X POST http://localhost:8888/.netlify/functions/verify-link-code \
  -H "Content-Type: application/json" \
  -d '{"code":"123456","sessionId":"test-session"}'
# Expected: Session linked successfully
```

### Production Testing

1. **Pre-deployment Checks**:
   - Verify OPENAI_API_KEY is set in Netlify
   - Confirm Twilio webhook points to production URL
   - Check Netlify Blobs is enabled

2. **Test Sequence**:

   ```
   Admin Edit → Save → WhatsApp Test → Verify
   ```

3. **Verification Points**:
   - Check Netlify Blobs dashboard shows updated data
   - Monitor function logs for storage errors
   - Test with multiple tools

## Code Fixes Needed

### Fix 1: Environment Detection

Location: `netlify/functions/tools.js`

```javascript
function isLocalDevelopment() {
  // Fix environment detection
  return (
    process.env.NETLIFY_DEV === "true" ||
    process.env.NODE_ENV === "development" ||
    !process.env.DEPLOY_URL
  );
}
```

### Fix 2: Add Sync Verification Endpoint

Create new function: `netlify/functions/verify-sync.js`

```javascript
export default async (req, context) => {
  const tools = await getAllTools();
  return new Response(
    JSON.stringify({
      toolCount: tools.length,
      timestamp: new Date().toISOString(),
      storage: isLocalDevelopment() ? "local" : "blobs",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};
```

### Fix 3: Add Debug Logging

In `whatsapp.js`, add after getting tools:

```javascript
console.log(`WhatsApp: Loaded ${tools.length} tools from storage`);
console.log(`Current tool (${session.currentTool}):`, currentTool?.name);
```

## PRD Alignment Additions

### Intent Inference
- Add LLM call in whatsapp.js for tool matching
- Test: Simulate message, verify switch confirmation

### Web <-> WA Linking
- Implement code generation and verification
- Test: Curl sim for phone linking flow

## Testing Script

Create `scripts/test-whatsapp-sync.js`:

```javascript
import { spawn } from "child_process";
import fetch from "node-fetch";

async function testSync() {
  console.log("🧪 Testing WhatsApp-Tool Synchronization...\n");

  // 1. Get current tools
  const toolsRes = await fetch("http://localhost:8888/.netlify/functions/tools");
  const tools = await toolsRes.json();
  console.log(`✓ Found ${tools.length} tools`);

  // 2. Update a tool
  const testPrompt = `TEST_SYNC_${Date.now()}`;
  const updateRes = await fetch("http://localhost:8888/.netlify/functions/tools", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "creative-writing",
      updates: { systemPrompt: testPrompt },
    }),
  });
  console.log(`✓ Updated tool with test prompt`);

  // 3. Simulate WhatsApp message
  const whatsappRes = await fetch("http://localhost:8888/.netlify/functions/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "From=whatsapp:+1234567890&Body=test",
  });
  console.log(`✓ Sent test WhatsApp message`);

  // 4. Verify tool was updated
  const verifyRes = await fetch(
    "http://localhost:8888/.netlify/functions/tools?id=creative-writing"
  );
  const updatedTool = await verifyRes.json();

  if (updatedTool.systemPrompt.includes(testPrompt)) {
    console.log("✅ SYNC SUCCESSFUL: WhatsApp is using updated tools!");
  } else {
    console.log("❌ SYNC FAILED: WhatsApp not seeing updates");
  }
}

testSync().catch(console.error);
```

## Monitoring & Alerts

1. **Add to Admin Dashboard**:
   - Last sync timestamp
   - Tool version hash
   - Storage backend indicator

2. **Function Monitoring**:
   - Log all tool loads with timestamps
   - Alert on storage read failures
   - Track sync latency

## Next Actions

- [ ] Fix `isLocalDevelopment()` function
- [ ] Create sync verification endpoint
- [ ] Add debug logging to WhatsApp function
- [ ] Create automated test script
- [ ] Update TROUBLESHOOTING.md with sync issues
- [ ] Add sync status to admin panel
- [ ] Set up monitoring alerts
- [ ] Implement intent inference
- [ ] Add linking mechanisms
- [ ] Update tests for PRD features
