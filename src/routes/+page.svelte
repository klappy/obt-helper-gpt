<script lang="ts">
	import { getActiveTools } from '$lib/stores/tools.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	
	const tools = getActiveTools();
	let phoneNumber = '';
	let phoneError = '';
	let isConnecting = false;
	let mounted = false;
	
	onMount(() => {
		mounted = true;
	});
	
	async function connectWhatsApp() {
		phoneError = '';
		
		if (!phoneNumber.trim()) {
			phoneError = 'Please enter your phone number';
			return;
		}
		
		// Basic phone validation
		const cleaned = phoneNumber.replace(/\D/g, '');
		if (cleaned.length < 10) {
			phoneError = 'Please enter a valid phone number with country code';
			return;
		}
		
		isConnecting = true;
		
		// Show WhatsApp connection instructions
		const whatsappUrl = `https://wa.me/14155238886?text=join%20-%20${cleaned}`;
		window.open(whatsappUrl, '_blank');
		
		// Reset after showing instructions
		setTimeout(() => {
			isConnecting = false;
		}, 3000);
	}
</script>

<svelte:head>
	<title>OBT Helper GPT - AI Assistant for WhatsApp</title>
	<meta name="description" content="Connect your WhatsApp to access AI assistants. Simple, free, and private.">
</svelte:head>

{#if mounted}
<div class="simple-page" in:fade={{ duration: 300 }}>
	<!-- Simple Header -->
	<header class="simple-header">
		<div class="container">
			<h1 class="site-title">
				<span class="logo">🤖</span>
				OBT Helper GPT
			</h1>
			<p class="site-tagline">AI assistants in your WhatsApp</p>
		</div>
	</header>
	
	<!-- Main Content -->
	<main class="simple-main">
		<div class="container">
			<!-- Step 1: Connect -->
			<section class="connect-section">
				<div class="step-number">1</div>
				<h2>Connect Your WhatsApp</h2>
				<p class="instructions">Enter your WhatsApp phone number to get started</p>
				
				<form on:submit|preventDefault={connectWhatsApp} class="phone-form">
					<div class="form-group">
						<input
							type="tel"
							bind:value={phoneNumber}
							placeholder="+1 234 567 8900"
							class="phone-input"
							disabled={isConnecting}
						/>
						<button 
							type="submit" 
							class="connect-button"
							class:loading={isConnecting}
							disabled={isConnecting}
						>
							{isConnecting ? 'Opening WhatsApp...' : 'Connect'}
						</button>
					</div>
					{#if phoneError}
						<p class="error-message">{phoneError}</p>
					{/if}
				</form>
				
				<div class="help-text">
					<p><strong>How it works:</strong></p>
					<ol>
						<li>Click Connect to open WhatsApp</li>
						<li>Send the join message</li>
						<li>Start chatting with AI</li>
					</ol>
				</div>
			</section>
			
			<!-- Step 2: Choose Tool -->
			<section class="tools-section">
				<div class="step-number">2</div>
				<h2>Choose an AI Assistant</h2>
				<p class="instructions">Select what you need help with</p>
				
				<div class="tools-grid">
					{#each tools as tool}
						<button
							class="tool-card"
							on:click={() => goto(`/demo?tool=${tool.id}`)}
						>
							<span class="tool-icon">{tool.icon}</span>
							<h3 class="tool-name">{tool.name}</h3>
							<p class="tool-description">{tool.description}</p>
						</button>
					{/each}
				</div>
			</section>
			
			<!-- Try Demo -->
			<section class="demo-section">
				<h2>Want to try first?</h2>
				<a href="/demo" class="demo-link">
					Try the web demo →
				</a>
			</section>
		</div>
	</main>
	
	<!-- Simple Footer -->
	<footer class="simple-footer">
		<div class="container">
			<p>Free to use • No signup required • Your data stays private</p>
		</div>
	</footer>
</div>
{/if}

<style>
	/* Reset and Base */
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}
	
	.simple-page {
		min-height: 100vh;
		background: #ffffff;
		color: #000000;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.6;
	}
	
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 20px;
	}
	
	/* Header */
	.simple-header {
		border-bottom: 2px solid #000000;
		padding: 2rem 0;
		margin-bottom: 3rem;
	}
	
	.site-title {
		font-size: 2rem;
		font-weight: 900;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	
	.logo {
		font-size: 2.5rem;
	}
	
	.site-tagline {
		font-size: 1.125rem;
		color: #666666;
	}
	
	/* Main Content */
	.simple-main {
		padding-bottom: 4rem;
	}
	
	/* Sections */
	section {
		margin-bottom: 4rem;
		position: relative;
	}
	
	.step-number {
		position: absolute;
		left: -60px;
		top: 0;
		width: 40px;
		height: 40px;
		background: #000000;
		color: #ffffff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 900;
		font-size: 1.25rem;
	}
	
	h2 {
		font-size: 1.75rem;
		font-weight: 900;
		margin-bottom: 0.5rem;
	}
	
	.instructions {
		font-size: 1.125rem;
		color: #666666;
		margin-bottom: 1.5rem;
	}
	
	/* Connect Section */
	.phone-form {
		margin-bottom: 2rem;
	}
	
	.form-group {
		display: flex;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}
	
	.phone-input {
		flex: 1;
		padding: 1rem;
		font-size: 1.125rem;
		border: 2px solid #000000;
		border-radius: 8px;
		background: #ffffff;
		font-family: inherit;
	}
	
	.phone-input:focus {
		outline: none;
		border-color: #0066cc;
	}
	
	.phone-input:disabled {
		opacity: 0.5;
	}
	
	.connect-button {
		padding: 1rem 2rem;
		font-size: 1.125rem;
		font-weight: 700;
		background: #000000;
		color: #ffffff;
		border: 2px solid #000000;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
		white-space: nowrap;
	}
	
	.connect-button:hover:not(:disabled) {
		background: #ffffff;
		color: #000000;
	}
	
	.connect-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.connect-button.loading {
		background: #666666;
		border-color: #666666;
	}
	
	.error-message {
		color: #cc0000;
		font-weight: 500;
		margin-top: 0.5rem;
	}
	
	.help-text {
		background: #f5f5f5;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}
	
	.help-text p {
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	
	.help-text ol {
		margin-left: 1.5rem;
		color: #666666;
	}
	
	.help-text li {
		margin-bottom: 0.25rem;
	}
	
	/* Tools Section */
	.tools-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}
	
	.tool-card {
		padding: 1.5rem;
		border: 2px solid #000000;
		border-radius: 8px;
		background: #ffffff;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		font-family: inherit;
	}
	
	.tool-card:hover {
		background: #000000;
		color: #ffffff;
		transform: translateY(-2px);
	}
	
	.tool-icon {
		font-size: 2rem;
		display: block;
		margin-bottom: 0.5rem;
	}
	
	.tool-name {
		font-size: 1.125rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	
	.tool-description {
		font-size: 0.875rem;
		color: inherit;
		opacity: 0.8;
		line-height: 1.4;
	}
	
	/* Demo Section */
	.demo-section {
		text-align: center;
		padding: 2rem;
		background: #f5f5f5;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}
	
	.demo-section h2 {
		margin-bottom: 1rem;
	}
	
	.demo-link {
		font-size: 1.125rem;
		font-weight: 700;
		color: #0066cc;
		text-decoration: none;
		border-bottom: 2px solid #0066cc;
		transition: all 0.2s;
	}
	
	.demo-link:hover {
		color: #0052a3;
		border-bottom-color: #0052a3;
	}
	
	/* Footer */
	.simple-footer {
		border-top: 2px solid #000000;
		padding: 2rem 0;
		text-align: center;
		color: #666666;
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.step-number {
			position: static;
			margin-bottom: 1rem;
			width: 32px;
			height: 32px;
			font-size: 1rem;
		}
		
		.site-title {
			font-size: 1.5rem;
		}
		
		.logo {
			font-size: 2rem;
		}
		
		h2 {
			font-size: 1.5rem;
		}
		
		.form-group {
			flex-direction: column;
		}
		
		.connect-button {
			width: 100%;
		}
		
		.tools-grid {
			grid-template-columns: 1fr;
		}
	}
	
	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.simple-page {
			background: #000000;
			color: #ffffff;
		}
		
		.simple-header {
			border-bottom-color: #ffffff;
		}
		
		.site-tagline {
			color: #999999;
		}
		
		.instructions {
			color: #999999;
		}
		
		.phone-input {
			background: #000000;
			color: #ffffff;
			border-color: #ffffff;
		}
		
		.phone-input:focus {
			border-color: #4d94ff;
		}
		
		.connect-button {
			background: #ffffff;
			color: #000000;
			border-color: #ffffff;
		}
		
		.connect-button:hover:not(:disabled) {
			background: #000000;
			color: #ffffff;
		}
		
		.help-text {
			background: #1a1a1a;
			border-color: #333333;
		}
		
		.help-text ol {
			color: #999999;
		}
		
		.tool-card {
			background: #000000;
			border-color: #ffffff;
			color: #ffffff;
		}
		
		.tool-card:hover {
			background: #ffffff;
			color: #000000;
		}
		
		.demo-section {
			background: #1a1a1a;
			border-color: #333333;
		}
		
		.demo-link {
			color: #4d94ff;
			border-bottom-color: #4d94ff;
		}
		
		.demo-link:hover {
			color: #80b3ff;
			border-bottom-color: #80b3ff;
		}
		
		.simple-footer {
			border-top-color: #ffffff;
			color: #999999;
		}
	}
</style> 