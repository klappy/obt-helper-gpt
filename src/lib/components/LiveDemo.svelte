<script lang="ts">
	import { onMount } from 'svelte';
	
	export let messages = [
		{ type: 'user', text: 'Help me write a professional email', delay: 200 },
		{ type: 'assistant', text: "I'd be happy to help! What's the purpose of your email?", delay: 800 }
	];
	export let autoPlay = true;
	export let loop = true;
	
	let visibleMessages: typeof messages = [];
	let currentIndex = 0;
	let animationTimeout: number;
	
	onMount(() => {
		if (autoPlay) {
			startAnimation();
		}
		
		return () => {
			if (animationTimeout) {
				clearTimeout(animationTimeout);
			}
		};
	});
	
	function startAnimation() {
		visibleMessages = [];
		currentIndex = 0;
		showNextMessage();
	}
	
	function showNextMessage() {
		if (currentIndex < messages.length) {
			visibleMessages = [...visibleMessages, messages[currentIndex]];
			const delay = messages[currentIndex].delay || 500;
			currentIndex++;
			
			animationTimeout = setTimeout(() => {
				showNextMessage();
			}, delay);
		} else if (loop) {
			// Reset and loop
			animationTimeout = setTimeout(() => {
				startAnimation();
			}, 2000);
		}
	}
	
	export function reset() {
		if (animationTimeout) {
			clearTimeout(animationTimeout);
		}
		visibleMessages = [];
		currentIndex = 0;
	}
	
	export function play() {
		reset();
		startAnimation();
	}
</script>

<div class="live-demo">
	<div class="demo-messages">
		{#each visibleMessages as message, i}
			<div 
				class="demo-message demo-message-{message.type}"
				style="animation-delay: {i * 0.1}s"
			>
				{message.text}
			</div>
		{/each}
	</div>
</div>

<style>
	.live-demo {
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
	}
	
	.demo-messages {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
		padding: var(--spacing-4);
		background: var(--surface-1);
		border-radius: var(--radius-xl);
		min-height: 120px;
		box-shadow: var(--shadow-1);
	}
	
	.demo-message {
		padding: var(--spacing-3) var(--spacing-4);
		border-radius: var(--radius-xl);
		font-size: 0.875rem;
		max-width: 80%;
		animation: messageAppear var(--spring-smooth) both;
		line-height: 1.4;
	}
	
	.demo-message-user {
		align-self: flex-end;
		background: #25D366;
		color: white;
		border-bottom-right-radius: var(--radius-sm);
	}
	
	.demo-message-assistant {
		align-self: flex-start;
		background: var(--surface-2);
		color: var(--text-primary);
		border-bottom-left-radius: var(--radius-sm);
	}
	
	@keyframes messageAppear {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	
	/* Add typing indicator */
	.demo-message-typing {
		align-self: flex-start;
		background: var(--surface-2);
		padding: var(--spacing-3) var(--spacing-5);
	}
	
	.demo-message-typing::after {
		content: '•••';
		animation: typing 1.5s infinite;
		letter-spacing: 0.2em;
		color: var(--text-secondary);
	}
	
	@keyframes typing {
		0%, 60%, 100% { opacity: 0.3; }
		30% { opacity: 1; }
	}
	
	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.demo-messages {
			background: var(--surface-1-dark);
		}
		
		.demo-message-assistant {
			background: var(--surface-2-dark);
		}
	}
	
	/* Mobile */
	@media (max-width: 640px) {
		.demo-messages {
			padding: var(--spacing-3);
		}
		
		.demo-message {
			font-size: 0.8125rem;
		}
	}
</style>