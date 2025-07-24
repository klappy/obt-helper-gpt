import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logAIUsage, getUsageStats, getTodayCostForTool, countTokens, calculateCost, MODEL_PRICING } from './ai-usage.js';

// Mock tiktoken
vi.mock('tiktoken', () => ({
  encoding_for_model: vi.fn(() => ({
    encode: vi.fn((text) => new Array(Math.ceil(text.length * 0.25))),
    free: vi.fn()
  }))
}));

// Mock Netlify Blobs
vi.mock('@netlify/blobs', () => ({
  getStore: vi.fn(() => ({
    setJSON: vi.fn(),
    get: vi.fn(),
    list: vi.fn(() => ({ blobs: [] }))
  }))
}));

// Mock crypto for consistent IDs
global.crypto = {
  randomUUID: vi.fn(() => 'test-uuid-123')
};

describe('Issue 1.2.1: Enhanced AI Usage Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.restoreAllTimers();
  });

  describe('countTokens', () => {
    it('should count tokens using tiktoken for known models', async () => {
      const text = 'Hello world, this is a test message';
      const tokenCount = countTokens(text, 'gpt-4o-mini');
      
      // Mock returns array based on text length * 0.25
      expect(tokenCount).toBeGreaterThan(0);
      expect(typeof tokenCount).toBe('number');
    });

    it('should fallback to estimation when tiktoken fails', () => {
      const text = 'Test message';
      const tokenCount = countTokens(text, 'unknown-model');
      
      // Should fallback to estimation (text.length * 0.25)
      expect(tokenCount).toBe(Math.ceil(text.length * 0.25));
    });

    it('should handle empty text gracefully', () => {
      expect(countTokens('', 'gpt-4o-mini')).toBe(0);
      expect(countTokens(null, 'gpt-4o-mini')).toBe(0);
      expect(countTokens(undefined, 'gpt-4o-mini')).toBe(0);
    });
  });

  describe('calculateCost', () => {
    it('should calculate costs accurately for gpt-4o-mini', () => {
      const promptTokens = 100;
      const responseTokens = 150;
      const model = 'gpt-4o-mini';
      
      const costs = calculateCost(promptTokens, responseTokens, model);
      
      // gpt-4o-mini: prompt 0.00015, response 0.0006 per 1K tokens
      const expectedPromptCost = (100 * 0.00015) / 1000;
      const expectedResponseCost = (150 * 0.0006) / 1000;
      const expectedTotal = expectedPromptCost + expectedResponseCost;
      
      expect(costs.promptCost).toBe(Math.round(expectedPromptCost * 10000) / 10000);
      expect(costs.responseCost).toBe(Math.round(expectedResponseCost * 10000) / 10000);
      expect(costs.totalCost).toBe(Math.round(expectedTotal * 10000) / 10000);
    });

    it('should calculate costs accurately for gpt-4o', () => {
      const promptTokens = 500;
      const responseTokens = 300;
      const model = 'gpt-4o';
      
      const costs = calculateCost(promptTokens, responseTokens, model);
      
      // gpt-4o: prompt 0.03, response 0.06 per 1K tokens
      const expectedPromptCost = (500 * 0.03) / 1000;
      const expectedResponseCost = (300 * 0.06) / 1000;
      const expectedTotal = expectedPromptCost + expectedResponseCost;
      
      expect(costs.totalCost).toBe(Math.round(expectedTotal * 10000) / 10000);
    });

    it('should use fallback pricing for unknown models', () => {
      const costs = calculateCost(100, 100, 'unknown-model');
      
      // Should use gpt-4o-mini pricing as fallback
      const expectedCost = ((100 * 0.00015) + (100 * 0.0006)) / 1000;
      expect(costs.totalCost).toBe(Math.round(expectedCost * 10000) / 10000);
    });

    it('should round costs to 4 decimal places', () => {
      const costs = calculateCost(1, 1, 'gpt-4o');
      
      expect(costs.promptCost.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
      expect(costs.responseCost.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
      expect(costs.totalCost.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
    });
  });

  describe('logAIUsage', () => {
    it('should log usage with accurate token counting and cost calculation', async () => {
      const { getStore } = await import('@netlify/blobs');
      const mockStore = { setJSON: vi.fn() };
      getStore.mockReturnValue(mockStore);
      
      const toolId = 'creative-writing';
      const model = 'gpt-4o-mini';
      const prompt = 'Write a story about';
      const response = 'Once upon a time, there was a brave knight...';
      
      const result = await logAIUsage(toolId, model, prompt, response);
      
      expect(result).toEqual({
        id: 'test-uuid-123',
        timestamp: '2025-01-15T10:00:00.000Z',
        toolId,
        model,
        userId: 'anonymous',
        source: 'web',
        promptTokens: expect.any(Number),
        responseTokens: expect.any(Number),
        totalTokens: expect.any(Number),
        promptCost: expect.any(Number),
        responseCost: expect.any(Number),
        totalCost: expect.any(Number),
        tokens: expect.any(Number), // Legacy field
        estimatedCost: expect.any(Number) // Legacy field
      });
      
      expect(result.totalTokens).toBe(result.promptTokens + result.responseTokens);
      expect(result.totalCost).toBe(result.promptCost + result.responseCost);
      expect(result.tokens).toBe(result.totalTokens); // Legacy compatibility
      expect(result.estimatedCost).toBe(result.totalCost); // Legacy compatibility
      
      expect(mockStore.setJSON).toHaveBeenCalledWith(
        'usage_test-uuid-123',
        result,
        {
          metadata: {
            toolId,
            timestamp: '2025-01-15T10:00:00.000Z',
            cost: result.totalCost
          }
        }
      );
    });

    it('should handle custom userId and source', async () => {
      const { getStore } = await import('@netlify/blobs');
      getStore.mockReturnValue({ setJSON: vi.fn() });
      
      const result = await logAIUsage('test-tool', 'gpt-4o-mini', 'prompt', 'response', 'user123', 'whatsapp');
      
      expect(result.userId).toBe('user123');
      expect(result.source).toBe('whatsapp');
    });

    it('should not throw errors on storage failures', async () => {
      const { getStore } = await import('@netlify/blobs');
      getStore.mockReturnValue({ 
        setJSON: vi.fn().mockRejectedValue(new Error('Storage error'))
      });
      
      // Should not throw
      const result = await logAIUsage('test-tool', 'gpt-4o-mini', 'prompt', 'response');
      expect(result).toBeUndefined(); // Returns undefined on error but doesn't throw
    });
  });

  describe('getUsageStats', () => {
    it('should return comprehensive statistics', async () => {
      const { getStore } = await import('@netlify/blobs');
      const mockRecords = [
        {
          id: '1',
          timestamp: '2025-01-15T09:00:00Z',
          toolId: 'creative-writing',
          model: 'gpt-4o-mini',
          totalTokens: 100,
          totalCost: 0.01,
          source: 'web'
        },
        {
          id: '2',
          timestamp: '2025-01-14T15:00:00Z',
          toolId: 'math-tutor',
          model: 'gpt-4o',
          totalTokens: 200,
          totalCost: 0.05,
          source: 'whatsapp'
        }
      ];
      
      getStore.mockReturnValue({
        list: vi.fn().mockResolvedValue({
          blobs: [{ key: 'usage_1' }, { key: 'usage_2' }]
        }),
        get: vi.fn()
          .mockResolvedValueOnce(mockRecords[0])
          .mockResolvedValueOnce(mockRecords[1])
      });
      
      const stats = await getUsageStats(null, 7);
      
      expect(stats).toEqual({
        period: '7 days',
        total: {
          requests: 2,
          tokens: 300,
          cost: 0.06,
          avgCostPerRequest: 0.03,
          avgTokensPerRequest: 150
        },
        byTool: {
          'creative-writing': {
            requests: 1,
            tokens: 100,
            cost: 0.01,
            avgCostPerRequest: 0.01,
            avgTokensPerRequest: 100
          },
          'math-tutor': {
            requests: 1,
            tokens: 200,
            cost: 0.05,
            avgCostPerRequest: 0.05,
            avgTokensPerRequest: 200
          }
        },
        byModel: {
          'gpt-4o-mini': { requests: 1, tokens: 100, cost: 0.01 },
          'gpt-4o': { requests: 1, tokens: 200, cost: 0.05 }
        },
        bySource: {
          'web': { requests: 1, tokens: 100, cost: 0.01 },
          'whatsapp': { requests: 1, tokens: 200, cost: 0.05 }
        },
        dailyBreakdown: expect.any(Array),
        recentActivity: expect.any(Array)
      });
    });

    it('should filter by tool when toolId provided', async () => {
      const { getStore } = await import('@netlify/blobs');
      getStore.mockReturnValue({
        list: vi.fn().mockResolvedValue({ blobs: [] }),
        get: vi.fn()
      });
      
      await getUsageStats('creative-writing', 7);
      
      // Verify function was called with correct parameters
      expect(getStore).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
      const { getStore } = await import('@netlify/blobs');
      getStore.mockReturnValue({
        list: vi.fn().mockRejectedValue(new Error('Storage error'))
      });
      
      const stats = await getUsageStats();
      
      expect(stats).toEqual({
        period: '7 days',
        total: { requests: 0, tokens: 0, cost: 0 },
        byTool: {},
        byModel: {},
        bySource: {},
        dailyBreakdown: [],
        recentActivity: []
      });
    });
  });

  describe('getTodayCostForTool', () => {
    it('should return today\'s cost for specific tool', async () => {
      const { getStore } = await import('@netlify/blobs');
      getStore.mockReturnValue({
        list: vi.fn().mockResolvedValue({ blobs: [] }),
        get: vi.fn()
      });
      
      const cost = await getTodayCostForTool('creative-writing');
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors gracefully', async () => {
      const { getStore } = await import('@netlify/blobs');
      getStore.mockReturnValue({
        list: vi.fn().mockRejectedValue(new Error('Storage error'))
      });
      
      const cost = await getTodayCostForTool('test-tool');
      expect(cost).toBe(0);
    });
  });

  describe('MODEL_PRICING', () => {
    it('should have pricing for all supported models', () => {
      expect(MODEL_PRICING).toHaveProperty('gpt-4o');
      expect(MODEL_PRICING).toHaveProperty('gpt-4o-mini');
      expect(MODEL_PRICING).toHaveProperty('gpt-3.5-turbo');
      
      Object.values(MODEL_PRICING).forEach(pricing => {
        expect(pricing).toHaveProperty('prompt');
        expect(pricing).toHaveProperty('response');
        expect(typeof pricing.prompt).toBe('number');
        expect(typeof pricing.response).toBe('number');
      });
    });
  });
});