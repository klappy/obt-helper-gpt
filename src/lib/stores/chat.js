// @ts-check
import { writable } from "svelte/store";
import { fetchUserSummaries } from "$lib/utils/openai.js";

// Chat store for managing messages and recall functionality
export const messages = writable([]);
export const isRecalling = writable(false);

// Issue 1.1.3: Handle natural language recall queries
export async function handleRecallQuery(message) {
  // Simple keyword detection
  const recallKeywords = ['recall', 'remember', 'last chat', 'previous', 'earlier', 'before', 'history'];
  const isRecallQuery = recallKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
  
  if (isRecallQuery) {
    isRecalling.set(true);
    
    try {
      // Get recent summaries for this user/tool
      const summaries = await fetchUserSummaries();
      
      isRecalling.set(false);
      
      return {
        type: 'recall',
        summaries: summaries.slice(0, 3) // Last 3 conversations
      };
    } catch (error) {
      console.error('Error fetching summaries:', error);
      isRecalling.set(false);
      
      return {
        type: 'recall',
        summaries: [],
        error: 'Could not retrieve conversation history'
      };
    }
  }
  return null;
}

// Format recall response for display
export function formatRecallResponse(summaries, error = null) {
  if (error) {
    return `Sorry, I had trouble accessing your conversation history: ${error}`;
  }
  
  if (summaries.length === 0) {
    return "I don't have any previous conversations to recall. This might be your first chat with me!";
  }
  
  const formattedSummaries = summaries.map((s, i) => {
    const date = new Date(s.timestamp).toLocaleDateString();
    return `${i+1}. ${date}: ${s.summary} (${s.messageCount} messages)`;
  }).join('\n\n');
  
  return `Here's what we discussed in our previous conversations:\n\n${formattedSummaries}`;
}

// Helper to add messages to the store
export function addMessage(message) {
  messages.update(msgs => [...msgs, {
    id: Date.now(),
    timestamp: new Date(),
    ...message
  }]);
}

// Helper to clear messages
export function clearMessages() {
  messages.set([]);
}

// Helper to get current messages
export function getCurrentMessages() {
  let currentMessages = [];
  messages.subscribe(msgs => currentMessages = msgs)();
  return currentMessages;
}