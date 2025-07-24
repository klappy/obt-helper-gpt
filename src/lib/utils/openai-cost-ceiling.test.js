import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectModelForTool } from './openai.js';

// Mock the ai-usage utility
vi.mock('./ai-usage.js', () => ({
  getTodayCostForTool: vi.fn()
}));

// Mock the tools store
vi.mock('../stores/tools.js', () => ({
  getAllTools: vi.fn()
}));

describe('Issue 1.2.3: Cost Ceiling and Auto-Downgrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('selectModelForTool', () => {
    it('should return original model when cost is below ceiling', async () => {
      const { getTodayCostForTool } = await import('./ai-usage.js');
      const { getAllTools } = await import('../stores/tools.js');
      
      getTodayCostForTool.mockResolvedValue(0.0250); // $0.025 today
      getAllTools.mockReturnValue([{
        id: 'creative-writing',
        model: 'gpt-4o',
        costCeiling: 0.50, // $0.50 ceiling
        fallbackModel: 'gpt-4o-mini'
      }]);

      const selectedModel = await selectModelForTool('creative-writing', 'gpt-4o');
      
      expect(selectedModel).toBe('gpt-4o');
      expect(getTodayCostForTool).toHaveBeenCalledWith('creative-writing');
    });

    it('should downgrade to fallback model when cost ceiling exceeded', async () => {
      const { getTodayCostForTool } = await import('./ai-usage.js');
      const { getAllTools } = await import('../stores/tools.js');
      
      getTodayCostForTool.mockResolvedValue(0.75); // $0.75 today
      getAllTools.mockReturnValue([{
        id: 'creative-writing',
        model: 'gpt-4o',
        costCeiling: 0.50, // $0.50 ceiling
        fallbackModel: 'gpt-4o-mini'
      }]);

      const selectedModel = await selectModelForTool('creative-writing', 'gpt-4o');
      
      expect(selectedModel).toBe('gpt-4o-mini');
    });

    it('should throw error when cost ceiling exceeded and no fallback model', async () => {
      const { getTodayCostForTool } = await import('./ai-usage.js');
      const { getAllTools } = await import('../stores/tools.js');
      
      getTodayCostForTool.mockResolvedValue(0.75); // $0.75 today
      getAllTools.mockReturnValue([{
        id: 'creative-writing',
        model: 'gpt-4o',
        costCeiling: 0.50, // $0.50 ceiling
        fallbackModel: null // No fallback
      }]);

      await expect(selectModelForTool('creative-writing', 'gpt-4o'))
        .rejects.toThrow('Tool creative-writing has exceeded its daily cost limit of $0.5');
    });

    it('should return original model when no cost ceiling is set', async () => {
      const { getTodayCostForTool } = await import('./ai-usage.js');
      const { getAllTools } = await import('../stores/tools.js');
      
      getTodayCostForTool.mockResolvedValue(1.50); // High cost
      getAllTools.mockReturnValue([{
        id: 'creative-writing',
        model: 'gpt-4o',
        costCeiling: null, // No ceiling
        fallbackModel: 'gpt-4o-mini'
      }]);

      const selectedModel = await selectModelForTool('creative-writing', 'gpt-4o');
      
      expect(selectedModel).toBe('gpt-4o');
    });

    it('should return original model when cost ceiling is zero', async () => {
      const { getTodayCostForTool } = await import('./ai-usage.js');
      const { getAllTools } = await import('../stores/tools.js');
      
      getTodayCostForTool.mockResolvedValue(0.50);
      getAllTools.mockReturnValue([{
        id: 'creative-writing',
        model: 'gpt-4o',
        costCeiling: 0, // Ceiling disabled
        fallbackModel: 'gpt-4o-mini'
      }]);

      const selectedModel = await selectModelForTool('creative-writing', 'gpt-4o');
      
      expect(selectedModel).toBe('gpt-4o');
    });

    it('should handle tool not found gracefully', async () => {
      const { getTodayCostForTool } = await import('./ai-usage.js');
      const { getAllTools } = await import('../stores/tools.js');
      
      getTodayCostForTool.mockResolvedValue(0.50);
      getAllTools.mockReturnValue([]); // Tool not found

      const selectedModel = await selectModelForTool('unknown-tool', 'gpt-4o');
      
      expect(selectedModel).toBe('gpt-4o'); // Fallback to original
    });

    it('should handle API errors gracefully', async () => {
      const { getTodayCostForTool } = await import('./ai-usage.js');
      const { getAllTools } = await import('../stores/tools.js');
      
      getTodayCostForTool.mockRejectedValue(new Error('API Error'));
      getAllTools.mockReturnValue([{
        id: 'creative-writing',
        model: 'gpt-4o',
        costCeiling: 0.50,
        fallbackModel: 'gpt-4o-mini'
      }]);

      const selectedModel = await selectModelForTool('creative-writing', 'gpt-4o');
      
      expect(selectedModel).toBe('gpt-4o'); // Fallback to original on error
    });

    it('should handle exact cost ceiling match correctly', async () => {
      const { getTodayCostForTool } = await import('./ai-usage.js');
      const { getAllTools } = await import('../stores/tools.js');
      
      getTodayCostForTool.mockResolvedValue(0.50); // Exactly at ceiling
      getAllTools.mockReturnValue([{
        id: 'creative-writing',
        model: 'gpt-4o',
        costCeiling: 0.50,
        fallbackModel: 'gpt-4o-mini'
      }]);

      const selectedModel = await selectModelForTool('creative-writing', 'gpt-4o');
      
      expect(selectedModel).toBe('gpt-4o-mini'); // Should downgrade at ceiling
    });

    it('should work with different fallback models', async () => {
      const { getTodayCostForTool } = await import('./ai-usage.js');
      const { getAllTools } = await import('../stores/tools.js');
      
      getTodayCostForTool.mockResolvedValue(1.00);
      getAllTools.mockReturnValue([{
        id: 'creative-writing',
        model: 'gpt-4o',
        costCeiling: 0.50,
        fallbackModel: 'gpt-3.5-turbo' // Different fallback
      }]);

      const selectedModel = await selectModelForTool('creative-writing', 'gpt-4o');
      
      expect(selectedModel).toBe('gpt-3.5-turbo');
    });

    it('should handle multiple cost ceiling scenarios', async () => {
      const { getTodayCostForTool } = await import('./ai-usage.js');
      const { getAllTools } = await import('../stores/tools.js');
      
      const tools = [
        {
          id: 'expensive-tool',
          model: 'gpt-4o',
          costCeiling: 0.10, // Low ceiling
          fallbackModel: 'gpt-4o-mini'
        },
        {
          id: 'cheap-tool', 
          model: 'gpt-4o-mini',
          costCeiling: 1.00, // High ceiling
          fallbackModel: 'gpt-3.5-turbo'
        }
      ];
      
      getAllTools.mockReturnValue(tools);
      
      // Expensive tool should downgrade
      getTodayCostForTool.mockResolvedValueOnce(0.15);
      const expensiveResult = await selectModelForTool('expensive-tool', 'gpt-4o');
      expect(expensiveResult).toBe('gpt-4o-mini');
      
      // Cheap tool should stay the same
      getTodayCostForTool.mockResolvedValueOnce(0.50);
      const cheapResult = await selectModelForTool('cheap-tool', 'gpt-4o-mini');
      expect(cheapResult).toBe('gpt-4o-mini');
    });
  });
});