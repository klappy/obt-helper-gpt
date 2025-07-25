<script lang="ts">
  export let size = 40;
  export let color = '#8b5cf6';
  export let thickness = 3;
  export let speed = 'normal'; // 'slow', 'normal', 'fast'
</script>

<div 
  class="spinner-container" 
  style="width: {size}px; height: {size}px"
  {...$$restProps}
>
  <svg 
    viewBox="0 0 50 50" 
    class="spinner"
    class:slow={speed === 'slow'}
    class:fast={speed === 'fast'}
  >
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke={color}
      stroke-width={thickness}
      stroke-linecap="round"
      stroke-dasharray="31.415, 31.415"
      transform="rotate(-90 25 25)"
    />
  </svg>
</div>

<style>
  .spinner-container {
    display: inline-block;
    position: relative;
  }

  .spinner {
    animation: rotate 2s linear infinite;
    width: 100%;
    height: 100%;
  }

  .spinner.slow {
    animation-duration: 3s;
  }

  .spinner.fast {
    animation-duration: 1s;
  }

  .spinner circle {
    animation: dash 1.5s ease-in-out infinite;
    filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.3));
  }

  .slow circle {
    animation-duration: 2.25s;
  }

  .fast circle {
    animation-duration: 0.75s;
  }

  @keyframes rotate {
    100% { 
      transform: rotate(360deg); 
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }

  /* Pulsing container effect */
  .spinner-container::before {
    content: '';
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
    animation: pulse-ring 2s ease-in-out infinite;
  }

  @keyframes pulse-ring {
    0%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.1;
    }
  }
</style> 