<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let primary = true;
  export let size = 'medium';
  export let disabled = false;

  const dispatch = createEventDispatcher();

  let buttonEl: HTMLButtonElement;
  let isRippling = false;
  let rippleX = 0;
  let rippleY = 0;

  function handleClick(e: MouseEvent) {
    if (disabled) return;
    
    const rect = buttonEl.getBoundingClientRect();
    rippleX = e.clientX - rect.left;
    rippleY = e.clientY - rect.top;
    isRippling = true;

    setTimeout(() => {
      isRippling = false;
    }, 600);

    dispatch('click', e);
  }
</script>

<button
  bind:this={buttonEl}
  class="liquid-button"
  class:primary
  class:secondary={!primary}
  class:disabled
  class:small={size === 'small'}
  class:medium={size === 'medium'}
  class:large={size === 'large'}
  on:click={handleClick}
  {disabled}
  {...$$restProps}
>
  <span class="button-content">
    <slot />
  </span>

  {#if isRippling}
    <span
      class="ripple"
      style="left: {rippleX}px; top: {rippleY}px"
    />
  {/if}
</button>

<style>
  .liquid-button {
    position: relative;
    overflow: hidden;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px -3px rgba(102, 126, 234, 0.3);
  }

  .primary:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -5px rgba(102, 126, 234, 0.4);
  }

  .secondary {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .secondary:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(139, 92, 246, 0.3);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
  }

  .small { 
    padding: 0.5rem 1rem; 
    font-size: 0.875rem; 
    border-radius: 8px;
  }
  
  .medium { 
    padding: 0.75rem 1.5rem; 
    font-size: 1rem; 
  }
  
  .large { 
    padding: 1rem 2rem; 
    font-size: 1.125rem; 
    border-radius: 16px;
  }

  .disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  .button-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ripple {
    position: absolute;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: translate(-50%, -50%);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes ripple-animation {
    to {
      width: 400px;
      height: 400px;
      opacity: 0;
    }
  }

  .liquid-button:active:not(.disabled) {
    transform: translateY(0) scale(0.98);
  }
</style> 