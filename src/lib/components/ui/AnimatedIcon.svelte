<script lang="ts">
  import { 
    Send, 
    Mic, 
    Image, 
    MessageCircle, 
    Star, 
    Heart, 
    Check, 
    X 
  } from 'lucide-svelte';
  import { fade, fly, scale } from 'svelte/transition';

  export let name: string;
  export let size = 24;
  export let animated = true;
  export let color = 'currentColor';

  const iconMap: Record<string, any> = {
    send: Send,
    mic: Mic,
    image: Image,
    chat: MessageCircle,
    star: Star,
    heart: Heart,
    check: Check,
    close: X
  };

  const animationMap: Record<string, string> = {
    send: 'fly',
    mic: 'pulse',
    image: 'fade',
    chat: 'bounce',
    star: 'spin',
    heart: 'pulse',
    check: 'draw',
    close: 'rotate'
  };

  $: IconComponent = iconMap[name] || Send;
  $: animation = animationMap[name] || 'fade';
</script>

<div 
  class="animated-icon-wrapper"
  class:animated
  style="width: {size}px; height: {size}px;"
>
  {#if animated && animation === 'fly'}
    <div in:fly={{ x: -10, duration: 500 }}>
      <svelte:component this={IconComponent} {size} {color} />
    </div>
  {:else if animated && animation === 'fade'}
    <div in:fade={{ duration: 300 }}>
      <svelte:component this={IconComponent} {size} {color} />
    </div>
  {:else if animated && animation === 'bounce'}
    <div in:scale={{ duration: 600, start: 0.8 }}>
      <svelte:component this={IconComponent} {size} {color} />
    </div>
  {:else}
    <svelte:component this={IconComponent} {size} {color} />
  {/if}
</div>

<style>
  .animated-icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }

  .animated-icon-wrapper:hover {
    transform: scale(1.1);
    filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.4));
  }

  .animated.animated-icon-wrapper :global(svg) {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { 
      transform: scale(1); 
      opacity: 1;
    }
    50% { 
      transform: scale(1.1); 
      opacity: 0.8;
    }
  }
</style> 