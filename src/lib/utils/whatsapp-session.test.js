import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  startSessionTimeout, 
  resetSessionTimeout, 
  clearSessionTimeout 
} from './whatsapp-session.js';

describe('Issue 1.1.1: Session Timeout Logic', () => {
  let mockCallback;
  
  beforeEach(() => {
    // Mock setTimeout and clearTimeout
    vi.useFakeTimers();
    mockCallback = vi.fn();
  });
  
  afterEach(() => {
    vi.restoreAllTimers();
  });

  it('should start timeout with 30 minutes (1800000ms)', () => {
    const sessionId = 'test-session-123';
    
    startSessionTimeout(sessionId, mockCallback);
    
    // Fast-forward time by 29 minutes - should not trigger
    vi.advanceTimersByTime(29 * 60 * 1000);
    expect(mockCallback).not.toHaveBeenCalled();
    
    // Fast-forward by 1 more minute - should trigger
    vi.advanceTimersByTime(1 * 60 * 1000);
    expect(mockCallback).toHaveBeenCalledWith(sessionId);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should clear timeout when clearSessionTimeout is called', () => {
    const sessionId = 'test-session-clear';
    
    startSessionTimeout(sessionId, mockCallback);
    clearSessionTimeout(sessionId);
    
    // Fast-forward past timeout - should not trigger
    vi.advanceTimersByTime(30 * 60 * 1000);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should reset timeout when resetSessionTimeout is called', () => {
    const sessionId = 'test-session-reset';
    
    // Start initial timeout
    startSessionTimeout(sessionId, mockCallback);
    
    // Fast-forward 25 minutes
    vi.advanceTimersByTime(25 * 60 * 1000);
    expect(mockCallback).not.toHaveBeenCalled();
    
    // Reset timeout - this should clear old and start new
    resetSessionTimeout(sessionId, mockCallback);
    
    // Fast-forward 25 more minutes (50 total, but reset happened at 25)
    vi.advanceTimersByTime(25 * 60 * 1000);
    expect(mockCallback).not.toHaveBeenCalled();
    
    // Fast-forward 5 more minutes (30 minutes since reset)
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(mockCallback).toHaveBeenCalledWith(sessionId);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple independent session timeouts', () => {
    const sessionId1 = 'session-1';
    const sessionId2 = 'session-2';
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    
    startSessionTimeout(sessionId1, callback1);
    
    // Start second session 10 minutes later
    vi.advanceTimersByTime(10 * 60 * 1000);
    startSessionTimeout(sessionId2, callback2);
    
    // Fast-forward 20 more minutes (30 total for session1, 20 for session2)
    vi.advanceTimersByTime(20 * 60 * 1000);
    expect(callback1).toHaveBeenCalledWith(sessionId1);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();
    
    // Fast-forward 10 more minutes (30 total for session2)
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(callback2).toHaveBeenCalledWith(sessionId2);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should clear old timeout when starting new one for same session', () => {
    const sessionId = 'test-session-override';
    const oldCallback = vi.fn();
    const newCallback = vi.fn();
    
    // Start first timeout
    startSessionTimeout(sessionId, oldCallback);
    
    // Fast-forward 15 minutes
    vi.advanceTimersByTime(15 * 60 * 1000);
    
    // Start new timeout for same session (should clear old one)
    startSessionTimeout(sessionId, newCallback);
    
    // Fast-forward 30 minutes
    vi.advanceTimersByTime(30 * 60 * 1000);
    
    // Only new callback should have been called
    expect(oldCallback).not.toHaveBeenCalled();
    expect(newCallback).toHaveBeenCalledWith(sessionId);
    expect(newCallback).toHaveBeenCalledTimes(1);
  });
});