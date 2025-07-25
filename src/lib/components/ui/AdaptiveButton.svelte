<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let variant: 'primary' | 'secondary' | 'tertiary' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let href: string | null = null;
  export let external = false;
  
  // Classes
  let className = '';
  export { className as class };
  
  const dispatch = createEventDispatcher();
  
  // Handle click
  function handleClick(event: MouseEvent) {
    if (!disabled && !loading) {
      dispatch('click', event);
    }
  }
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };
  
  // Build classes
  $: classes = [
    'neu-button',
    `neu-button-${variant}`,
    sizeClasses[size],
    fullWidth && 'w-full',
    disabled && 'neu-button-disabled',
    loading && 'neu-button-loading',
    className
  ].filter(Boolean).join(' ');
</script>

{#if href}
  <a
    {href}
    class={classes}
    class:pointer-events-none={disabled || loading}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener noreferrer' : undefined}
    on:click={handleClick}
  >
    {#if loading}
      <span class="spinner" aria-hidden="true"></span>
    {/if}
    <slot />
  </a>
{:else}
  <button
    {type}
    {disabled}
    class={classes}
    on:click={handleClick}
  >
    {#if loading}
      <span class="spinner" aria-hidden="true"></span>
    {/if}
    <slot />
  </button>
{/if}

<style>
  /* Base button styles - NO neumorphism, just clean Apple design */
  .neu-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 600;
    border-radius: var(--radius-xl);
    transition: all var(--spring-bounce);
    cursor: pointer;
    user-select: none;
    text-decoration: none;
    border: none;
    outline: none;
  }
  
  /* Primary variant */
  .neu-button-primary {
    background: var(--primary);
    color: white;
    box-shadow: var(--shadow-2);
  }
  
  .neu-button-primary:hover:not(.neu-button-disabled) {
    background: var(--primary-hover);
    box-shadow: var(--shadow-3);
    transform: translateY(-2px);
  }
  
  .neu-button-primary:active:not(.neu-button-disabled) {
    background: var(--primary-active);
    box-shadow: var(--shadow-1);
    transform: translateY(0);
  }
  
  /* Secondary variant */
  .neu-button-secondary {
    background: var(--surface-2);
    color: var(--text-primary);
    box-shadow: var(--shadow-1);
  }
  
  .neu-button-secondary:hover:not(.neu-button-disabled) {
    background: var(--surface-3);
    box-shadow: var(--shadow-2);
    transform: translateY(-1px);
  }
  
  .neu-button-secondary:active:not(.neu-button-disabled) {
    background: var(--surface-4);
    box-shadow: var(--shadow-1);
    transform: translateY(0);
  }
  
  /* Tertiary variant */
  .neu-button-tertiary {
    background: transparent;
    color: var(--primary);
    box-shadow: none;
    border: 2px solid var(--primary);
  }
  
  .neu-button-tertiary:hover:not(.neu-button-disabled) {
    background: var(--primary);
    color: white;
    transform: translateY(-1px);
    box-shadow: var(--shadow-2);
  }
  
  /* Ghost variant */
  .neu-button-ghost {
    background: transparent;
    color: var(--text-primary);
    box-shadow: none;
  }
  
  .neu-button-ghost:hover:not(.neu-button-disabled) {
    background: var(--surface-1);
    box-shadow: var(--shadow-1);
  }
  
  /* Disabled state */
  .neu-button-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Loading state */
  .neu-button-loading {
    cursor: wait;
  }
  
  /* Spinner */
  .spinner {
    width: 1em;
    height: 1em;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Focus styles */
  .neu-button:focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }
  
  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .neu-button {
      transition: none;
    }
    
    .spinner {
      animation: none;
      border-color: currentColor;
    }
  }
</style>