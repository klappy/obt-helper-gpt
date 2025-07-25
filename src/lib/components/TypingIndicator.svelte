<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { spring } from 'svelte/motion';
	import { FloatingCard } from './ui/index.js';
	
	export let variant: 'dots' | 'wave' | 'pulse' | 'bounce' = 'wave';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let userName = 'Assistant';
	export let showName = true;
	export let animate = true;
	
	// Spring stores for smooth animations
	const dot1 = spring({ y: 0, scale: 1 }, { stiffness: 0.1, damping: 0.4 });
	const dot2 = spring({ y: 0, scale: 1 }, { stiffness: 0.1, damping: 0.4 });
	const dot3 = spring({ y: 0, scale: 1 }, { stiffness: 0.1, damping: 0.4 });
	
	let animationInterval: number;
	let mounted = false;
	
	const sizeConfig = {
		sm: { dot: 6, gap: 4, card: 'xs' },
		md: { dot: 8, gap: 6, card: 'sm' },
		lg: { dot: 10, gap: 8, card: 'md' }
	};
	
	// Different animation personalities
	const animations = {
		dots: () => {
			// Classic three dots appearing one by one
			const sequence = [
				() => { $dot1 = { y: 0, scale: 1.2 }; },
				() => { $dot1 = { y: 0, scale: 1 }; $dot2 = { y: 0, scale: 1.2 }; },
				() => { $dot2 = { y: 0, scale: 1 }; $dot3 = { y: 0, scale: 1.2 }; },
				() => { $dot3 = { y: 0, scale: 1 }; }
			];
			let step = 0;
			animationInterval = setInterval(() => {
				sequence[step % sequence.length]();
				step++;
			}, 300);
		},
		wave: () => {
			// Smooth wave motion
			let phase = 0;
			animationInterval = setInterval(() => {
				$dot1 = { y: Math.sin(phase) * 5, scale: 1 };
				$dot2 = { y: Math.sin(phase + 0.5) * 5, scale: 1 };
				$dot3 = { y: Math.sin(phase + 1) * 5, scale: 1 };
				phase += 0.2;
			}, 50);
		},
		pulse: () => {
			// All dots pulse together
			let scale = 1;
			let growing = true;
			animationInterval = setInterval(() => {
				if (growing) {
					scale += 0.05;
					if (scale >= 1.3) growing = false;
				} else {
					scale -= 0.05;
					if (scale <= 0.7) growing = true;
				}
				$dot1 = { y: 0, scale };
				$dot2 = { y: 0, scale };
				$dot3 = { y: 0, scale };
			}, 50);
		},
		bounce: () => {
			// Playful bounce
			const bounce = (dot: any, delay: number) => {
				setTimeout(() => {
					dot.set({ y: -8, scale: 1.1 });
					setTimeout(() => dot.set({ y: 0, scale: 1 }), 400);
				}, delay);
			};
			
			const runBounce = () => {
				bounce(dot1, 0);
				bounce(dot2, 200);
				bounce(dot3, 400);
			};
			
			runBounce();
			animationInterval = setInterval(runBounce, 1200);
		}
	};
	
	onMount(() => {
		mounted = true;
		if (animate) {
			animations[variant]();
		}
	});
	
	onDestroy(() => {
		if (animationInterval) {
			clearInterval(animationInterval);
		}
	});
	
	$: config = sizeConfig[size];
</script>

<div class="typing-indicator-wrapper" class:mounted>
	<FloatingCard 
		depth={1} 
		hover={false} 
		animate={false}
		padding={config.card}
		class="typing-indicator"
	>
		<div class="indicator-content">
			{#if showName}
				<span class="typing-name">{userName} is typing</span>
			{/if}
			<div 
				class="dots-container"
				style="gap: {config.gap}px"
			>
				<span 
					class="dot"
					style="
						width: {config.dot}px; 
						height: {config.dot}px;
						transform: translateY({$dot1.y}px) scale({$dot1.scale});
					"
				/>
				<span 
					class="dot"
					style="
						width: {config.dot}px; 
						height: {config.dot}px;
						transform: translateY({$dot2.y}px) scale({$dot2.scale});
					"
				/>
				<span 
					class="dot"
					style="
						width: {config.dot}px; 
						height: {config.dot}px;
						transform: translateY({$dot3.y}px) scale({$dot3.scale});
					"
				/>
			</div>
		</div>
	</FloatingCard>
</div>

<style>
	.typing-indicator-wrapper {
		display: inline-flex;
		opacity: 0;
		transform: translateY(10px);
		transition: all var(--animation-smooth);
	}
	
	.typing-indicator-wrapper.mounted {
		opacity: 1;
		transform: translateY(0);
	}
	
	:global(.typing-indicator) {
		background: var(--surface-base) !important;
		border: 1px solid var(--border-subtle) !important;
	}
	
	.indicator-content {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}
	
	.typing-name {
		font-size: var(--text-xs);
		color: var(--text-secondary);
		white-space: nowrap;
	}
	
	.dots-container {
		display: flex;
		align-items: center;
		height: 20px;
	}
	
	.dot {
		display: block;
		background: var(--text-tertiary);
		border-radius: 50%;
		transition: transform var(--animation-spring);
		will-change: transform;
	}
	
	/* Different personalities for different contexts */
	.typing-indicator-wrapper[data-mood="excited"] .dot {
		background: var(--color-primary);
	}
	
	.typing-indicator-wrapper[data-mood="thinking"] .dot {
		background: var(--color-secondary);
	}
	
	/* Dark mode */
	:global(.dark) .dot {
		background: var(--text-secondary);
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.dot {
			transform: none !important;
		}
		
		.typing-indicator-wrapper {
			transition: opacity 0.2s ease;
		}
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.typing-name {
			display: none;
		}
	}
	
	/* Loading state for when indicator appears/disappears */
	.typing-indicator-wrapper:not(.mounted) {
		pointer-events: none;
	}
</style>