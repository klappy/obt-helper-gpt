<script lang="ts">
	import { onMount } from 'svelte';
	import { getActiveTools } from '$lib/stores/tools.js';
	import ChatInterface from '$lib/components/ChatInterface.svelte';
	import VoiceControls from '$lib/components/VoiceControls.svelte';
	
	let mounted = false;
	let selectedTool = getActiveTools()[0];
	let voiceEnabled = false;
	
	const tools = getActiveTools();
	
	onMount(() => {
		mounted = true;
		
		// Get tool from URL if provided
		const urlParams = new URLSearchParams(window.location.search);
		const toolId = urlParams.get('tool');
		if (toolId) {
			const tool = tools.find(t => t.id === toolId);
			if (tool) selectedTool = tool;
		}
	});
	
	function handleVoiceToggle() {
		voiceEnabled = !voiceEnabled;
	}
</script>

<svelte:head>
	<title>Demo - OBT Helper GPT</title>
	<meta name="description" content="Try our AI assistants in your browser">
</svelte:head>

{#if mounted}
<div class="demo-page">
	<div class="demo-container">
		<!-- Tool Selection -->
		<div class="tool-selector">
			<h2>Select an AI Assistant</h2>
			<div class="tool-tabs">
				{#each tools as tool}
					<button
						class="tool-tab"
						class:active={selectedTool.id === tool.id}
						on:click={() => selectedTool = tool}
					>
						<span class="tool-icon">{tool.icon}</span>
						<span class="tool-name">{tool.name}</span>
					</button>
				{/each}
			</div>
			<p class="tool-description">{selectedTool.description}</p>
		</div>
		
		<!-- Chat Interface -->
		<div class="chat-container">
			<ChatInterface {selectedTool} />
			
			<!-- Voice Controls -->
			{#if voiceEnabled}
				<div class="voice-section">
					<VoiceControls />
				</div>
			{/if}
			
			<!-- Voice Toggle -->
			<button 
				class="voice-toggle"
				class:active={voiceEnabled}
				on:click={handleVoiceToggle}
				title="Toggle voice controls"
			>
				🎤
			</button>
		</div>
		
		<!-- Help Section -->
		<div class="help-section">
			<h3>How to use:</h3>
			<ul>
				<li>Select an AI assistant above</li>
				<li>Type your message and press Enter</li>
				<li>Get instant AI-powered responses</li>
				<li>Click 🎤 to use voice input (optional)</li>
			</ul>
			
			<div class="whatsapp-cta">
				<p><strong>Want this in WhatsApp?</strong></p>
				<a href="/" class="cta-button">Connect WhatsApp →</a>
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	/* Demo Page */
	.demo-page {
		min-height: 100vh;
		background: #ffffff;
		padding: 2rem 0;
	}
	
	.demo-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}
	
	/* Tool Selector */
	.tool-selector {
		margin-bottom: 2rem;
		text-align: center;
	}
	
	.tool-selector h2 {
		font-size: 1.75rem;
		font-weight: 900;
		margin-bottom: 1rem;
	}
	
	.tool-tabs {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}
	
	.tool-tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #ffffff;
		border: 2px solid #000000;
		border-radius: 8px;
		font-family: inherit;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.tool-tab:hover {
		background: #f5f5f5;
		transform: translateY(-1px);
	}
	
	.tool-tab.active {
		background: #000000;
		color: #ffffff;
	}
	
	.tool-icon {
		font-size: 1.5rem;
	}
	
	.tool-description {
		color: #666666;
		max-width: 600px;
		margin: 0 auto;
	}
	
	/* Chat Container */
	.chat-container {
		position: relative;
		background: #f5f5f5;
		border: 2px solid #000000;
		border-radius: 12px;
		height: 500px;
		margin-bottom: 2rem;
		overflow: hidden;
	}
	
	/* Voice Section */
	.voice-section {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: #ffffff;
		border-top: 2px solid #000000;
		padding: 1rem;
	}
	
	/* Voice Toggle */
	.voice-toggle {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: #ffffff;
		border: 2px solid #000000;
		font-size: 1.5rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.voice-toggle:hover {
		background: #f5f5f5;
		transform: scale(1.05);
	}
	
	.voice-toggle.active {
		background: #000000;
		color: #ffffff;
	}
	
	/* Help Section */
	.help-section {
		background: #f5f5f5;
		padding: 2rem;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}
	
	.help-section h3 {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}
	
	.help-section ul {
		margin-left: 1.5rem;
		margin-bottom: 2rem;
		color: #666666;
	}
	
	.help-section li {
		margin-bottom: 0.5rem;
	}
	
	/* WhatsApp CTA */
	.whatsapp-cta {
		text-align: center;
		padding: 1.5rem;
		background: #ffffff;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}
	
	.whatsapp-cta p {
		margin-bottom: 1rem;
	}
	
	.cta-button {
		display: inline-block;
		padding: 0.75rem 2rem;
		background: #000000;
		color: #ffffff;
		text-decoration: none;
		font-weight: 700;
		border-radius: 8px;
		transition: all 0.2s;
	}
	
	.cta-button:hover {
		background: #333333;
		transform: translateY(-1px);
	}
	
	/* Mobile */
	@media (max-width: 768px) {
		.demo-container {
			padding: 0 1rem;
		}
		
		.tool-tabs {
			gap: 0.5rem;
		}
		
		.tool-tab {
			padding: 0.5rem 1rem;
			font-size: 0.875rem;
		}
		
		.tool-icon {
			font-size: 1.25rem;
		}
		
		.chat-container {
			height: 400px;
		}
		
		.help-section {
			padding: 1.5rem;
		}
	}
	
	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.demo-page {
			background: #000000;
			color: #ffffff;
		}
		
		.tool-tab {
			background: #000000;
			border-color: #ffffff;
			color: #ffffff;
		}
		
		.tool-tab:hover {
			background: #1a1a1a;
		}
		
		.tool-tab.active {
			background: #ffffff;
			color: #000000;
		}
		
		.tool-description {
			color: #999999;
		}
		
		.chat-container {
			background: #1a1a1a;
			border-color: #ffffff;
		}
		
		.voice-section {
			background: #000000;
			border-top-color: #ffffff;
		}
		
		.voice-toggle {
			background: #000000;
			border-color: #ffffff;
			color: #ffffff;
		}
		
		.voice-toggle:hover {
			background: #1a1a1a;
		}
		
		.voice-toggle.active {
			background: #ffffff;
			color: #000000;
		}
		
		.help-section {
			background: #1a1a1a;
			border-color: #333333;
		}
		
		.help-section ul {
			color: #999999;
		}
		
		.whatsapp-cta {
			background: #000000;
			border-color: #333333;
		}
		
		.cta-button {
			background: #ffffff;
			color: #000000;
		}
		
		.cta-button:hover {
			background: #e0e0e0;
		}
	}
</style> 