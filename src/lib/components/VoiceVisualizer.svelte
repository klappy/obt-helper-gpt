<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { spring } from 'svelte/motion';
	
	export let isActive = false;
	export let variant: 'bars' | 'wave' | 'orb' | 'rings' = 'bars';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let color = 'var(--color-primary)';
	export let backgroundColor = 'var(--surface-subtle)';
	
	// Create springs for each visualization bar
	const bars = Array(5).fill(0).map(() => 
		spring(0.2, { stiffness: 0.1, damping: 0.2 })
	);
	
	const orbScale = spring(1, { stiffness: 0.05, damping: 0.3 });
	const orbGlow = spring(0, { stiffness: 0.1, damping: 0.3 });
	
	let animationFrame: number;
	let phase = 0;
	
	const sizeConfig = {
		sm: { container: 60, barWidth: 3, barGap: 2 },
		md: { container: 80, barWidth: 4, barGap: 3 },
		lg: { container: 100, barWidth: 5, barGap: 4 }
	};
	
	function animateBars() {
		if (!isActive) {
			// Reset to idle state
			bars.forEach(bar => bar.set(0.2));
			return;
		}
		
		// Simulate audio levels with sine waves
		bars.forEach((bar, i) => {
			const offset = i * 0.2;
			const level = Math.abs(Math.sin(phase + offset)) * 0.8 + 0.2;
			const randomness = Math.random() * 0.2;
			bar.set(level + randomness);
		});
		
		phase += 0.15;
		animationFrame = requestAnimationFrame(animateBars);
	}
	
	function animateWave() {
		if (!isActive) {
			phase = 0;
			return;
		}
		
		phase += 0.05;
		animationFrame = requestAnimationFrame(animateWave);
	}
	
	function animateOrb() {
		if (!isActive) {
			$orbScale = 1;
			$orbGlow = 0;
			return;
		}
		
		// Pulsing orb effect
		const pulse = Math.sin(phase) * 0.2 + 1;
		const glow = Math.abs(Math.sin(phase * 2)) * 0.8 + 0.2;
		
		$orbScale = pulse;
		$orbGlow = glow;
		
		phase += 0.08;
		animationFrame = requestAnimationFrame(animateOrb);
	}
	
	function animateRings() {
		if (!isActive) {
			phase = 0;
			return;
		}
		
		phase += 0.03;
		animationFrame = requestAnimationFrame(animateRings);
	}
	
	function startAnimation() {
		phase = 0;
		
		switch (variant) {
			case 'bars':
				animateBars();
				break;
			case 'wave':
				animateWave();
				break;
			case 'orb':
				animateOrb();
				break;
			case 'rings':
				animateRings();
				break;
		}
	}
	
	function stopAnimation() {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
		
		// Gracefully return to idle state
		switch (variant) {
			case 'bars':
				bars.forEach(bar => bar.set(0.2));
				break;
			case 'orb':
				$orbScale = 1;
				$orbGlow = 0;
				break;
		}
	}
	
	$: if (isActive) {
		startAnimation();
	} else {
		stopAnimation();
	}
	
	onDestroy(() => {
		stopAnimation();
	});
	
	$: config = sizeConfig[size];
</script>

<div 
	class="voice-visualizer voice-visualizer-{variant} voice-visualizer-{size}"
	style="
		--viz-color: {color};
		--viz-bg: {backgroundColor};
		width: {config.container}px;
		height: {config.container}px;
	"
	role="status"
	aria-label={isActive ? 'Recording audio' : 'Audio recorder idle'}
>
	{#if variant === 'bars'}
		<div class="bars-container">
			{#each bars as bar, i}
				<div 
					class="bar"
					style="
						height: {$bar * 100}%;
						width: {config.barWidth}px;
						margin: 0 {config.barGap / 2}px;
						transition-delay: {i * 20}ms;
					"
				/>
			{/each}
		</div>
		
	{:else if variant === 'wave'}
		<svg viewBox="0 0 100 100" class="wave-svg">
			<path
				d="
					M 10,50 
					Q 25,{50 - Math.sin(phase) * 20} 40,50 
					Q 55,{50 + Math.sin(phase + 1) * 20} 70,50
					Q 85,{50 - Math.sin(phase + 2) * 20} 100,50
				"
				fill="none"
				stroke="var(--viz-color)"
				stroke-width="3"
				stroke-linecap="round"
				opacity={isActive ? 1 : 0.3}
			/>
			<path
				d="
					M 0,50 
					Q 20,{50 + Math.sin(phase + Math.PI) * 15} 35,50 
					Q 50,{50 - Math.sin(phase + Math.PI + 1) * 15} 65,50
					Q 80,{50 + Math.sin(phase + Math.PI + 2) * 15} 100,50
				"
				fill="none"
				stroke="var(--viz-color)"
				stroke-width="2"
				stroke-linecap="round"
				opacity={isActive ? 0.6 : 0.2}
			/>
		</svg>
		
	{:else if variant === 'orb'}
		<div class="orb-container">
			<div 
				class="orb"
				style="
					transform: scale({$orbScale});
					box-shadow: 
						0 0 {20 * $orbGlow}px {5 * $orbGlow}px var(--viz-color),
						inset 0 0 {10 * $orbGlow}px var(--viz-color);
				"
			>
				<div class="orb-core" />
			</div>
		</div>
		
	{:else if variant === 'rings'}
		<div class="rings-container">
			{#each [0, 1, 2] as ring}
				<div 
					class="ring"
					style="
						animation-delay: {ring * 0.3}s;
						opacity: {isActive ? 1 : 0.2};
					"
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.voice-visualizer {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--viz-bg);
		border-radius: var(--radius-lg);
		position: relative;
		overflow: hidden;
		border: 1px solid var(--border-subtle);
		transition: all var(--animation-smooth);
	}
	
	/* Bars variant */
	.bars-container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 60%;
		gap: 0;
	}
	
	.bar {
		background: var(--viz-color);
		border-radius: var(--radius-sm);
		transition: height var(--animation-spring);
		min-height: 20%;
	}
	
	/* Wave variant */
	.wave-svg {
		width: 80%;
		height: 80%;
		transition: opacity var(--animation-smooth);
	}
	
	/* Orb variant */
	.orb-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.orb {
		width: 60%;
		height: 60%;
		background: var(--viz-color);
		border-radius: 50%;
		position: relative;
		transition: all var(--animation-spring);
		opacity: 0.8;
	}
	
	.orb-core {
		position: absolute;
		inset: 20%;
		background: var(--viz-bg);
		border-radius: 50%;
		opacity: 0.6;
	}
	
	/* Rings variant */
	.rings-container {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.ring {
		position: absolute;
		border: 2px solid var(--viz-color);
		border-radius: 50%;
		animation: ring-pulse 2s ease-out infinite;
	}
	
	.ring:nth-child(1) {
		width: 30%;
		height: 30%;
	}
	
	.ring:nth-child(2) {
		width: 50%;
		height: 50%;
	}
	
	.ring:nth-child(3) {
		width: 70%;
		height: 70%;
	}
	
	@keyframes ring-pulse {
		0% {
			transform: scale(0.8);
			opacity: 0;
		}
		50% {
			opacity: 1;
		}
		100% {
			transform: scale(1.2);
			opacity: 0;
		}
	}
	
	/* Dark mode adjustments */
	:global(.dark) .voice-visualizer {
		background: var(--surface-raised);
	}
	
	/* Active state */
	.voice-visualizer:global(.active) {
		box-shadow: var(--shadow-elevated);
		border-color: var(--viz-color);
	}
	
	/* Size variations */
	.voice-visualizer-sm {
		border-radius: var(--radius-md);
	}
	
	.voice-visualizer-lg {
		border-radius: var(--radius-xl);
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.bar {
			transition: none;
		}
		
		.ring {
			animation: none;
			opacity: 0.5;
		}
		
		.orb {
			transition: none;
			box-shadow: none !important;
		}
		
		.wave-svg path {
			d: path("M 10,50 L 90,50") !important;
		}
	}
	
	/* Loading state */
	.voice-visualizer:not(.active) {
		opacity: 0.8;
	}
</style>