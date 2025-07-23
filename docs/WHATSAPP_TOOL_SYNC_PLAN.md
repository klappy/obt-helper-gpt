# WhatsApp Tool Synchronization Testing & Fix Plan

## Current Issues

1. **Environment Detection Bug**: The `isLocalDevelopment()` function is hard-coded to return `false`
2. **No Verification**: No way to verify tools are syncing between admin and WhatsApp
3. **Missing Tests**: No integration tests for the save → WhatsApp flow

## Testing Checklist

### Local Development Testing

```bash
# 1. Clean start
rm -rf .svelte-kit build .netlify
netlify dev

# 2. Create test scenario
# - Open admin panel (http://localhost:8888/admin)
# - Edit "Creative Writing Assistant" system prompt
# - Add unique identifier: "TEST_MARKER_12345"
# - Save changes

# 3. Test WhatsApp integration
# Use curl to simulate WhatsApp webhook
curl -X POST http://localhost:8888/.netlify/functions/whatsapp \
  -d "From=whatsapp:+1234567890&Body=Write me a story"

# 4. Verify response contains updated prompt behavior
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
