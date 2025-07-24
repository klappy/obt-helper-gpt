import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRecallQuery, formatRecallResponse, addMessage, clearMessages, getCurrentMessages } from './chat.js';

// Mock the OpenAI utils
vi.mock('$lib/utils/openai.js', () => ({
  fetchUserSummaries: vi.fn()
}));

describe('Issue 1.1.3: Natural Language Recall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMessages();
  });

  describe('handleRecallQuery', () => {
    it('should detect recall keywords and trigger summary fetch', async () => {
      const { fetchUserSummaries } = await import('$lib/utils/openai.js');
      const mockSummaries = [
        {
          sessionId: 'session1',
          summary: 'User discussed cooking techniques',
          messageCount: 5,
          timestamp: '2025-01-15T10:00:00Z'
        }
      ];
      fetchUserSummaries.mockResolvedValue(mockSummaries);

      const recallKeywords = [
        'recall last chat',
        'remember our conversation',
        'what did we discuss before?',
        'show me previous messages',
        'our earlier discussion',
        'conversation history'
      ];

      for (const keyword of recallKeywords) {
        const result = await handleRecallQuery(keyword);
        expect(result).toEqual({
          type: 'recall',
          summaries: mockSummaries
        });
      }
    });

    it('should return null for non-recall queries', async () => {
      const normalMessages = [
        'Hello there',
        'How are you?',
        'What is the weather like?',
        'Tell me a joke',
        'Help me with math'
      ];

      for (const message of normalMessages) {
        const result = await handleRecallQuery(message);
        expect(result).toBeNull();
      }
    });

    it('should handle case-insensitive recall detection', async () => {
      const { fetchUserSummaries } = await import('$lib/utils/openai.js');
      fetchUserSummaries.mockResolvedValue([]);

      const variations = [
        'RECALL last chat',
        'Remember Our Conversation',
        'what did we DISCUSS before?',
        'Show Me Previous Messages'
      ];

      for (const variation of variations) {
        const result = await handleRecallQuery(variation);
        expect(result).toEqual({
          type: 'recall',
          summaries: []
        });
      }
    });

    it('should limit summaries to last 3 conversations', async () => {
      const { fetchUserSummaries } = await import('$lib/utils/openai.js');
      const mockSummaries = Array.from({ length: 5 }, (_, i) => ({
        sessionId: `session${i}`,
        summary: `Summary ${i}`,
        messageCount: 3,
        timestamp: `2025-01-${10 + i}T10:00:00Z`
      }));
      fetchUserSummaries.mockResolvedValue(mockSummaries);

      const result = await handleRecallQuery('recall last chat');
      expect(result.summaries).toHaveLength(3);
    });

    it('should handle fetch errors gracefully', async () => {
      const { fetchUserSummaries } = await import('$lib/utils/openai.js');
      fetchUserSummaries.mockRejectedValue(new Error('Storage error'));

      const result = await handleRecallQuery('recall last chat');
      expect(result).toEqual({
        type: 'recall',
        summaries: [],
        error: 'Could not retrieve conversation history'
      });
    });
  });

  describe('formatRecallResponse', () => {
    it('should format empty summaries appropriately', () => {
      const response = formatRecallResponse([]);
      expect(response).toBe("I don't have any previous conversations to recall. This might be your first chat with me!");
    });

    it('should format single summary correctly', () => {
      const summaries = [{
        sessionId: 'session1',
        summary: 'User asked about cooking pasta',
        messageCount: 3,
        timestamp: '2025-01-15T10:00:00Z'
      }];
      
      const response = formatRecallResponse(summaries);
      expect(response).toContain('Here\'s what we discussed');
      expect(response).toContain('User asked about cooking pasta');
      expect(response).toContain('(3 messages)');
      expect(response).toContain('1/15/2025'); // Date format may vary by locale
    });

    it('should format multiple summaries with numbering', () => {
      const summaries = [
        {
          sessionId: 'session1',
          summary: 'First conversation about recipes',
          messageCount: 5,
          timestamp: '2025-01-15T10:00:00Z'
        },
        {
          sessionId: 'session2',
          summary: 'Second conversation about cooking tips',
          messageCount: 3,
          timestamp: '2025-01-14T15:30:00Z'
        }
      ];
      
      const response = formatRecallResponse(summaries);
      expect(response).toContain('1. ');
      expect(response).toContain('First conversation about recipes');
      expect(response).toContain('2. ');
      expect(response).toContain('Second conversation about cooking tips');
    });

    it('should handle error messages', () => {
      const response = formatRecallResponse([], 'Network timeout');
      expect(response).toContain('Sorry, I had trouble accessing');
      expect(response).toContain('Network timeout');
    });
  });

  describe('message management helpers', () => {
    it('should add messages correctly', () => {
      addMessage({ content: 'Hello', role: 'user' });
      addMessage({ content: 'Hi there!', role: 'assistant' });
      
      const messages = getCurrentMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Hello');
      expect(messages[0].role).toBe('user');
      expect(messages[0]).toHaveProperty('id');
      expect(messages[0]).toHaveProperty('timestamp');
    });

    it('should clear messages', () => {
      addMessage({ content: 'Test', role: 'user' });
      expect(getCurrentMessages()).toHaveLength(1);
      
      clearMessages();
      expect(getCurrentMessages()).toHaveLength(0);
    });
  });
});