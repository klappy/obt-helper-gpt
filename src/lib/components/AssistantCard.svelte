<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FloatingCard } from './ui/index.js';
	
	export let assistant: {
		id: string;
		name: string;
		description: string;
		icon: string;
		model: string;
		type?: string;
		active?: boolean;
	};
	
	export let depth: 1 | 2 | 3 | 4 | 5 = 2;
	export let index = 0;
	
	const dispatch = createEventDispatcher();
	
	let isHovered = false;
	let isFocused = false;
	
	function handleClick() {
		dispatch('select', { assistantId: assistant.id });
	}
	
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}
</script>

<FloatingCard 
	{depth}
	hover={true}
	animate={true}
	delay={index * 50}
	class="assistant-card-wrapper"
>
	<button
		class="assistant-card"
		class:hovered={isHovered}
		class:focused={isFocused}
		on:click={handleClick}
		on:keydown={handleKeyDown}
		on:mouseenter={() => isHovered = true}
		on:mouseleave={() => isHovered = false}
		on:focus={() => isFocused = true}
		on:blur={() => isFocused = false}
		aria-label="Select {assistant.name} assistant"
		tabindex="0"
	>
		<!-- Icon -->
		<div class="icon-container">
			<span class="assistant-icon" aria-hidden="true">
				{assistant.icon}
			</span>
		</div>
		
		<!-- Content -->
		<div class="content">
			<h3 class="assistant-name">
				{assistant.name}
			</h3>
			
			<p class="assistant-description">
				{assistant.description}
			</p>
			
			<!-- Model Badge -->
			<div class="meta">
				<span class="model-badge">
					{assistant.model}
				</span>
				{#if assistant.type}
					<span class="type-badge">
						{assistant.type}
					</span>
				{/if}
			</div>
		</div>
		
		<!-- Hover State Indicator -->
		<div class="hover-indicator" aria-hidden="true">
			<span class="arrow">→</span>
		</div>
		
		<!-- Status Indicator -->
		{#if assistant.active !== undefined}
			<div class="status-indicator" class:active={assistant.active}>
				<span class="status-dot"></span>
			</div>
		{/if}
	</button>
</FloatingCard>

<style>
	:global(.assistant-card-wrapper) {
		height: 100%;
	}
	
	.assistant-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		width: 100%;
		height: 100%;
		padding: var(--spacing-8);
		background: transparent;
		border: none;
		cursor: pointer;
		color: inherit;
		font-family: inherit;
		position: relative;
		transition: all var(--spring-smooth);
	}
	
	/* Icon Container */
	.icon-container {
		margin-bottom: var(--spacing-6);
		position: relative;
	}
	
	.assistant-icon {
		display: block;
		font-size: 3.5rem;
		line-height: 1;
		transition: transform var(--spring-bounce);
		will-change: transform;
	}
	
	.assistant-card.hovered .assistant-icon {
		transform: scale(1.15) translateY(-4px) rotate(-5deg);
	}
	
	/* Content */
	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}
	
	.assistant-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--spacing-3);
		transition: color var(--spring-smooth);
	}
	
	.assistant-card.hovered .assistant-name {
		color: var(--primary);
	}
	
	.assistant-description {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-secondary);
		margin-bottom: var(--spacing-6);
		flex: 1;
		max-width: 280px;
	}
	
	/* Meta Information */
	.meta {
		display: flex;
		gap: var(--spacing-2);
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
	}
	
	.model-badge,
	.type-badge {
		padding: var(--spacing-1) var(--spacing-3);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
		transition: all var(--spring-smooth);
	}
	
	.model-badge {
		background: var(--primary-bg);
		color: var(--primary);
		border: 1px solid var(--primary);
	}
	
	.type-badge {
		background: var(--surface-2);
		color: var(--text-secondary);
		border: 1px solid var(--surface-3);
	}
	
	.assistant-card.hovered .model-badge {
		background: var(--primary);
		color: white;
		transform: scale(1.05);
	}
	
	/* Hover Indicator */
	.hover-indicator {
		position: absolute;
		right: var(--spacing-4);
		top: 50%;
		transform: translateY(-50%);
		opacity: 0;
		transition: all var(--spring-bounce);
	}
	
	.assistant-card.hovered .hover-indicator {
		opacity: 1;
		transform: translateY(-50%) translateX(4px);
	}
	
	.arrow {
		font-size: 1.5rem;
		color: var(--primary);
		font-weight: 700;
	}
	
	/* Status Indicator */
	.status-indicator {
		position: absolute;
		top: var(--spacing-4);
		right: var(--spacing-4);
	}
	
	.status-dot {
		display: block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--surface-3);
		transition: all var(--spring-smooth);
	}
	
	.status-indicator.active .status-dot {
		background: var(--success);
		box-shadow: 0 0 0 3px var(--success-bg);
		animation: pulse 2s ease-in-out infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.8;
		}
	}
	
	/* Focus States */
	.assistant-card:focus {
		outline: none;
	}
	
	.assistant-card.focused {
		box-shadow: inset 0 0 0 3px var(--focus-ring);
		border-radius: var(--radius-xl);
	}
	
	/* Active/Selected State */
	.assistant-card:active {
		transform: scale(0.98);
	}
	
	/* Responsive */
	@media (max-width: 640px) {
		.assistant-card {
			padding: var(--spacing-6);
		}
		
		.assistant-icon {
			font-size: 2.5rem;
		}
		
		.assistant-name {
			font-size: 1.125rem;
		}
		
		.assistant-description {
			font-size: 0.8125rem;
		}
		
		.hover-indicator {
			display: none;
		}
	}
	
	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.assistant-icon,
		.assistant-card,
		.model-badge,
		.hover-indicator {
			transition: none;
		}
		
		.assistant-card.hovered .assistant-icon {
			transform: none;
		}
		
		@keyframes pulse {
			to { transform: none; }
		}
	}
	
	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.model-badge {
			border-width: 2px;
		}
		
		.assistant-card.focused {
			box-shadow: inset 0 0 0 4px var(--focus-ring);
		}
	}
	
	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.model-badge {
			background: var(--primary-bg-dark);
			border-color: var(--primary-dark);
		}
		
		.type-badge {
			background: var(--surface-2-dark);
			border-color: var(--surface-3-dark);
		}
	}
</style>