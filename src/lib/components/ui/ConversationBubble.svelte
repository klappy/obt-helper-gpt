<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let message: string;
  export let sender: 'user' | 'assistant' | 'system' = 'assistant';
  export let timestamp: Date | string | null = null;
  export let status: 'sending' | 'sent' | 'delivered' | 'read' | 'error' = 'sent';
  export let showAvatar = true;
  export let avatarUrl: string | null = null;
  export let name: string | null = null;
  export let reactions: Array<{ emoji: string; count: number; active: boolean }> = [];
  export let editable = false;
  export let deletable = false;
  
  // Classes
  let className = '';
  export { className as class };
  
  const dispatch = createEventDispatcher();
  
  // Format timestamp
  function formatTime(date: Date | string | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  }
  
  // Handle double tap for reactions
  let tapTimeout: number;
  function handleDoubleTap() {
    if (tapTimeout) {
      clearTimeout(tapTimeout);
      dispatch('react');
    } else {
      tapTimeout = setTimeout(() => {
        tapTimeout = 0;
      }, 300);
    }
  }
  
  // Status icons
  const statusIcons = {
    sending: '○',
    sent: '✓',
    delivered: '✓✓',
    read: '✓✓',
    error: '!'
  };
  
  // Avatar defaults
  const defaultAvatars = {
    user: '👤',
    assistant: '🤖',
    system: 'ℹ️'
  };
</script>

<div 
  class="conversation-bubble conversation-bubble-{sender} {className}"
  role="article"
  aria-label="{name || sender} message"
>
  {#if showAvatar && sender !== 'system'}
    <div class="bubble-avatar" aria-hidden="true">
      {#if avatarUrl}
        <img src={avatarUrl} alt="" />
      {:else}
        <span class="avatar-emoji">{defaultAvatars[sender]}</span>
      {/if}
    </div>
  {/if}
  
  <div class="bubble-content">
    {#if name && sender !== 'system'}
      <div class="bubble-name">{name}</div>
    {/if}
    
    <div 
      class="bubble-message"
      class:bubble-message-user={sender === 'user'}
      class:bubble-message-system={sender === 'system'}
      on:dblclick={handleDoubleTap}
      on:touchstart={handleDoubleTap}
    >
      <span class="message-text">{message}</span>
      
      {#if sender === 'user' && status !== 'sent'}
        <span class="message-status" class:status-{status} aria-label="Message {status}">
          {statusIcons[status]}
        </span>
      {/if}
    </div>
    
    {#if timestamp && sender !== 'system'}
      <div class="bubble-timestamp" aria-label="Sent at {formatTime(timestamp)}">
        {formatTime(timestamp)}
      </div>
    {/if}
    
    {#if reactions.length > 0}
      <div class="bubble-reactions" role="group" aria-label="Reactions">
        {#each reactions as reaction}
          <button
            class="reaction-pill"
            class:reaction-active={reaction.active}
            on:click={() => dispatch('reaction-toggle', reaction)}
            aria-label="{reaction.emoji} reaction, {reaction.count} {reaction.count === 1 ? 'person' : 'people'}"
          >
            <span class="reaction-emoji">{reaction.emoji}</span>
            <span class="reaction-count">{reaction.count}</span>
          </button>
        {/each}
      </div>
    {/if}
    
    {#if editable || deletable}
      <div class="bubble-actions">
        {#if editable}
          <button 
            class="action-button"
            on:click={() => dispatch('edit')}
            aria-label="Edit message"
          >
            ✏️
          </button>
        {/if}
        {#if deletable}
          <button 
            class="action-button"
            on:click={() => dispatch('delete')}
            aria-label="Delete message"
          >
            🗑️
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Base bubble styles */
  .conversation-bubble {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    animation: bubbleAppear var(--spring-smooth) both;
  }
  
  @keyframes bubbleAppear {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  /* Sender variations */
  .conversation-bubble-user {
    flex-direction: row-reverse;
  }
  
  .conversation-bubble-system {
    justify-content: center;
  }
  
  /* Avatar */
  .bubble-avatar {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-full);
    background: var(--surface-2);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-1);
  }
  
  .bubble-avatar img {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    object-fit: cover;
  }
  
  .avatar-emoji {
    font-size: 1.25rem;
  }
  
  /* Content container */
  .bubble-content {
    max-width: 70%;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .conversation-bubble-user .bubble-content {
    align-items: flex-end;
  }
  
  .conversation-bubble-system .bubble-content {
    max-width: 90%;
  }
  
  /* Name */
  .bubble-name {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
    padding: 0 0.75rem;
  }
  
  /* Message */
  .bubble-message {
    position: relative;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-xl);
    background: var(--surface-2);
    color: var(--text-primary);
    box-shadow: var(--shadow-1);
    transition: all var(--spring-bounce);
    word-wrap: break-word;
  }
  
  .bubble-message:hover {
    box-shadow: var(--shadow-2);
    transform: translateY(-1px);
  }
  
  .bubble-message-user {
    background: var(--primary);
    color: white;
  }
  
  .bubble-message-system {
    background: var(--surface-3);
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  /* Message status */
  .message-status {
    position: absolute;
    bottom: 0.25rem;
    right: -1.5rem;
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }
  
  .status-delivered,
  .status-read {
    color: var(--info);
  }
  
  .status-error {
    color: var(--error);
  }
  
  /* Timestamp */
  .bubble-timestamp {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    padding: 0 0.75rem;
  }
  
  /* Reactions */
  .bubble-reactions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.25rem;
    padding: 0 0.5rem;
  }
  
  .reaction-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-full);
    background: var(--surface-1);
    border: 1px solid var(--surface-3);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all var(--spring-bounce);
  }
  
  .reaction-pill:hover {
    background: var(--surface-2);
    transform: scale(1.05);
  }
  
  .reaction-active {
    background: var(--primary-bg);
    border-color: var(--primary);
  }
  
  .reaction-count {
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  /* Actions */
  .bubble-actions {
    display: flex;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity var(--spring-smooth);
    padding: 0 0.75rem;
  }
  
  .conversation-bubble:hover .bubble-actions {
    opacity: 1;
  }
  
  .action-button {
    padding: 0.25rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    opacity: 0.7;
    transition: opacity var(--spring-bounce);
  }
  
  .action-button:hover {
    opacity: 1;
  }
  
  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    .bubble-message {
      background: var(--surface-2-dark);
    }
    
    .bubble-message-user {
      background: var(--primary-dark);
    }
  }
  
  /* Mobile adjustments */
  @media (max-width: 640px) {
    .bubble-content {
      max-width: 85%;
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .conversation-bubble,
    .bubble-message,
    .reaction-pill,
    .bubble-actions {
      transition: none;
    }
  }
</style>