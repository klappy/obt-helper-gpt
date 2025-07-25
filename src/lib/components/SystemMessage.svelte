<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { SystemMessageType } from '$lib/types';
	
	export let message: string;
	export let type: SystemMessageType = 'info';
	export let timestamp: Date | null = null;
	export let icon = true;
	export let animate = true;
	
	const icons = {
		info: '📋',
		success: '✅',
		warning: '⚠️',
		error: '❌',
		connection: '🔗',
		disconnection: '🔌',
		user_joined: '👋',
		user_left: '👋',
		milestone: '🎉',
		security: '🔒'
	};
	
	const colors = {
		info: 'var(--text-tertiary)',
		success: 'var(--color-success)',
		warning: 'var(--color-warning)',
		error: 'var(--color-error)',
		connection: 'var(--color-primary)',
		disconnection: 'var(--text-secondary)',
		user_joined: 'var(--color-success)',
		user_left: 'var(--text-secondary)',
		milestone: 'var(--color-primary)',
		security: 'var(--color-secondary)'
	};
	
	function formatTime(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(date);
	}
</script>

<div 
	class="system-message"
	class:animate
	transition:fade={{ duration: animate ? 200 : 0 }}
	role="status"
	aria-live="polite"
>
	<div class="message-line" />
	<div class="message-content">
		{#if icon && icons[type]}
			<span 
				class="message-icon"
				style="color: {colors[type]}"
				aria-hidden="true"
			>
				{icons[type]}
			</span>
		{/if}
		<span class="message-text">
			{message}
		</span>
		{#if timestamp}
			<time 
				class="message-time"
				datetime={timestamp.toISOString()}
			>
				{formatTime(timestamp)}
			</time>
		{/if}
	</div>
	<div class="message-line" />
</div>

<style>
	.system-message {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md) 0;
		width: 100%;
		opacity: 0.8;
		transition: opacity var(--animation-smooth);
	}
	
	.system-message:hover {
		opacity: 1;
	}
	
	.system-message.animate {
		animation: subtle-fade-in var(--animation-smooth) ease-out;
	}
	
	.message-line {
		flex: 1;
		height: 1px;
		background: var(--border-subtle);
		opacity: 0.5;
	}
	
	.message-content {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-md);
		background: var(--surface-subtle);
		border-radius: var(--radius-full);
		border: 1px solid var(--border-subtle);
		white-space: nowrap;
		max-width: 80%;
	}
	
	.message-icon {
		font-size: var(--text-sm);
		line-height: 1;
		display: flex;
		align-items: center;
	}
	
	.message-text {
		font-size: var(--text-xs);
		color: var(--text-secondary);
		font-weight: 500;
		line-height: 1.4;
	}
	
	.message-time {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin-left: var(--spacing-xs);
		font-variant-numeric: tabular-nums;
	}
	
	/* Keyframes for subtle entrance */
	@keyframes subtle-fade-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 0.8;
			transform: scale(1);
		}
	}
	
	/* Dark mode adjustments */
	:global(.dark) .message-line {
		opacity: 0.3;
	}
	
	:global(.dark) .message-content {
		background: var(--surface-raised);
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.message-content {
			max-width: 90%;
			padding: var(--spacing-xs) var(--spacing-sm);
		}
		
		.message-text {
			font-size: var(--text-xs);
			white-space: normal;
			word-break: break-word;
		}
		
		.message-time {
			display: none;
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.system-message {
			animation: none;
		}
		
		.system-message.animate {
			opacity: 0.8;
		}
	}
	
	/* High contrast mode */
	@media (prefers-contrast: high) {
		.message-line {
			background: currentColor;
			opacity: 0.8;
		}
		
		.message-content {
			border-width: 2px;
		}
	}
	
	/* Print styles */
	@media print {
		.system-message {
			opacity: 1;
			page-break-inside: avoid;
		}
		
		.message-icon {
			display: none;
		}
	}
</style>