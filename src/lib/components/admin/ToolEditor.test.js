import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import ToolEditorPage from '../../routes/admin/tools/[id]/+page.svelte';

// Mock stores and navigation
vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn(fn => fn({ params: { id: 'creative-writing' } }))
  }
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

vi.mock('$lib/stores/tools.js', () => ({
  getToolById: vi.fn(() => ({
    id: 'creative-writing',
    name: 'Creative Writing Assistant',
    description: 'Help with stories and creative content',
    icon: '✍️',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    systemPrompt: 'You are a creative writing assistant.',
    costCeiling: 0.50,
    fallbackModel: 'gpt-4o-mini'
  })),
  updateTool: vi.fn(() => Promise.resolve(true))
}));

// Mock fetch for preview API
global.fetch = vi.fn();

describe('Issue 1.2.4: Human Override UI in Admin Preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render enhanced live preview section', async () => {
    render(ToolEditorPage);
    
    await tick();
    
    expect(screen.getByText('Live Preview & Testing')).toBeInTheDocument();
    expect(screen.getByText('Test your prompt changes and override AI responses for quality assurance')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a test message...')).toBeInTheDocument();
  });

  it('should handle test message and show chat history', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        response: 'This is a test AI response.'
      })
    });

    const { component } = render(ToolEditorPage);
    
    await tick();
    
    const messageInput = screen.getByPlaceholderText('Enter a test message...');
    const sendButton = screen.getByText('Send');
    
    // Type test message
    await fireEvent.input(messageInput, { target: { value: 'Hello, test message!' } });
    await fireEvent.click(sendButton);
    
    // Wait for API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/.netlify/functions/tool-preview', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: expect.objectContaining({
            id: 'creative-writing',
            systemPrompt: 'You are a creative writing assistant.'
          }),
          message: 'Hello, test message!'
        })
      }));
    });
    
    // Should show conversation history
    await waitFor(() => {
      expect(screen.getByText('Conversation History:')).toBeInTheDocument();
      expect(screen.getByText('Hello, test message!')).toBeInTheDocument();
      expect(screen.getByText('This is a test AI response.')).toBeInTheDocument();
    });
  });

  it('should show override button after AI response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        response: 'AI response to override.'
      })
    });

    render(ToolEditorPage);
    
    await tick();
    
    const messageInput = screen.getByPlaceholderText('Enter a test message...');
    const sendButton = screen.getByText('Send');
    
    await fireEvent.input(messageInput, { target: { value: 'Test' } });
    await fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Override Last Response')).toBeInTheDocument();
    });
  });

  it('should open override modal when override button clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        response: 'Original AI response.'
      })
    });

    render(ToolEditorPage);
    
    await tick();
    
    // Send a test message first
    const messageInput = screen.getByPlaceholderText('Enter a test message...');
    await fireEvent.input(messageInput, { target: { value: 'Test' } });
    await fireEvent.click(screen.getByText('Send'));
    
    await waitFor(() => {
      expect(screen.getByText('Override Last Response')).toBeInTheDocument();
    });
    
    // Click override button
    await fireEvent.click(screen.getByText('Override Last Response'));
    
    // Modal should open
    expect(screen.getByText('Override AI Response')).toBeInTheDocument();
    expect(screen.getByText('Replace the AI\'s response with your own text for testing purposes.')).toBeInTheDocument();
    expect(screen.getByText('Original AI Response:')).toBeInTheDocument();
    expect(screen.getByText('"Original AI response."')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your custom response here...')).toBeInTheDocument();
  });

  it('should apply human override and mark it in chat history', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        response: 'Original AI response.'
      })
    });

    render(ToolEditorPage);
    
    await tick();
    
    // Send test message
    const messageInput = screen.getByPlaceholderText('Enter a test message...');
    await fireEvent.input(messageInput, { target: { value: 'Test' } });
    await fireEvent.click(screen.getByText('Send'));
    
    await waitFor(() => {
      expect(screen.getByText('Override Last Response')).toBeInTheDocument();
    });
    
    // Open override modal
    await fireEvent.click(screen.getByText('Override Last Response'));
    
    // Type override response
    const overrideInput = screen.getByPlaceholderText('Type your custom response here...');
    await fireEvent.input(overrideInput, { target: { value: 'This is my custom override response.' } });
    
    // Apply override
    await fireEvent.click(screen.getByText('Apply Override'));
    
    // Check that override is applied and marked
    await waitFor(() => {
      expect(screen.getByText('Human Override')).toBeInTheDocument();
      expect(screen.getByText('This is my custom override response.')).toBeInTheDocument();
    });
    
    // Original AI response should no longer be visible in main chat
    expect(screen.queryByText('Original AI response.')).not.toBeInTheDocument();
  });

  it('should show clear history button when chat has messages', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        response: 'Test response.'
      })
    });

    render(ToolEditorPage);
    
    await tick();
    
    // Send test message
    const messageInput = screen.getByPlaceholderText('Enter a test message...');
    await fireEvent.input(messageInput, { target: { value: 'Test' } });
    await fireEvent.click(screen.getByText('Send'));
    
    await waitFor(() => {
      expect(screen.getByText('Clear History')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully in preview', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(ToolEditorPage);
    
    await tick();
    
    const messageInput = screen.getByPlaceholderText('Enter a test message...');
    await fireEvent.input(messageInput, { target: { value: 'Test' } });
    await fireEvent.click(screen.getByText('Send'));
    
    // Should still show user message in history
    await waitFor(() => {
      expect(screen.getByText('Conversation History:')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  it('should show enhanced current settings with cost ceiling info', async () => {
    render(ToolEditorPage);
    
    await tick();
    
    expect(screen.getByText('Current Settings')).toBeInTheDocument();
    expect(screen.getByText('Cost Ceiling:')).toBeInTheDocument();
    expect(screen.getByText('$0.5/day')).toBeInTheDocument();
    expect(screen.getByText('Fallback Model:')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument();
  });

  it('should clear conversation history when clear button clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        response: 'Test response.'
      })
    });

    render(ToolEditorPage);
    
    await tick();
    
    // Send test message to create history
    const messageInput = screen.getByPlaceholderText('Enter a test message...');
    await fireEvent.input(messageInput, { target: { value: 'Test message' } });
    await fireEvent.click(screen.getByText('Send'));
    
    await waitFor(() => {
      expect(screen.getByText('Conversation History:')).toBeInTheDocument();
      expect(screen.getByText('Clear History')).toBeInTheDocument();
    });
    
    // Clear history
    await fireEvent.click(screen.getByText('Clear History'));
    
    // History should be cleared
    expect(screen.queryByText('Conversation History:')).not.toBeInTheDocument();
    expect(screen.queryByText('Clear History')).not.toBeInTheDocument();
    expect(screen.queryByText('Override Last Response')).not.toBeInTheDocument();
  });

  it('should support Enter key to send messages', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        response: 'Response via Enter key.'
      })
    });

    render(ToolEditorPage);
    
    await tick();
    
    const messageInput = screen.getByPlaceholderText('Enter a test message...');
    await fireEvent.input(messageInput, { target: { value: 'Test Enter key' } });
    
    // Press Enter
    await fireEvent.keyDown(messageInput, { key: 'Enter', shiftKey: false });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(screen.getByText('Response via Enter key.')).toBeInTheDocument();
    });
  });
});