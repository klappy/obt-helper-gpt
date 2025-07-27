<script lang="ts">
	import { onMount } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade, fly, scale } from 'svelte/transition';
	import { getActiveTools } from '$lib/stores/tools.js';
	import ChatInterface from '$lib/components/ChatInterface.svelte';
	import VoiceControls from '$lib/components/VoiceControls.svelte';
	
	let mounted = false;
	let selectedTool = getActiveTools()[0];
	let voiceEnabled = false;
	let mouseX = spring(0, { stiffness: 0.1, damping: 0.9 });
	let mouseY = spring(0, { stiffness: 0.1, damping: 0.9 });
	let currentFeature = 0;
	
	const tools = getActiveTools();
	
	// Demo features showcase
	const features = [
		{
			icon: '⚡',
			title: 'Lightning Fast',
			description: 'Get instant responses powered by cutting-edge AI'
		},
		{
			icon: '🎯',
			title: 'Context Aware',
			description: 'Remembers your conversation for better assistance'
		},
		{
			icon: '🔒',
			title: 'Secure & Private',
			description: 'Your data never leaves this browser'
		}
	];
	
	onMount(() => {
		mounted = true;
		
		const handleMouseMove = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth - 0.5) * 20;
			const y = (e.clientY / window.innerHeight - 0.5) * 20;
			mouseX.set(x);
			mouseY.set(y);
		};
		
		// Rotate features
		const featureInterval = setInterval(() => {
			currentFeature = (currentFeature + 1) % features.length;
		}, 3000);
		
		window.addEventListener('mousemove', handleMouseMove);
		
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			clearInterval(featureInterval);
		};
	});
	
	function handleSelectTool(tool: typeof selectedTool) {
		selectedTool = tool;
	}
</script>

<svelte:head>
	<title>Demo - OBT Helper GPT | Try AI Assistants Live</title>
	<meta name="description" content="Experience the power of AI assistants directly in your browser. No signup required. Try our specialized tools for writing, coding, and more.">
</svelte:head>

<div class="demo-2025">
	<!-- Animated Background -->
	<div class="demo-bg">
		<div class="bg-orb orb-1" style="transform: translate({$mouseX}px, {$mouseY}px)"></div>
		<div class="bg-orb orb-2" style="transform: translate({-$mouseX * 0.5}px, {-$mouseY * 0.5}px)"></div>
		<div class="bg-mesh"></div>
	</div>
	
	{#if mounted}
		<!-- Hero Section -->
		<section class="demo-hero" in:fade={{ duration: 600 }}>
			<div class="hero-container">
				<div class="hero-badge" in:fly={{ y: -20, duration: 600, delay: 200 }}>
					<span class="badge-icon">🎮</span>
					<span class="badge-text">Live Demo</span>
				</div>
				
				<h1 class="hero-title" in:fly={{ y: 20, duration: 800, delay: 400 }}>
					Try Our AI Assistants
					<span class="title-gradient">Right Now</span>
				</h1>
				
				<p class="hero-subtitle" in:fly={{ y: 20, duration: 800, delay: 600 }}>
					No signup. No downloads. Just pure AI magic in your browser.
				</p>
			</div>
		</section>
		
		<!-- Tool Selection -->
		<section class="tool-selection" in:fade={{ duration: 600, delay: 800 }}>
			<div class="selection-container">
				<h2 class="selection-title">Choose Your Assistant</h2>
				<div class="tools-carousel">
					{#each tools as tool, i}
						<button
							class="tool-card-demo"
							class:selected={selectedTool.id === tool.id}
							on:click={() => handleSelectTool(tool)}
							in:scale={{ duration: 500, delay: 900 + i * 50 }}
						>
							<div class="tool-shine"></div>
							<span class="tool-icon">{tool.icon}</span>
							<span class="tool-name">{tool.name}</span>
							<span class="tool-badge">{tool.model}</span>
						</button>
					{/each}
				</div>
			</div>
		</section>
		
		<!-- Main Demo Interface -->
		<section class="demo-interface">
			<div class="interface-container">
				<div class="interface-grid">
					<!-- Chat Area -->
					<div class="chat-area" in:fly={{ x: -50, duration: 800, delay: 1000 }}>
						<div class="chat-header">
							<div class="header-content">
								<span class="header-icon">{selectedTool.icon}</span>
								<div class="header-info">
									<h3 class="header-title">{selectedTool.name}</h3>
									<p class="header-subtitle">{selectedTool.description}</p>
								</div>
								<div class="header-actions">
									<button 
										class="action-button"
										on:click={() => voiceEnabled = !voiceEnabled}
										class:active={voiceEnabled}
										aria-label="Toggle voice"
									>
										<span class="action-icon">🎤</span>
									</button>
								</div>
							</div>
						</div>
						
						<div class="chat-wrapper">
							<ChatInterface tool={selectedTool} demo={true} />
						</div>
						
						{#if voiceEnabled}
							<div class="voice-panel" transition:fly={{ y: 20, duration: 300 }}>
								<VoiceControls 
									onTranscript={(text) => console.log('Voice:', text)}
									language="en-US"
									autoSpeak={true}
								/>
							</div>
						{/if}
					</div>
					
					<!-- Features Sidebar -->
					<div class="features-sidebar" in:fly={{ x: 50, duration: 800, delay: 1200 }}>
						<div class="sidebar-content">
							<h3 class="sidebar-title">Why You'll Love It</h3>
							
							<!-- Animated Features -->
							<div class="features-showcase">
								{#key currentFeature}
									<div class="feature-highlight" in:scale={{ duration: 500 }}>
										<span class="highlight-icon">{features[currentFeature].icon}</span>
										<h4 class="highlight-title">{features[currentFeature].title}</h4>
										<p class="highlight-text">{features[currentFeature].description}</p>
									</div>
								{/key}
							</div>
							
							<!-- Feature List -->
							<div class="features-list">
								{#each features as feature, i}
									<button 
										class="feature-item"
										class:active={i === currentFeature}
										on:click={() => currentFeature = i}
									>
										<span class="feature-dot"></span>
										<span class="feature-label">{feature.title}</span>
									</button>
								{/each}
							</div>
							
							<!-- CTA Section -->
							<div class="sidebar-cta">
								<h4 class="cta-title">Ready to Connect?</h4>
								<p class="cta-text">Get this AI power directly in your WhatsApp</p>
								<a href="/" class="cta-button">
									<span>Get Started</span>
									<span class="button-arrow">→</span>
								</a>
							</div>
							
							<!-- Stats -->
							<div class="demo-stats">
								<div class="stat">
									<span class="stat-value">0ms</span>
									<span class="stat-label">Latency</span>
								</div>
								<div class="stat">
									<span class="stat-value">100%</span>
									<span class="stat-label">Private</span>
								</div>
								<div class="stat">
									<span class="stat-value">∞</span>
									<span class="stat-label">Messages</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
		
		<!-- Bottom Banner -->
		<section class="demo-banner" in:fade={{ duration: 600, delay: 1400 }}>
			<div class="banner-content">
				<p class="banner-text">
					<span class="banner-icon">💡</span>
					<span>This is just a demo. Connect your WhatsApp for the full experience!</span>
				</p>
				<a href="/" class="banner-cta">
					<span>Connect WhatsApp</span>
					<span class="cta-sparkle">✨</span>
				</a>
			</div>
		</section>
	{/if}
</div>

<style>
	/* Demo 2025 Container */
	.demo-2025 {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: var(--background-primary);
	}
	
	/* Animated Background */
	.demo-bg {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}
	
	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(100px);
		opacity: 0.4;
		transition: transform 0.3s ease;
	}
	
	.orb-1 {
		width: 600px;
		height: 600px;
		background: radial-gradient(circle, #007AFF 0%, transparent 70%);
		top: -200px;
		right: -200px;
	}
	
	.orb-2 {
		width: 500px;
		height: 500px;
		background: radial-gradient(circle, #FF6B6B 0%, transparent 70%);
		bottom: -200px;
		left: -200px;
	}
	
	.bg-mesh {
		position: absolute;
		inset: 0;
		background-image: 
			radial-gradient(at 20% 80%, hsla(210, 100%, 56%, 0.2) 0px, transparent 50%),
			radial-gradient(at 80% 20%, hsla(355, 100%, 70%, 0.2) 0px, transparent 50%);
		opacity: 0.5;
	}
	
	/* Hero Section */
	.demo-hero {
		position: relative;
		z-index: 1;
		padding: 3rem 2rem;
		text-align: center;
	}
	
	.hero-container {
		max-width: 800px;
		margin: 0 auto;
	}
	
	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #007AFF, #00D4FF);
		color: white;
		border-radius: 999px;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
	}
	
	.badge-icon {
		font-size: 1rem;
		animation: pulse 2s ease-in-out infinite;
	}
	
	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.1); }
	}
	
	.hero-title {
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 800;
		line-height: 1.1;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}
	
	.title-gradient {
		background: linear-gradient(135deg, #007AFF, #00D4FF, #FF6B6B);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		display: block;
	}
	
	.hero-subtitle {
		font-size: 1.25rem;
		color: var(--text-secondary);
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.6;
	}
	
	/* Tool Selection */
	.tool-selection {
		position: relative;
		z-index: 1;
		padding: 2rem;
		background: rgba(255, 255, 255, 0.02);
		backdrop-filter: blur(10px);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.selection-container {
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.selection-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		text-align: center;
		color: var(--text-primary);
	}
	
	.tools-carousel {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		padding: 0.5rem 0 1.5rem;
		scrollbar-width: thin;
		scrollbar-color: var(--primary) transparent;
	}
	
	.tools-carousel::-webkit-scrollbar {
		height: 6px;
	}
	
	.tools-carousel::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.1);
		border-radius: 3px;
	}
	
	.tools-carousel::-webkit-scrollbar-thumb {
		background: var(--primary);
		border-radius: 3px;
	}
	
	.tool-card-demo {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem 2rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		cursor: pointer;
		transition: all 0.3s ease;
		overflow: hidden;
		flex-shrink: 0;
	}
	
	.tool-shine {
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}
	
	.tool-card-demo:hover {
		transform: translateY(-4px);
		border-color: var(--primary);
		background: rgba(255, 255, 255, 0.08);
	}
	
	.tool-card-demo:hover .tool-shine {
		opacity: 1;
	}
	
	.tool-card-demo.selected {
		background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 212, 255, 0.1));
		border-color: var(--primary);
		transform: translateY(-4px);
	}
	
	.tool-icon {
		font-size: 2rem;
		animation: float-gentle 4s ease-in-out infinite;
	}
	
	@keyframes float-gentle {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4px); }
	}
	
	.tool-name {
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
	}
	
	.tool-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.75rem;
		background: rgba(0, 122, 255, 0.1);
		color: var(--primary);
		border-radius: 999px;
		font-weight: 500;
	}
	
	/* Demo Interface */
	.demo-interface {
		position: relative;
		z-index: 1;
		padding: 3rem 2rem;
		min-height: 600px;
	}
	
	.interface-container {
		max-width: 1400px;
		margin: 0 auto;
	}
	
	.interface-grid {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 2rem;
		align-items: start;
	}
	
	/* Chat Area */
	.chat-area {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 24px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
	}
	
	.chat-header {
		background: rgba(255, 255, 255, 0.05);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1.5rem;
	}
	
	.header-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.header-icon {
		font-size: 2.5rem;
		animation: float-gentle 4s ease-in-out infinite;
	}
	
	.header-info {
		flex: 1;
	}
	
	.header-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.header-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.header-actions {
		display: flex;
		gap: 0.5rem;
	}
	
	.action-button {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 1.25rem;
	}
	
	.action-button:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}
	
	.action-button.active {
		background: linear-gradient(135deg, #007AFF, #00D4FF);
		border-color: transparent;
		color: white;
	}
	
	.chat-wrapper {
		height: 500px;
		overflow: hidden;
	}
	
	.voice-panel {
		background: rgba(255, 255, 255, 0.05);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1rem;
	}
	
	/* Features Sidebar */
	.features-sidebar {
		position: sticky;
		top: 100px;
	}
	
	.sidebar-content {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 24px;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	.sidebar-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	/* Features Showcase */
	.features-showcase {
		background: linear-gradient(135deg, rgba(0, 122, 255, 0.05), rgba(0, 212, 255, 0.05));
		border-radius: 16px;
		padding: 1.5rem;
		min-height: 150px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.feature-highlight {
		text-align: center;
	}
	
	.highlight-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: 1rem;
		animation: bounce 2s ease-in-out infinite;
	}
	
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-8px); }
	}
	
	.highlight-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.highlight-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	/* Features List */
	.features-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: left;
	}
	
	.feature-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}
	
	.feature-item.active {
		background: rgba(0, 122, 255, 0.1);
	}
	
	.feature-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--text-tertiary);
		transition: all 0.3s ease;
	}
	
	.feature-item.active .feature-dot {
		background: var(--primary);
		transform: scale(1.5);
	}
	
	.feature-label {
		font-size: 0.875rem;
		color: var(--text-primary);
		font-weight: 500;
	}
	
	/* Sidebar CTA */
	.sidebar-cta {
		background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 212, 255, 0.05));
		border-radius: 16px;
		padding: 1.5rem;
		text-align: center;
	}
	
	.cta-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.cta-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
		line-height: 1.5;
	}
	
	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #007AFF, #0051D5);
		color: white;
		border-radius: 999px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
	}
	
	.cta-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 25px rgba(0, 122, 255, 0.4);
	}
	
	.button-arrow {
		transition: transform 0.3s ease;
	}
	
	.cta-button:hover .button-arrow {
		transform: translateX(2px);
	}
	
	/* Demo Stats */
	.demo-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	
	.stat {
		text-align: center;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 800;
		background: linear-gradient(135deg, #007AFF, #00D4FF);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 0.25rem;
	}
	
	.stat-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	/* Bottom Banner */
	.demo-banner {
		position: relative;
		z-index: 1;
		background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 212, 255, 0.05));
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding: 2rem;
	}
	
	.banner-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		flex-wrap: wrap;
	}
	
	.banner-text {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 1.125rem;
		color: var(--text-primary);
		flex: 1;
	}
	
	.banner-icon {
		font-size: 1.5rem;
		animation: pulse 2s ease-in-out infinite;
	}
	
	.banner-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 2rem;
		background: linear-gradient(135deg, #25D366, #128C7E);
		color: white;
		border-radius: 999px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(37, 211, 102, 0.3);
	}
	
	.banner-cta:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 25px rgba(37, 211, 102, 0.4);
	}
	
	.cta-sparkle {
		font-size: 1rem;
		animation: sparkle 2s ease-in-out infinite;
	}
	
	@keyframes sparkle {
		0%, 100% { opacity: 1; transform: rotate(0deg) scale(1); }
		50% { opacity: 0.7; transform: rotate(180deg) scale(1.2); }
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.hero-title {
			font-size: 2rem;
		}
		
		.tools-carousel {
			justify-content: flex-start;
		}
		
		.interface-grid {
			grid-template-columns: 1fr;
		}
		
		.features-sidebar {
			position: static;
			margin-top: 2rem;
		}
		
		.demo-stats {
			grid-template-columns: 1fr;
		}
		
		.banner-content {
			flex-direction: column;
			text-align: center;
		}
		
		.banner-text {
			justify-content: center;
		}
	}
	
	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.chat-area,
		.sidebar-content {
			background: rgba(255, 255, 255, 0.02);
		}
		
		.tool-selection {
			background: rgba(0, 0, 0, 0.5);
		}
	}
</style> 