<script lang="ts">
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  
  // Props
  export let label: string;
  export let value: number = 0;
  export let suffix = '';
  export let prefix = '';
  export let format: 'number' | 'currency' | 'percent' | 'compact' = 'number';
  export let trend: 'up' | 'down' | 'neutral' | null = null;
  export let trendValue: number | null = null;
  export let color: 'primary' | 'success' | 'warning' | 'error' | 'info' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let animated = true;
  export let decimals = 0;
  
  // Classes
  let className = '';
  export { className as class };
  
  // Tweened value for smooth animations
  const displayValue = tweened(value, {
    duration: 800,
    easing: cubicOut
  });
  
  // Update tweened value when prop changes
  $: if (animated) {
    displayValue.set(value);
  }
  
  // Format the display value
  $: formattedValue = formatValue(animated ? $displayValue : value);
  
  function formatValue(val: number): string {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(val);
      
      case 'percent':
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(val / 100);
      
      case 'compact':
        return new Intl.NumberFormat('en-US', {
          notation: 'compact',
          compactDisplay: 'short',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(val);
      
      default:
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(val);
    }
  }
  
  // Size classes
  const sizeClasses = {
    sm: {
      container: 'p-3',
      value: 'text-2xl',
      label: 'text-sm',
      trend: 'text-xs'
    },
    md: {
      container: 'p-4',
      value: 'text-3xl',
      label: 'text-base',
      trend: 'text-sm'
    },
    lg: {
      container: 'p-6',
      value: 'text-4xl',
      label: 'text-lg',
      trend: 'text-base'
    }
  };
  
  // Color classes
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-info'
  };
  
  // Trend icons
  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→'
  };
  
  // Mounted state for entrance animation
  let mounted = false;
  onMount(() => {
    mounted = true;
  });
</script>

<div 
  class="live-metric {sizeClasses[size].container} {className}"
  class:mounted
>
  <div class="metric-label {sizeClasses[size].label}">
    {label}
  </div>
  
  <div class="metric-value {sizeClasses[size].value} {colorClasses[color]}">
    {#if prefix}<span class="metric-prefix">{prefix}</span>{/if}
    <span class="metric-number">{formattedValue}</span>
    {#if suffix}<span class="metric-suffix">{suffix}</span>{/if}
  </div>
  
  {#if trend && trendValue !== null}
    <div class="metric-trend {sizeClasses[size].trend}" class:trend-{trend}>
      <span class="trend-icon">{trendIcons[trend]}</span>
      <span class="trend-value">
        {trendValue > 0 ? '+' : ''}{trendValue}%
      </span>
    </div>
  {/if}
</div>

<style>
  /* Base metric styles */
  .live-metric {
    position: relative;
    background: var(--surface-1);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-2);
    transition: all var(--spring-smooth);
    overflow: hidden;
  }
  
  /* Entrance animation */
  .live-metric:not(.mounted) {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  
  .live-metric.mounted {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  
  /* Hover state */
  .live-metric:hover {
    box-shadow: var(--shadow-3);
    transform: translateY(-2px);
  }
  
  /* Label */
  .metric-label {
    color: var(--text-secondary);
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  
  /* Value */
  .metric-value {
    font-weight: 700;
    line-height: 1.2;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }
  
  .metric-prefix,
  .metric-suffix {
    font-size: 0.7em;
    opacity: 0.8;
  }
  
  /* Trend indicator */
  .metric-trend {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    font-weight: 600;
    transition: all var(--spring-bounce);
  }
  
  .trend-up {
    color: var(--success);
    background: var(--success-bg);
  }
  
  .trend-down {
    color: var(--error);
    background: var(--error-bg);
  }
  
  .trend-neutral {
    color: var(--text-secondary);
    background: var(--surface-2);
  }
  
  .trend-icon {
    font-size: 1.2em;
  }
  
  /* Pulse animation for live updates */
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
    100% {
      opacity: 1;
    }
  }
  
  .live-metric:has(.metric-value:not(:only-child)) .metric-number {
    animation: pulse 2s ease-in-out infinite;
  }
  
  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    .live-metric {
      background: var(--surface-1-dark);
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .live-metric {
      transition: none;
    }
    
    .metric-number {
      animation: none !important;
    }
  }
</style>