# API Documentation

**Scope**: Netlify Functions API endpoints and data structures  
**Audience**: Developers, AI agents  
**Last Updated**: Version 1.0.0-beta.1

## Overview

OBT Helper GPT uses Netlify Functions for serverless API endpoints. All functions are located in `netlify/functions/` and accessible at `/.netlify/functions/[function-name]`.

## Base URL

- **Development**: `http://localhost:8888/.netlify/functions/`
- **Production**: `https://your-domain.netlify.app/.netlify/functions/`

## Endpoints

### Tools Management

#### GET /tools

Retrieve all AI tools configuration.

**Request**

```http
GET /.netlify/functions/tools
```

**Response**

```json
{
  "success": true,
  "tools": [
    {
      "id": "creative-writing",
      "name": "Creative Writing Assistant",
      "description": "Help with creative writing projects",
      "icon": "/writing.svg",
      "model": "gpt-4o-mini",
      "temperature": 0.8,
      "maxTokens": 2000,
      "systemPrompt": "You are a creative writing assistant...",
      "active": true,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

#### PUT /tools

Update tools configuration (admin only).

**Request**

```http
PUT /.netlify/functions/tools
Content-Type: application/json

{
  "tools": [
    {
      "id": "creative-writing",
      "name": "Updated Name",
      "description": "Updated description",
      "icon": "/writing.svg",
      "model": "gpt-4o",
      "temperature": 0.9,
      "maxTokens": 3000,
      "systemPrompt": "Updated system prompt...",
      "active": true
    }
  ]
}
```

**Response**

```json
{
  "success": true,
  "message": "Tools updated successfully"
}
```

### Chat Completion

#### POST /chat

Send message to AI tool and get streaming response.

**Request**

```http
POST /.netlify/functions/chat
Content-Type: application/json

{
  "toolId": "creative-writing",
  "message": "Help me write a story about space exploration",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ]
}
```

**Response (Streaming)**

```
data: {"content": "I'd"}
data: {"content": " be"}
data: {"content": " happy"}
data: {"content": " to"}
data: {"content": " help"}
data: {"done": true}
```

## Data Structures

### Tool Object

```typescript
interface Tool {
  id: string; // Unique identifier
  name: string; // Display name
  description: string; // Brief description
  icon: string; // Icon path (relative to static/)
  model: "gpt-4o" | "gpt-4o-mini"; // OpenAI model
  temperature: number; // 0.0 - 2.0 (creativity level)
  maxTokens: number; // Maximum response length
  systemPrompt: string; // AI behavior instructions
  active: boolean; // Whether tool is enabled
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}
```

### Chat Message

```typescript
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}
```

### API Response

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Storage Backend

### Development Environment

- **Type**: Local file storage
- **Location**: `.netlify/blobs-local/tools-data.json`
- **Persistence**: Survives function reloads

### Production Environment

- **Type**: Netlify Blobs
- **Consistency**: Strong consistency for reads/writes
- **Backup**: Automatic with Netlify infrastructure

### Fallback Chain

1. **Primary**: Netlify Blobs (production) / Local files (dev)
2. **Secondary**: In-memory storage
3. **Fallback**: Default tools configuration

## Error Handling

### Common Error Responses

**400 Bad Request**

```json
{
  "success": false,
  "error": "Invalid request format",
  "details": "Missing required field: toolId"
}
```

**404 Not Found**

```json
{
  "success": false,
  "error": "Tool not found",
  "details": "No tool with ID: invalid-tool-id"
}
```

**500 Internal Server Error**

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "OpenAI API request failed"
}
```

### Error Categories

**Client Errors (4xx)**

- Invalid JSON format
- Missing required fields
- Tool not found
- Invalid tool configuration

**Server Errors (5xx)**

- OpenAI API failures
- Storage backend issues
- Function timeout
- Memory limits exceeded

## Rate Limiting

### OpenAI API Limits

- **GPT-4o**: 500 requests/minute
- **GPT-4o-mini**: 1000 requests/minute
- **Tokens**: Varies by plan

### Function Limits

- **Execution Time**: 10 seconds max
- **Memory**: 1008 MB
- **Concurrent**: 1000 executions

## Authentication

### Admin Operations

- **Method**: Simple password authentication
- **Password**: "admin123" (configurable)
- **Scope**: Tool configuration updates only

### Public Operations

- **Method**: No authentication required
- **Scope**: Tool listing and chat interactions

## Development vs Production

### Environment Detection

```javascript
const isDevelopment = process.env.NETLIFY_DEV === "true";
```

### Storage Behavior

- **Development**: Always uses local file storage
- **Production**: Uses Netlify Blobs with fallbacks

### Logging

- **Development**: Console logs enabled
- **Production**: Minimal logging for performance

## Usage Examples

### Fetch All Tools

```javascript
const response = await fetch("/.netlify/functions/tools");
const { tools } = await response.json();
```

### Send Chat Message

```javascript
const response = await fetch("/.netlify/functions/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    toolId: "creative-writing",
    message: "Hello!",
    conversationHistory: [],
  }),
});

// Handle streaming response
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = new TextDecoder().decode(value);
  const lines = chunk.split("\n");

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = JSON.parse(line.slice(6));
      console.log(data.content);
    }
  }
}
```

### Update Tools (Admin)

```javascript
const response = await fetch("/.netlify/functions/tools", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    password: "admin123",
    tools: updatedTools,
  }),
});
```

## Monitoring and Debugging

### Function Logs

- Available in Netlify dashboard
- Local logs via `netlify dev`
- Error tracking with stack traces

### Performance Metrics

- Function execution time
- Memory usage
- Success/error rates
- OpenAI API response times

---

_For implementation details, see [DEVELOPMENT.md](./DEVELOPMENT.md)_
