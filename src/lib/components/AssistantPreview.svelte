<script>
	import { onMount, onDestroy } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade, scale } from 'svelte/transition';
	import { FloatingCard } from '$lib/components/ui/index.js';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	import TypingIndicator from '$lib/components/TypingIndicator.svelte';
	import SystemMessage from '$lib/components/SystemMessage.svelte';
	
	export let config = {
		modules: [],
		personality: {},
		name: 'Assistant',
		description: ''
	};
	
	export let previewMode = 'conversation'; // 'conversation', 'response', 'personality'
	
	// Demo conversation states
	let messages = [];
	let isTyping = false;
	let currentPersonality = config.personality || {};
	
	// Animation springs
	const avatarScale = spring(1, { stiffness: 0.3, damping: 0.7 });
	const contentScale = spring(0.95, { stiffness: 0.2, damping: 0.8 });
	
	// Sample messages based on personality
	const sampleQuestions = [
		"How do I get started with this project?",
		"Can you explain this concept to me?",
		"What's the best approach for this problem?",
		"I'm stuck, can you help?",
		"Tell me more about this feature."
	];
	
	// Generate response based on personality settings
	function generateResponse(question) {
		const p = currentPersonality;
		const responses = [];
		
		// Base response structure
		if (p.formality > 70) {
			responses.push("Thank you for your inquiry.");
		} else if (p.friendliness > 70) {
			responses.push("Hey there! Great question!");
		} else {
			responses.push("Sure, let me help with that.");
		}
		
		// Main content based on creativity and verbosity
		if (p.creativity > 70) {
			responses.push("Think of it like a garden - you plant the seeds (your initial setup), water them regularly (maintain your code), and watch them grow into something beautiful!");
		} else if (p.verbosity > 70) {
			responses.push("There are several important aspects to consider here. First, you'll want to understand the fundamental concepts. Then, we can explore the implementation details step by step.");
		} else {
			responses.push("Start with the basics, then build up from there.");
		}
		
		// Add humor if applicable
		if (p.humor > 70) {
			responses.push("And remember, the only bad question is the one that crashes production! 😄");
		}
		
		// Add empathy if high
		if (p.empathy > 70) {
			responses.push("I understand this can be challenging at first. You're doing great by asking questions!");
		}
		
		// Closing based on patience
		if (p.patience > 70) {
			responses.push("Take your time, and feel free to ask follow-up questions. I'm here to help!");
		} else if (p.assertiveness > 70) {
			responses.push("Let's dive in and get this sorted out.");
		}
		
		return responses.join(" ");
	}
	
	// Simulate conversation
	function startConversation() {
		messages = [];
		simulateNextMessage();
	}
	
	function simulateNextMessage() {
		if (messages.length >= 6) return; // Limit conversation length
		
		if (messages.length % 2 === 0) {
			// User message
			const question = sampleQuestions[Math.floor(messages.length / 2)];
			messages = [...messages, {
				id: Date.now(),
				role: 'user',
				content: question,
				timestamp: new Date()
			}];
			
			// Simulate assistant typing
			setTimeout(() => {
				isTyping = true;
				setTimeout(() => {
					isTyping = false;
					const response = generateResponse(question);
					messages = [...messages, {
						id: Date.now(),
						role: 'assistant',
						content: response,
						timestamp: new Date()
					}];
					
					// Continue conversation
					setTimeout(() => simulateNextMessage(), 2000);
				}, 1500 + Math.random() * 1000);
			}, 500);
		}
	}
	
	// Module capabilities display
	function getActiveCapabilities() {
		const capabilities = [];
		
		(config.modules || []).forEach(module => {
			switch(module.type) {
				case 'nlp':
					capabilities.push({ icon: '🧠', label: 'Natural Language' });
					break;
				case 'knowledge':
					capabilities.push({ icon: '📚', label: 'Knowledge Base' });
					break;
				case 'reasoning':
					capabilities.push({ icon: '🤔', label: 'Logic & Reasoning' });
					break;
				case 'creativity':
					capabilities.push({ icon: '🎨', label: 'Creative Tasks' });
					break;
				case 'memory':
					capabilities.push({ icon: '💭', label: 'Context Memory' });
					break;
				case 'tools':
					capabilities.push({ icon: '🔧', label: 'Tool Usage' });
					break;
				case 'web':
					capabilities.push({ icon: '🌐', label: 'Web Search' });
					break;
				case 'code':
					capabilities.push({ icon: '💻', label: 'Code Generation' });
					break;
			}
		});
		
		return capabilities;
	}
	
	// Personality traits visualization
	function getPersonalityDescription() {
		const p = currentPersonality;
		const traits = [];
		
		if (p.friendliness > 70) traits.push('warm');
		else if (p.friendliness < 30) traits.push('reserved');
		
		if (p.formality > 70) traits.push('professional');
		else if (p.formality < 30) traits.push('casual');
		
		if (p.creativity > 70) traits.push('creative');
		if (p.humor > 70) traits.push('humorous');
		if (p.empathy > 70) traits.push('empathetic');
		if (p.verbosity > 70) traits.push('detailed');
		else if (p.verbosity < 30) traits.push('concise');
		
		return traits.join(', ') || 'balanced';
	}
	
	// Update when config changes
	$: if (config.personality) {
		currentPersonality = config.personality;
		contentScale.set(0.9);
		setTimeout(() => contentScale.set(1), 100);
	}
	
	$: if (config.modules) {
		avatarScale.set(0.8);
		setTimeout(() => avatarScale.set(1), 200);
	}
	
	// Preview mode handlers
	function setPreviewMode(mode) {
		previewMode = mode;
		if (mode === 'conversation') {
			startConversation();
		}
	}
	
	onMount(() => {
		if (previewMode === 'conversation') {
			startConversation();
		}
	});
</script>

<div class="assistant-preview">
	<!-- Preview Mode Selector -->
	<div class="preview-controls">
		<button
			class="mode-button"
			class:active={previewMode === 'conversation'}
			on:click={() => setPreviewMode('conversation')}
		>
			💬 Conversation
		</button>
		<button
			class="mode-button"
			class:active={previewMode === 'response'}
			on:click={() => setPreviewMode('response')}
		>
			📝 Response Style
		</button>
		<button
			class="mode-button"
			class:active={previewMode === 'personality'}
			on:click={() => setPreviewMode('personality')}
		>
			🎭 Personality
		</button>
	</div>
	
	<!-- Preview Content -->
	<FloatingCard depth={2} padding="none" animate={true}>
		<div class="preview-container" style="transform: scale({$contentScale})">
			<!-- Assistant Header -->
			<div class="assistant-header">
				<div class="assistant-avatar" style="transform: scale({$avatarScale})">
					<span class="avatar-emoji">
						{#if config.modules?.some(m => m.type === 'creativity')}
							🎨
						{:else if config.modules?.some(m => m.type === 'code')}
							💻
						{:else if config.modules?.some(m => m.type === 'knowledge')}
							📚
						{:else}
							🤖
						{/if}
					</span>
				</div>
				<div class="assistant-info">
					<h3 class="assistant-name">{config.name || 'AI Assistant'}</h3>
					<p class="assistant-personality">{getPersonalityDescription()}</p>
				</div>
			</div>
			
			<!-- Preview Modes -->
			{#if previewMode === 'conversation'}
				<div class="conversation-preview">
					<SystemMessage type="info">
						Live preview of assistant personality in action
					</SystemMessage>
					
					<div class="messages">
						{#each messages as message (message.id)}
							<div transition:scale={{ duration: 300 }}>
								<MessageBubble {...message} />
							</div>
						{/each}
						
						{#if isTyping}
							<div transition:fade>
								<TypingIndicator variant="dots" userName={config.name} />
							</div>
						{/if}
					</div>
					
					{#if messages.length === 0}
						<div class="empty-state">
							<p>Starting conversation simulation...</p>
						</div>
					{/if}
				</div>
			{:else if previewMode === 'response'}
				<div class="response-preview">
					<div class="sample-response">
						<h4>Sample Response Style:</h4>
						<FloatingCard depth={1} padding="md">
							<p class="response-text">
								{generateResponse("Can you help me understand this concept?")}
							</p>
						</FloatingCard>
					</div>
					
					<div class="response-metrics">
						<div class="metric">
							<span class="metric-label">Tone</span>
							<span class="metric-value">{getPersonalityDescription()}</span>
						</div>
						<div class="metric">
							<span class="metric-label">Length</span>
							<span class="metric-value">
								{currentPersonality.verbosity > 70 ? 'Detailed' : 
								 currentPersonality.verbosity < 30 ? 'Concise' : 'Moderate'}
							</span>
						</div>
						<div class="metric">
							<span class="metric-label">Style</span>
							<span class="metric-value">
								{currentPersonality.formality > 70 ? 'Formal' : 
								 currentPersonality.formality < 30 ? 'Casual' : 'Balanced'}
							</span>
						</div>
					</div>
				</div>
			{:else if previewMode === 'personality'}
				<div class="personality-preview">
					<div class="capabilities">
						<h4>Active Capabilities:</h4>
						<div class="capability-list">
							{#each getActiveCapabilities() as capability}
								<div class="capability-badge" transition:scale>
									<span class="capability-icon">{capability.icon}</span>
									<span class="capability-label">{capability.label}</span>
								</div>
							{/each}
							
							{#if getActiveCapabilities().length === 0}
								<p class="no-capabilities">No modules configured yet</p>
							{/if}
						</div>
					</div>
					
					<div class="personality-traits">
						<h4>Personality Traits:</h4>
						<div class="trait-bars">
							{#each Object.entries(currentPersonality) as [trait, value]}
								<div class="trait-bar">
									<span class="trait-name">{trait}</span>
									<div class="trait-progress">
										<div 
											class="trait-fill"
											style="width: {value}%; background: {
												value > 70 ? 'var(--color-success-base)' :
												value > 30 ? 'var(--color-warning-base)' :
												'var(--color-primary-base)'
											}"
										></div>
									</div>
									<span class="trait-percent">{value}%</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</FloatingCard>
	
	<!-- Refresh Button -->
	{#if previewMode === 'conversation'}
		<button
			class="refresh-button"
			on:click={startConversation}
			title="Restart conversation"
		>
			↻ Restart
		</button>
	{/if}
</div>

<style>
	.assistant-preview {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
		position: relative;
	}
	
	/* Preview Controls */
	.preview-controls {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--color-background-secondary);
		border-radius: var(--radius-md);
	}
	
	.mode-button {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: var(--color-background-primary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.mode-button:hover {
		background: var(--color-background-tertiary);
		border-color: var(--color-border-primary);
	}
	
	.mode-button.active {
		background: var(--color-primary-subtle);
		border-color: var(--color-primary-base);
		color: var(--color-primary-base);
		font-weight: 500;
	}
	
	/* Preview Container */
	.preview-container {
		padding: 1.5rem;
		transition: transform var(--duration-medium);
		height: 100%;
		overflow-y: auto;
	}
	
	/* Assistant Header */
	.assistant-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border-secondary);
	}
	
	.assistant-avatar {
		width: 3rem;
		height: 3rem;
		background: var(--color-primary-subtle);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform var(--duration-medium);
	}
	
	.avatar-emoji {
		font-size: 1.5rem;
	}
	
	.assistant-info {
		flex: 1;
	}
	
	.assistant-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 0.25rem 0;
	}
	
	.assistant-personality {
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
		margin: 0;
		text-transform: capitalize;
	}
	
	/* Conversation Preview */
	.conversation-preview {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
	}
	
	.messages {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 0.5rem;
	}
	
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--color-text-tertiary);
		font-style: italic;
	}
	
	/* Response Preview */
	.response-preview {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.sample-response h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 0 0 0.75rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.response-text {
		line-height: 1.6;
		color: var(--color-text-primary);
		margin: 0;
	}
	
	.response-metrics {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	
	.metric {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem;
		background: var(--color-background-secondary);
		border-radius: var(--radius-sm);
	}
	
	.metric-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-tertiary);
		text-transform: uppercase;
	}
	
	.metric-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}
	
	/* Personality Preview */
	.personality-preview {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	.capabilities h4,
	.personality-traits h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 0 0 0.75rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.capability-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	
	.capability-badge {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.75rem;
		background: var(--color-primary-subtle);
		border: 1px solid var(--color-primary-base);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
	}
	
	.capability-icon {
		font-size: 1rem;
	}
	
	.capability-label {
		font-weight: 500;
		color: var(--color-primary-base);
	}
	
	.no-capabilities {
		color: var(--color-text-tertiary);
		font-style: italic;
		margin: 0;
	}
	
	.trait-bars {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.trait-bar {
		display: grid;
		grid-template-columns: 100px 1fr 40px;
		align-items: center;
		gap: 0.75rem;
	}
	
	.trait-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		text-transform: capitalize;
	}
	
	.trait-progress {
		height: 0.5rem;
		background: var(--color-background-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
		border: 1px solid var(--color-border-secondary);
	}
	
	.trait-fill {
		height: 100%;
		transition: width var(--duration-medium);
	}
	
	.trait-percent {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-tertiary);
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	
	/* Refresh Button */
	.refresh-button {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		padding: 0.5rem 1rem;
		background: var(--color-background-primary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--duration-fast);
		box-shadow: var(--shadow-subtle);
	}
	
	.refresh-button:hover {
		background: var(--color-background-secondary);
		border-color: var(--color-border-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-standard);
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.preview-controls {
			flex-direction: column;
		}
		
		.response-metrics {
			grid-template-columns: 1fr;
		}
		
		.trait-bar {
			grid-template-columns: 80px 1fr 35px;
			font-size: 0.75rem;
		}
	}
</style>