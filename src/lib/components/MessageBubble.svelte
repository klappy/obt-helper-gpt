<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FloatingCard } from './ui/index.js';
	
	export let message: {
		id: number;
		content: string;
		role: 'user' | 'assistant' | 'system';
		timestamp: Date;
		isRecall?: boolean;
		status?: 'sending' | 'sent' | 'delivered' | 'error';
		reactions?: Array<{ emoji: string; count: number; userReacted: boolean }>;
	};
	
	export let voiceEnabled = false;
	export let showTimestamp = true;
	export let animateIn = true;
	
	const dispatch = createEventDispatcher();
	
	let bubbleElement: HTMLDivElement;
	let isHovered = false;
	
	// Double tap for reactions
	let tapTimeout: number;
	function handleDoubleTap() {
		if (tapTimeout) {
			clearTimeout(tapTimeout);
			dispatch('react', { messageId: message.id });
			tapTimeout = 0;
		} else {
			tapTimeout = setTimeout(() => {
				tapTimeout = 0;
			}, 300);
		}
	}
	
	function handleSpeak() {
		dispatch('speak', { content: message.content });
	}
	
	function handleReaction(reaction: { emoji: string }) {
		dispatch('toggleReaction', { 
			messageId: message.id, 
			emoji: reaction.emoji 
		});
	}
</script>

<div 
	class="message-wrapper message-{message.role}"
	class:animate-in={animateIn}
>
	{#if message.role === 'system'}
		<!-- System messages are centered and subtle -->
		<div class="system-message">
			<span class="system-icon">ℹ️</span>
			<span class="system-text">{message.content}</span>
		</div>
	{:else}
		<!-- User and assistant messages -->
		<div 
			class="message-container"
			on:mouseenter={() => isHovered = true}
			on:mouseleave={() => isHovered = false}
		>
			{#if message.role === 'assistant'}
				<div class="avatar">
					<span class="avatar-emoji">🤖</span>
				</div>
			{/if}
			
			<div class="message-content">
				{#if message.isRecall}
					<div class="recall-indicator">
						<span class="recall-icon">🔍</span>
						<span class="recall-text">Conversation Recall</span>
					</div>
				{/if}
				
				<FloatingCard 
					depth={message.role === 'user' ? 2 : 1}
					hover={false}
					animate={false}
					class="message-bubble"
				>
					<div 
						bind:this={bubbleElement}
						class="bubble-content"
						on:dblclick={handleDoubleTap}
						on:touchstart={handleDoubleTap}
					>
						<p class="message-text">{message.content}</p>
					</div>
				</FloatingCard>
				
				{#if showTimestamp || (message.role === 'user' && message.status)}
					<div class="message-meta">
						{#if showTimestamp}
							<span class="timestamp">
								{message.timestamp.toLocaleTimeString([], { 
									hour: 'numeric', 
									minute: '2-digit' 
								})}
							</span>
						{/if}
						
						{#if message.role === 'user' && message.status}
							<span class="status status-{message.status}">
								{#if message.status === 'sending'}
									○
								{:else if message.status === 'sent'}
									✓
								{:else if message.status === 'delivered'}
									✓✓
								{:else if message.status === 'error'}
									!
								{/if}
							</span>
						{/if}
					</div>
				{/if}
				
				{#if message.reactions && message.reactions.length > 0}
					<div class="reactions">
						{#each message.reactions as reaction}
							<button
								class="reaction-pill"
								class:active={reaction.userReacted}
								on:click={() => handleReaction(reaction)}
							>
								<span class="reaction-emoji">{reaction.emoji}</span>
								<span class="reaction-count">{reaction.count}</span>
							</button>
						{/each}
					</div>
				{/if}
				
				{#if message.role === 'assistant' && voiceEnabled && isHovered}
					<button
						class="speak-button"
						on:click={handleSpeak}
						title="Speak this message"
						aria-label="Speak message"
					>
						🔊
					</button>
				{/if}
			</div>
			
			{#if message.role === 'user'}
				<div class="avatar">
					<span class="avatar-emoji">👤</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Message wrapper */
	.message-wrapper {
		margin-bottom: var(--spacing-6);
		opacity: 0;
		transform: translateY(20px);
		animation: messageIn var(--spring-smooth) forwards;
	}
	
	.message-wrapper.animate-in {
		animation-delay: 0.1s;
	}
	
	@keyframes messageIn {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* Alignment */
	.message-user {
		display: flex;
		justify-content: flex-end;
	}
	
	.message-assistant {
		display: flex;
		justify-content: flex-start;
	}
	
	.message-system {
		display: flex;
		justify-content: center;
	}
	
	/* System messages */
	.system-message {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--spacing-4);
		background: var(--surface-2);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		color: var(--text-secondary);
		box-shadow: var(--shadow-1);
	}
	
	.system-icon {
		font-size: 1rem;
	}
	
	/* Message container */
	.message-container {
		display: flex;
		align-items: flex-end;
		gap: var(--spacing-3);
		max-width: min(85%, 600px);
		position: relative;
	}
	
	/* Avatar */
	.avatar {
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		background: var(--surface-2);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-1);
		margin-bottom: var(--spacing-6);
	}
	
	.avatar-emoji {
		font-size: 1.25rem;
	}
	
	/* Message content */
	.message-content {
		position: relative;
		flex: 1;
		min-width: 0;
	}
	
	/* Recall indicator */
	.recall-indicator {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-1) var(--spacing-3);
		background: var(--info-bg);
		color: var(--info);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
		margin-bottom: var(--spacing-2);
	}
	
	/* Message bubble */
	:global(.message-bubble) {
		word-wrap: break-word;
		word-break: break-word;
		overflow-wrap: break-word;
	}
	
	.bubble-content {
		padding: var(--spacing-3) var(--spacing-4);
		position: relative;
	}
	
	.message-user :global(.message-bubble) {
		background: var(--primary);
		color: white;
	}
	
	.message-assistant :global(.message-bubble) {
		background: var(--surface-1);
		color: var(--text-primary);
	}
	
	.message-text {
		line-height: 1.5;
		white-space: pre-wrap;
		margin: 0;
	}
	
	/* Message meta */
	.message-meta {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		margin-top: var(--spacing-1);
		padding: 0 var(--spacing-2);
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
	
	.message-user .message-meta {
		justify-content: flex-end;
	}
	
	.status {
		font-weight: 600;
	}
	
	.status-delivered,
	.status-sent {
		color: var(--success);
	}
	
	.status-sending {
		color: var(--text-tertiary);
	}
	
	.status-error {
		color: var(--error);
	}
	
	/* Reactions */
	.reactions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-1);
		margin-top: var(--spacing-2);
		padding: 0 var(--spacing-2);
	}
	
	.reaction-pill {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-1) var(--spacing-2);
		background: var(--surface-1);
		border: 1px solid var(--surface-3);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--spring-bounce);
	}
	
	.reaction-pill:hover {
		background: var(--surface-2);
		transform: scale(1.05);
	}
	
	.reaction-pill.active {
		background: var(--primary-bg);
		border-color: var(--primary);
		color: var(--primary);
	}
	
	.reaction-count {
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	/* Speak button */
	.speak-button {
		position: absolute;
		bottom: var(--spacing-2);
		right: var(--spacing-2);
		padding: var(--spacing-1);
		background: var(--surface-2);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		opacity: 0;
		transition: all var(--spring-smooth);
		font-size: 0.875rem;
		box-shadow: var(--shadow-1);
	}
	
	.message-container:hover .speak-button {
		opacity: 1;
	}
	
	.speak-button:hover {
		background: var(--surface-3);
		transform: scale(1.1);
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.message-container {
			max-width: 90%;
		}
		
		.avatar {
			width: 1.75rem;
			height: 1.75rem;
		}
		
		.avatar-emoji {
			font-size: 1rem;
		}
		
		.bubble-content {
			padding: var(--spacing-2) var(--spacing-3);
		}
		
		.speak-button {
			display: none;
		}
	}
	
	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.message-assistant :global(.message-bubble) {
			background: var(--surface-1-dark);
		}
		
		.system-message {
			background: var(--surface-2-dark);
		}
	}
	
	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.message-wrapper {
			animation: none;
			opacity: 1;
			transform: none;
		}
		
		.reaction-pill,
		.speak-button {
			transition: none;
		}
	}
</style>