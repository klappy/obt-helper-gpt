<script lang="ts">
  export let blur = 20;
  export let opacity = 0.1;
  export let borderOpacity = 0.2;
  export let hover = true;
  export let glow = false;
  export let interactive = false;
</script>

<div
  class="glass-card"
  style="
    --blur: {blur}px;
    --bg-opacity: {opacity};
    --border-opacity: {borderOpacity};
  "
  class:hoverable={hover}
  class:glowing={glow}
  class:interactive
  {...$$restProps}
>
  <slot />
</div>

<style>
  .glass-card {
    background: rgba(255, 255, 255, var(--bg-opacity));
    backdrop-filter: blur(var(--blur));
    -webkit-backdrop-filter: blur(var(--blur));
    border: 1px solid rgba(255, 255, 255, var(--border-opacity));
    border-radius: 1rem;
    padding: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .hoverable:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px -10px rgba(139, 92, 246, 0.3);
    border-color: rgba(139, 92, 246, 0.3);
  }

  .interactive {
    cursor: pointer;
  }

  .interactive:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 20px 50px -10px rgba(139, 92, 246, 0.4);
  }

  .glowing {
    animation: glow 3s ease-in-out infinite;
  }

  @keyframes glow {
    0%, 100% { 
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
      border-color: rgba(139, 92, 246, 0.3);
    }
    50% { 
      box-shadow: 0 0 40px rgba(139, 92, 246, 0.5);
      border-color: rgba(139, 92, 246, 0.5);
    }
  }

  /* Subtle gradient overlay on hover */
  .glass-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%,
      rgba(139, 92, 246, 0.05) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .glass-card:hover::before {
    opacity: 1;
  }
</style> 