import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ChatInterface from './ChatInterface.svelte';

// Mock the API calls
global.fetch = vi.fn();

describe('WhatsApp Linking', () => {
  const mockTool = {
    id: 'test-tool',
    name: 'Test Tool',
    description: 'A test tool',
    icon: '🧪',
    model: 'gpt-4o-mini'
  };

  beforeEach(() => {
    fetch.mockClear();
  });

  it('should display link WhatsApp button', () => {
    const { getByText } = render(ChatInterface, { tool: mockTool });
    expect(getByText('Link WhatsApp')).toBeInTheDocument();
  });

  it('should open linking modal when button clicked', async () => {
    const { getByText, queryByText } = render(ChatInterface, { tool: mockTool });
    
    // Modal should not be visible initially
    expect(queryByText('Link WhatsApp Session')).not.toBeInTheDocument();
    
    // Click the link button
    await fireEvent.click(getByText('Link WhatsApp'));
    
    // Modal should now be visible
    expect(getByText('Link WhatsApp Session')).toBeInTheDocument();
    expect(getByText('WhatsApp Phone Number')).toBeInTheDocument();
  });

  it('should validate phone number format', async () => {
    const { getByText, getByPlaceholderText } = render(ChatInterface, { tool: mockTool });
    
    // Open modal
    await fireEvent.click(getByText('Link WhatsApp'));
    
    const phoneInput = getByPlaceholderText('+1234567890');
    const sendButton = getByText('Send Code');
    
    // Button should be disabled initially
    expect(sendButton).toBeDisabled();
    
    // Enter invalid phone number
    await fireEvent.input(phoneInput, { target: { value: '123' } });
    expect(sendButton).toBeDisabled();
    
    // Enter valid phone number
    await fireEvent.input(phoneInput, { target: { value: '+1234567890' } });
    expect(sendButton).not.toBeDisabled();
  });

  it('should send verification code successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    const { getByText, getByPlaceholderText } = render(ChatInterface, { tool: mockTool });
    
    // Open modal and enter phone number
    await fireEvent.click(getByText('Link WhatsApp'));
    const phoneInput = getByPlaceholderText('+1234567890');
    await fireEvent.input(phoneInput, { target: { value: '+1234567890' } });
    
    // Click send code
    await fireEvent.click(getByText('Send Code'));
    
    // Should call the API
    expect(fetch).toHaveBeenCalledWith('/.netlify/functions/send-link-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '+1234567890',
        sessionId: expect.any(String),
        toolId: 'test-tool'
      })
    });
    
    // Should show success message and move to code step
    await waitFor(() => {
      expect(getByText('✅ Code sent! Check your WhatsApp.')).toBeInTheDocument();
      expect(getByText('Verification Code')).toBeInTheDocument();
    });
  });

  it('should handle verification code submission', async () => {
    // First call for sending code
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    
    // Second call for verifying code
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        linkedSessionId: 'whatsapp_1234567890',
        phoneNumber: '+1234567890'
      })
    });

    const { getByText, getByPlaceholderText } = render(ChatInterface, { tool: mockTool });
    
    // Go through phone step
    await fireEvent.click(getByText('Link WhatsApp'));
    const phoneInput = getByPlaceholderText('+1234567890');
    await fireEvent.input(phoneInput, { target: { value: '+1234567890' } });
    await fireEvent.click(getByText('Send Code'));
    
    // Wait for code step
    await waitFor(() => {
      expect(getByText('Verification Code')).toBeInTheDocument();
    });
    
    // Enter verification code
    const codeInput = getByPlaceholderText('123456');
    await fireEvent.input(codeInput, { target: { value: '123456' } });
    
    // Submit verification
    await fireEvent.click(getByText('Verify Code'));
    
    // Should call verify API
    expect(fetch).toHaveBeenCalledWith('/.netlify/functions/verify-link-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '+1234567890',
        code: '123456',
        sessionId: expect.any(String)
      })
    });
    
    // Should show success and close modal
    await waitFor(() => {
      expect(getByText('WhatsApp Linked')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid phone number format' })
    });

    const { getByText, getByPlaceholderText } = render(ChatInterface, { tool: mockTool });
    
    // Try to send code with error response
    await fireEvent.click(getByText('Link WhatsApp'));
    const phoneInput = getByPlaceholderText('+1234567890');
    await fireEvent.input(phoneInput, { target: { value: '+1234567890' } });
    await fireEvent.click(getByText('Send Code'));
    
    // Should show error message
    await waitFor(() => {
      expect(getByText('❌ Invalid phone number format')).toBeInTheDocument();
    });
  });

  it('should close modal when cancel is clicked', async () => {
    const { getByText, queryByText } = render(ChatInterface, { tool: mockTool });
    
    // Open modal
    await fireEvent.click(getByText('Link WhatsApp'));
    expect(getByText('Link WhatsApp Session')).toBeInTheDocument();
    
    // Click cancel
    await fireEvent.click(getByText('Cancel'));
    
    // Modal should be closed
    expect(queryByText('Link WhatsApp Session')).not.toBeInTheDocument();
  });
});