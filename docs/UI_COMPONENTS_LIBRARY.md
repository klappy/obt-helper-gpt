# UI Component Library Specification 🎨

> Reusable components for the 2025 UI redesign

## 🧱 Core Components

### 1. GlassCard

```svelte
<!-- src/lib/components/ui/GlassCard.svelte -->
<script lang="ts">
  export let blur = 20;
  export let opacity = 0.1;
  export let borderOpacity = 0.2;
  export let hover = true;
  export let glow = false;
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
  }

  .hoverable:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px -10px rgba(139, 92, 246, 0.3);
    border-color: rgba(139, 92, 246, 0.3);
  }

  .glowing {
    animation: glow 3s ease-in-out infinite;
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
    50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.5); }
  }
</style>
```

### 2. MagneticButton

```svelte
<!-- src/lib/components/ui/MagneticButton.svelte -->
<script lang="ts">
  import { spring } from 'svelte/motion';

  let buttonEl: HTMLElement;
  let coords = spring({ x: 0, y: 0 }, {
    stiffness: 0.2,
    damping: 0.4
  });

  function handleMouseMove(e: MouseEvent) {
    if (!buttonEl) return;

    const rect = buttonEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distX = (e.clientX - centerX) * 0.3;
    const distY = (e.clientY - centerY) * 0.3;

    coords.set({ x: distX, y: distY });
  }

  function handleMouseLeave() {
    coords.set({ x: 0, y: 0 });
  }
</script>

<button
  bind:this={buttonEl}
  on:mousemove={handleMouseMove}
  on:mouseleave={handleMouseLeave}
  style="transform: translate({$coords.x}px, {$coords.y}px)"
  class="magnetic-button"
  {...$$restProps}
>
  <span class="button-content">
    <slot />
  </span>
</button>

<style>
  .magnetic-button {
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 9999px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .button-content {
    position: relative;
    z-index: 1;
  }

  .magnetic-button::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: inherit;
    opacity: 0;
    filter: blur(10px);
    transition: opacity 0.3s;
  }

  .magnetic-button:hover::before {
    opacity: 0.6;
  }
</style>
```

### 3. ParticleField

```svelte
<!-- src/lib/components/ui/ParticleField.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  export let active = false;
  export let count = 50;
  export let color = '#8b5cf6';

  let canvas: HTMLCanvasElement;
  let particles: Particle[] = [];

  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;

    constructor(w: number, h: number) {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
      this.life = Math.random();
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 0.01;

      if (this.life <= 0) {
        this.life = 1;
      }
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.globalAlpha = this.life;
      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y, 2, 2);
    }
  }

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;

    for (let i = 0; i < count; i++) {
      particles.push(new Particle(w, h));
    }

    function animate() {
      if (!active) {
        requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      requestAnimationFrame(animate);
    }

    animate();
  });
</script>

<canvas
  bind:this={canvas}
  class="particle-field"
  class:active
/>

<style>
  .particle-field {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.5s;
  }

  .particle-field.active {
    opacity: 1;
  }
</style>
```

### 4. TypewriterText

```svelte
<!-- src/lib/components/ui/TypewriterText.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  export let text = '';
  export let speed = 50;
  export let cursor = true;

  let displayText = '';
  let currentIndex = 0;

  onMount(() => {
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        displayText += text[currentIndex];
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  });
</script>

<span class="typewriter">
  {displayText}
  {#if cursor && currentIndex < text.length}
    <span class="cursor">|</span>
  {/if}
</span>

<style>
  .typewriter {
    font-family: 'SF Mono', 'Monaco', monospace;
  }

  .cursor {
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
</style>
```

### 5. LiquidButton

```svelte
<!-- src/lib/components/ui/LiquidButton.svelte -->
<script lang="ts">
  export let primary = true;
  export let size = 'medium';

  let isRippling = false;
  let rippleX = 0;
  let rippleY = 0;

  function handleClick(e: MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    rippleX = e.clientX - rect.left;
    rippleY = e.clientY - rect.top;
    isRippling = true;

    setTimeout(() => {
      isRippling = false;
    }, 600);
  }
</script>

<button
  class="liquid-button"
  class:primary
  class:secondary={!primary}
  class:{size}
  on:click={handleClick}
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
  }

  .primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .secondary {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .small { padding: 0.5rem 1rem; font-size: 0.875rem; }
  .medium { padding: 0.75rem 1.5rem; font-size: 1rem; }
  .large { padding: 1rem 2rem; font-size: 1.125rem; }

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
    animation: ripple 0.6s ease-out;
  }

  @keyframes ripple {
    to {
      width: 400px;
      height: 400px;
      opacity: 0;
    }
  }

  .liquid-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2);
  }

  .liquid-button:active {
    transform: translateY(0);
  }
</style>
```

### 6. AnimatedIcon

```svelte
<!-- src/lib/components/ui/AnimatedIcon.svelte -->
<script lang="ts">
  export let name: string;
  export let size = 24;
  export let animated = true;

  const icons = {
    send: {
      path: 'M2 21l21-9L2 3v7l15 2-15 2v7z',
      animation: 'fly'
    },
    mic: {
      path: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2',
      animation: 'pulse'
    },
    image: {
      path: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z M8.5 13.5l2.5 3L14.5 11l4.5 6',
      animation: 'fade'
    }
  };

  $: icon = icons[name] || icons.send;
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="animated-icon"
  class:animated
  class:animation-{icon.animation}
>
  <path d={icon.path} />
</svg>

<style>
  .animated-icon {
    transition: all 0.3s;
  }

  .animated.animation-fly {
    animation: fly 0.5s ease-out;
  }

  .animated.animation-pulse {
    animation: pulse 1s infinite;
  }

  .animated.animation-fade {
    animation: fade 0.3s ease-in-out;
  }

  @keyframes fly {
    from {
      transform: translateX(-10px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  @keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
```

### 7. GradientMesh

```svelte
<!-- src/lib/components/ui/GradientMesh.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  export let colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c'];
  export let speed = 0.002;

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    let time = 0;

    function animate() {
      const width = canvas.width = window.innerWidth;
      const height = canvas.height = window.innerHeight;

      // Create gradient mesh
      const gradient = ctx.createLinearGradient(0, 0, width, height);

      colors.forEach((color, i) => {
        const offset = (Math.sin(time + i) + 1) / 2;
        gradient.addColorStop(offset, color);
      });

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      time += speed;
      requestAnimationFrame(animate);
    }

    animate();
  });
</script>

<canvas
  bind:this={canvas}
  class="gradient-mesh"
/>

<style>
  .gradient-mesh {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.3;
    pointer-events: none;
    z-index: -1;
  }
</style>
```

### 8. LoadingSpinner

```svelte
<!-- src/lib/components/ui/LoadingSpinner.svelte -->
<script lang="ts">
  export let size = 40;
  export let color = '#8b5cf6';
</script>

<div class="spinner-container" style="width: {size}px; height: {size}px">
  <svg viewBox="0 0 50 50" class="spinner">
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke={color}
      stroke-width="3"
      stroke-linecap="round"
      stroke-dasharray="31.415, 31.415"
      transform="rotate(-90 25 25)"
    />
  </svg>
</div>

<style>
  .spinner-container {
    display: inline-block;
  }

  .spinner {
    animation: rotate 2s linear infinite;
  }

  .spinner circle {
    animation: dash 1.5s ease-in-out infinite;
  }

  @keyframes rotate {
    100% { transform: rotate(360deg); }
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
</style>
```

## 🎨 Theme Configuration

**File: `src/lib/styles/theme.css`**

```css
:root {
  /* Colors */
  --color-primary: #667eea;
  --color-primary-dark: #5a67d8;
  --color-secondary: #764ba2;
  --color-accent: #f093fb;
  --color-success: #48bb78;
  --color-warning: #ed8936;
  --color-error: #f56565;

  /* Dark mode colors */
  --color-bg-dark: #0a0a0b;
  --color-bg-dark-secondary: #1a1a1b;
  --color-text-dark: #e2e8f0;
  --color-text-dark-muted: #a0aec0;

  /* Glass effect */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: 20px;

  /* Animations */
  --transition-base: 0.2s ease;
  --transition-smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --shadow-glow: 0 0 20px rgba(139, 92, 246, 0.3);
}

/* Dark mode default */
body {
  background-color: var(--color-bg-dark);
  color: var(--color-text-dark);
}

/* Utility classes */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}

.glow {
  box-shadow: var(--shadow-glow);
}

.text-gradient {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

## 🚀 Usage Examples

### Creating a Tool Card

```svelte
<script>
  import GlassCard from '$lib/components/ui/GlassCard.svelte';
  import AnimatedIcon from '$lib/components/ui/AnimatedIcon.svelte';
  import ParticleField from '$lib/components/ui/ParticleField.svelte';

  let isHovered = false;
</script>

<GlassCard
  on:mouseenter={() => isHovered = true}
  on:mouseleave={() => isHovered = false}
  glow={isHovered}
>
  <div class="tool-content">
    <AnimatedIcon name="image" size={48} animated={isHovered} />
    <h3 class="text-gradient">AI Assistant</h3>
    <p>Your intelligent companion</p>
  </div>
  <ParticleField active={isHovered} />
</GlassCard>
```

### Creating an Interactive Button

```svelte
<script>
  import LiquidButton from '$lib/components/ui/LiquidButton.svelte';
  import AnimatedIcon from '$lib/components/ui/AnimatedIcon.svelte';
</script>

<LiquidButton on:click={handleSubmit} size="large">
  <AnimatedIcon name="send" />
  <span>Send Message</span>
</LiquidButton>
```

## 📦 Export Bundle

Create `src/lib/components/ui/index.ts`:

```typescript
export { default as GlassCard } from "./GlassCard.svelte";
export { default as MagneticButton } from "./MagneticButton.svelte";
export { default as ParticleField } from "./ParticleField.svelte";
export { default as TypewriterText } from "./TypewriterText.svelte";
export { default as LiquidButton } from "./LiquidButton.svelte";
export { default as AnimatedIcon } from "./AnimatedIcon.svelte";
export { default as GradientMesh } from "./GradientMesh.svelte";
export { default as LoadingSpinner } from "./LoadingSpinner.svelte";
```

---

This component library provides the building blocks for the 2025 UI transformation! 🎨✨
