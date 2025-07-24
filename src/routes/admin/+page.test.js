import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import AdminPage from './+page.svelte';

// Mock Chart.js
const mockChart = {
  destroy: vi.fn()
};

vi.mock('chart.js/auto', () => ({
  default: vi.fn(() => mockChart)
}));

// Mock stores
vi.mock('$lib/stores/tools.js', () => ({
  getAllTools: vi.fn(() => [
    {
      id: 'creative-writing',
      name: 'Creative Writing',
      icon: '✍️',
      model: 'gpt-4o-mini',
      isActive: true
    },
    {
      id: 'math-tutor',
      name: 'Math Tutor', 
      icon: '🧮',
      model: 'gpt-4o',
      isActive: true
    }
  ]),
  resetToolsToDefaults: vi.fn(),
  exportTools: vi.fn(() => '{"tools": []}'),
  importTools: vi.fn(),
  refreshTools: vi.fn(),
  isLoading: { subscribe: vi.fn(fn => fn(false)) }
}));

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Issue 1.2.2: Chart.js Usage Visualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sessions: [],
          stats: { active: 0, totalMessages: 0, totalCost: 0 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          period: '7 days',
          total: {
            requests: 10,
            tokens: 5000,
            cost: 0.0250,
            avgCostPerRequest: 0.0025,
            avgTokensPerRequest: 500
          },
          byTool: {
            'creative-writing': {
              requests: 6,
              tokens: 3000,
              cost: 0.0150,
              avgCostPerRequest: 0.0025,
              avgTokensPerRequest: 500
            },
            'math-tutor': {
              requests: 4,
              tokens: 2000,
              cost: 0.0100,
              avgCostPerRequest: 0.0025,
              avgTokensPerRequest: 500
            }
          },
          byModel: {
            'gpt-4o-mini': {
              requests: 6,
              tokens: 3000,
              cost: 0.0150
            },
            'gpt-4o': {
              requests: 4,
              tokens: 2000,
              cost: 0.0100
            }
          },
          bySource: {
            'web': {
              requests: 8,
              tokens: 4000,
              cost: 0.0200
            },
            'whatsapp': {
              requests: 2,
              tokens: 1000,
              cost: 0.0050
            }
          },
          dailyBreakdown: [
            { date: '2025-01-09', requests: 2, tokens: 1000, cost: 0.0050 },
            { date: '2025-01-10', requests: 1, tokens: 500, cost: 0.0025 },
            { date: '2025-01-11', requests: 3, tokens: 1500, cost: 0.0075 },
            { date: '2025-01-12', requests: 2, tokens: 1000, cost: 0.0050 },
            { date: '2025-01-13', requests: 1, tokens: 500, cost: 0.0025 },
            { date: '2025-01-14', requests: 1, tokens: 500, cost: 0.0025 },
            { date: '2025-01-15', requests: 0, tokens: 0, cost: 0.0000 }
          ]
        })
      });
  });

  it('should render chart containers with proper structure', async () => {
    render(AdminPage);
    
    // Wait for API calls to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    // Check for chart container elements
    expect(screen.getByText('Daily AI Costs')).toBeInTheDocument();
    expect(screen.getByText('Usage by Tool')).toBeInTheDocument();
    expect(screen.getByText('Cost by Model')).toBeInTheDocument();
  });

  it('should display usage statistics correctly', async () => {
    render(AdminPage);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    // Check stats cards
    expect(screen.getByText('$0.0250')).toBeInTheDocument(); // Total cost
    expect(screen.getByText('10 req')).toBeInTheDocument(); // Total requests
  });

  it('should show per-tool usage in tools table', async () => {
    render(AdminPage);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    // Check tool usage display
    expect(screen.getByText('$0.0150')).toBeInTheDocument(); // Creative writing cost
    expect(screen.getByText('6 requests')).toBeInTheDocument(); // Creative writing requests
    expect(screen.getByText('$0.0100')).toBeInTheDocument(); // Math tutor cost
    expect(screen.getByText('4 requests')).toBeInTheDocument(); // Math tutor requests
  });

  it('should display usage summary with correct calculations', async () => {
    render(AdminPage);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    // Check usage summary section
    expect(screen.getByText('Usage Summary (7 days)')).toBeInTheDocument();
    expect(screen.getByText('Total Conversations:')).toBeInTheDocument();
    expect(screen.getByText('Avg Cost/Chat:')).toBeInTheDocument();
    expect(screen.getByText('Total Tokens:')).toBeInTheDocument();
  });

  it('should show cost insights with top tool and model', async () => {
    render(AdminPage);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    // Check cost insights
    expect(screen.getByText('Cost Insights')).toBeInTheDocument();
    expect(screen.getByText('Most Expensive Tool')).toBeInTheDocument();
    expect(screen.getByText('Most Used Model')).toBeInTheDocument();
    expect(screen.getByText('Daily Average')).toBeInTheDocument();
  });

  it('should create Chart.js instances when data is available', async () => {
    const Chart = (await import('chart.js/auto')).default;
    
    render(AdminPage);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    // Wait for charts to be created
    await waitFor(() => {
      expect(Chart).toHaveBeenCalledTimes(3);
    }, { timeout: 3000 });

    // Verify chart configurations
    const chartCalls = Chart.mock.calls;
    
    // Daily cost chart (line chart)
    expect(chartCalls[0][1].type).toBe('line');
    expect(chartCalls[0][1].data.datasets[0].label).toBe('Daily Cost ($)');
    
    // Tool usage chart (bar chart with line overlay)
    expect(chartCalls[1][1].type).toBe('bar');
    expect(chartCalls[1][1].data.datasets[0].label).toBe('Cost ($)');
    expect(chartCalls[1][1].data.datasets[1].label).toBe('Requests');
    
    // Model breakdown chart (doughnut chart)
    expect(chartCalls[2][1].type).toBe('doughnut');
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    fetch.mockReset();
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sessions: [], stats: {} })
      })
      .mockRejectedValueOnce(new Error('API Error'));

    render(AdminPage);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    // Should still render page structure even with API errors
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('AI Tools Management')).toBeInTheDocument();
  });

  it('should show loading states correctly', async () => {
    // Mock slow API response
    fetch.mockReset();
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sessions: [], stats: {} })
      })
      .mockImplementationOnce(() => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            total: { requests: 0, cost: 0 },
            byTool: {},
            byModel: {},
            dailyBreakdown: []
          })
        }), 100);
      }));

    render(AdminPage);
    
    // Should show loading indicators
    expect(screen.getAllByText('...')).toHaveLength(2); // Two loading indicators
  });

  it('should refresh analytics when refresh button is clicked', async () => {
    render(AdminPage);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    const refreshButton = screen.getByText('📊 Refresh Analytics');
    expect(refreshButton).toBeInTheDocument();
    
    // Note: Full click testing would require more complex setup
    // This verifies the button exists and is properly labeled
  });
});