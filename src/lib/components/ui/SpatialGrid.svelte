<script lang="ts">
  // Props
  export let columns: { mobile: number; tablet: number; desktop: number } = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  };
  export let gap: 'sm' | 'md' | 'lg' | 'xl' = 'lg';
  export let adaptive = true;
  export let stagger = false;
  export let staggerDelay = 50;
  
  // Classes
  let className = '';
  export { className as class };
  
  // Gap mappings
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10'
  };
  
  // Build responsive grid classes
  $: gridClasses = [
    'spatial-grid',
    'grid',
    gapClasses[gap],
    `grid-cols-${columns.mobile}`,
    `md:grid-cols-${columns.tablet}`,
    `lg:grid-cols-${columns.desktop}`,
    adaptive && 'spatial-grid-adaptive',
    className
  ].filter(Boolean).join(' ');
</script>

<div 
  class={gridClasses}
  class:spatial-grid-stagger={stagger}
  style:--stagger-delay="{staggerDelay}ms"
>
  <slot />
</div>

<style>
  /* Base grid styles */
  .spatial-grid {
    position: relative;
    width: 100%;
  }
  
  /* Adaptive behavior */
  .spatial-grid-adaptive {
    /* Auto-fit with minimum size */
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  
  /* Stagger animation */
  .spatial-grid-stagger > :global(*) {
    animation: gridItemAppear var(--spring-smooth) both;
    animation-delay: calc(var(--stagger-delay) * var(--stagger-index, 0));
  }
  
  /* Assign stagger index to children */
  .spatial-grid-stagger > :global(*:nth-child(1)) { --stagger-index: 0; }
  .spatial-grid-stagger > :global(*:nth-child(2)) { --stagger-index: 1; }
  .spatial-grid-stagger > :global(*:nth-child(3)) { --stagger-index: 2; }
  .spatial-grid-stagger > :global(*:nth-child(4)) { --stagger-index: 3; }
  .spatial-grid-stagger > :global(*:nth-child(5)) { --stagger-index: 4; }
  .spatial-grid-stagger > :global(*:nth-child(6)) { --stagger-index: 5; }
  .spatial-grid-stagger > :global(*:nth-child(7)) { --stagger-index: 6; }
  .spatial-grid-stagger > :global(*:nth-child(8)) { --stagger-index: 7; }
  .spatial-grid-stagger > :global(*:nth-child(9)) { --stagger-index: 8; }
  .spatial-grid-stagger > :global(*:nth-child(10)) { --stagger-index: 9; }
  .spatial-grid-stagger > :global(*:nth-child(11)) { --stagger-index: 10; }
  .spatial-grid-stagger > :global(*:nth-child(12)) { --stagger-index: 11; }
  
  /* For more than 12 items, use a formula */
  .spatial-grid-stagger > :global(*:nth-child(n+13)) {
    --stagger-index: 12;
  }
  
  /* Grid item appearance animation */
  @keyframes gridItemAppear {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  /* Hover effects for grid items */
  .spatial-grid > :global(*) {
    transition: transform var(--spring-bounce);
  }
  
  .spatial-grid > :global(*:hover) {
    transform: translateY(-2px);
  }
  
  /* Responsive adjustments */
  @media (max-width: 640px) {
    .spatial-grid-adaptive {
      grid-template-columns: 1fr;
    }
  }
  
  /* Accessibility - reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .spatial-grid-stagger > :global(*) {
      animation: none;
    }
    
    .spatial-grid > :global(*) {
      transition: none;
    }
  }
  
  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    .spatial-grid {
      /* Grid items may need different spacing in dark mode */
      --grid-spacing-adjust: 1.1;
    }
  }
</style>