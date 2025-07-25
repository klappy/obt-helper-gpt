<script lang="ts">
  import { onMount } from 'svelte';
  
  // Props
  export let depth: 1 | 2 | 3 | 4 | 5 = 2;
  export let interactive = false;
  export let hover = true;
  export let padding: 'sm' | 'md' | 'lg' | 'xl' = 'lg';
  export let rounded: 'md' | 'lg' | 'xl' | '2xl' = 'xl';
  export let animate = true;
  export let delay = 0;
  
  // Classes
  let className = '';
  export { className as class };
  
  // Animation state
  let mounted = false;
  
  onMount(() => {
    if (animate) {
      // Delay mount animation
      setTimeout(() => {
        mounted = true;
      }, delay);
    } else {
      mounted = true;
    }
  });
  
  // Computed classes
  $: depthClass = `depth-${depth}`;
  $: paddingClass = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  }[padding];
  $: roundedClass = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  }[rounded];
  $: interactiveClass = interactive ? 'cursor-pointer' : '';
  $: hoverClass = hover && interactive ? `shadow-hover-${Math.min(depth + 1, 5)}` : '';
  $: animateClass = animate && mounted ? 'animate-scale-up' : '';
  $: combinedClass = `
    floating-card
    ${depthClass}
    ${paddingClass}
    ${roundedClass}
    ${interactiveClass}
    ${hoverClass}
    ${animateClass}
    ${className}
  `.trim();
</script>

<div
  class={combinedClass}
  on:click
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
  on:keydown
  role={interactive ? 'button' : 'article'}
  tabindex={interactive ? 0 : -1}
>
  <slot />
</div>

<style>
  .floating-card {
    background-color: var(--surface-1);
    transition: var(--transition-default);
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
    backface-visibility: hidden;
  }
  
  /* Interactive states */
  .floating-card.cursor-pointer:hover {
    transform: translateY(-2px);
  }
  
  .floating-card.cursor-pointer:active {
    transform: translateY(0);
  }
  
  /* Focus styles */
  .floating-card:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  
  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    .floating-card {
      border: 1px solid var(--border-color);
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .floating-card {
      transition: none;
    }
    
    .floating-card.cursor-pointer:hover {
      transform: none;
    }
  }
</style>