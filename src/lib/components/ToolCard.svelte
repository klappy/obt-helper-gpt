<script lang="ts">
	import { GlassCard, LiquidButton, AnimatedIcon } from './ui/index.js';
	import { createEventDispatcher } from 'svelte';
	
	export let tool: any;
	
	const dispatch = createEventDispatcher();
	let isHovered = false;

	function handleClick() {
		dispatch('click', { toolId: tool.id });
	}
</script>

<GlassCard 
	interactive={true}
	hover={true}
	glow={isHovered}
	on:mouseenter={() => isHovered = true}
	on:mouseleave={() => isHovered = false}
	on:click={handleClick}
	class="tool-card-modern"
>
	<!-- Floating icon with animation -->
	<div class="icon-container floating">
		<div class="icon-wrapper">
			<span class="tool-icon">{tool.icon}</span>
			<div class="icon-glow" class:active={isHovered}></div>
		</div>
	</div>

	<!-- Tool content -->
	<div class="tool-content">
		<h3 class="tool-title gradient-text-primary">
			{tool.name}
		</h3>
		<p class="tool-description">
			{tool.description}
		</p>
		
		<!-- Model badge with glassmorphism -->
		<div class="tool-meta">
			<span class="model-badge glass">
				<AnimatedIcon name="star" size={12} animated={isHovered} />
				{tool.model}
			</span>
		</div>
	</div>

	<!-- Action button -->
	<div class="tool-action">
		<LiquidButton primary size="small" on:click={handleClick}>
			<AnimatedIcon name="chat" size={16} animated={isHovered} />
			Start Chat
		</LiquidButton>
	</div>

	<!-- Hover effects -->
	{#if isHovered}
		<div class="neural-particles">
			{#each Array(8) as _, i}
				<div 
					class="particle" 
					style="
						--delay: {i * 0.1}s;
						--x: {Math.random() * 100}%;
						--y: {Math.random() * 100}%;
					"
				></div>
			{/each}
		</div>
	{/if}
</GlassCard>

<style>
	:global(.tool-card-modern) {
		min-height: 280px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;
		overflow: hidden;
		cursor: pointer;
	}

	.icon-container {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
		position: relative;
	}

	.icon-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.tool-icon {
		font-size: 2rem;
		z-index: 2;
		position: relative;
	}

	.icon-glow {
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		background: conic-gradient(from 180deg at 50% 50%, #ff006e, #8338ec, #3a86ff, #06ffb4, #ff006e);
		opacity: 0;
		filter: blur(8px);
		transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.icon-glow.active {
		opacity: 0.6;
		animation: pulse-glow 2s ease-in-out infinite;
	}

	.tool-content {
		flex: 1;
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.tool-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		line-height: 1.2;
	}

	.tool-description {
		color: #a0aec0;
		font-size: 0.875rem;
		line-height: 1.5;
		margin-bottom: 1rem;
	}

	.tool-meta {
		display: flex;
		justify-content: center;
		margin-bottom: 0.5rem;
	}

	.model-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		color: #a0aec0;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.tool-action {
		display: flex;
		justify-content: center;
	}

	/* Floating animation for icon */
	@keyframes float {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-8px); }
	}

	.floating {
		animation: float 3s ease-in-out infinite;
	}

	@keyframes pulse-glow {
		0%, 100% { 
			box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
			opacity: 0.6;
		}
		50% { 
			box-shadow: 0 0 40px rgba(139, 92, 246, 0.6);
			opacity: 1;
		}
	}

	/* Particle effects */
	.neural-particles {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
	}

	.particle {
		position: absolute;
		width: 2px;
		height: 2px;
		background: #667eea;
		border-radius: 50%;
		opacity: 0;
		animation: particle-float 2s ease-out infinite;
		animation-delay: var(--delay);
		left: var(--x);
		top: var(--y);
	}

	@keyframes particle-float {
		0% {
			opacity: 0;
			transform: scale(0);
		}
		50% {
			opacity: 1;
			transform: scale(1) translateY(-20px);
		}
		100% {
			opacity: 0;
			transform: scale(0) translateY(-40px);
		}
	}

	/* Responsive design */
	@media (max-width: 768px) {
		:global(.tool-card-modern) {
			min-height: 240px;
		}
		
		.tool-title {
			font-size: 1.125rem;
		}
		
		.tool-description {
			font-size: 0.8rem;
		}
		
		.icon-wrapper {
			width: 3rem;
			height: 3rem;
		}
		
		.tool-icon {
			font-size: 1.5rem;
		}
	}
</style> 