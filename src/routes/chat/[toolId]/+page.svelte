<script lang="ts">
	import { page } from '$app/stores';
	import { getToolById } from '$lib/stores/tools.js';
	import ChatInterface from '$lib/components/ChatInterface.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade, fly, scale } from 'svelte/transition';

	let mounted = false;
	let mouseX = spring(0, { stiffness: 0.1, damping: 0.9 });
	let mouseY = spring(0, { stiffness: 0.1, damping: 0.9 });
	
	$: toolId = $page.params.toolId;
	$: tool = getToolById(toolId);

	// Redirect to home if tool not found
	$: if (toolId && !tool) {
		goto('/');
	}
	
	onMount(() => {
		mounted = true;
		
		const handleMouseMove = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth - 0.5) * 20;
			const y = (e.clientY / window.innerHeight - 0.5) * 20;
			mouseX.set(x);
			mouseY.set(y);
		};
		
		window.addEventListener('mousemove', handleMouseMove);
		
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
		};
	});
</script>

<svelte:head>
	<title>{tool ? `${tool.name} - OBT Helper GPT` : 'Chat - OBT Helper GPT'}</title>
	<meta name="description" content={tool ? `Chat with ${tool.name} - ${tool.description}` : 'AI Chat Assistant'}>
</svelte:head>

<div class="chat-page-2025">
	<!-- Animated Background -->
	<div class="chat-bg">
		<div class="bg-orb orb-1" style="transform: translate({$mouseX}px, {$mouseY}px)"></div>
		<div class="bg-orb orb-2" style="transform: translate({-$mouseX * 0.5}px, {-$mouseY * 0.5}px)"></div>
		<div class="bg-particles"></div>
	</div>

	{#if tool && tool.id && mounted}
		<!-- Chat Header -->
		<header class="chat-header-2025" in:fly={{ y: -20, duration: 600 }}>
			<div class="header-blur"></div>
			<div class="header-container">
				<!-- Back Button -->
				<button 
					on:click={() => goto('/')}
					class="back-button-2025"
					in:scale={{ duration: 500, delay: 200 }}
				>
					<span class="back-icon">←</span>
					<span class="back-text">Tools</span>
				</button>
				
				<!-- Tool Info -->
				<div class="tool-info" in:fade={{ duration: 600, delay: 300 }}>
					<span class="tool-icon-large">{tool.icon}</span>
					<div class="tool-details">
						<h1 class="tool-title">{tool.name}</h1>
						<p class="tool-desc">{tool.description}</p>
					</div>
				</div>
				
				<!-- Tool Status -->
				<div class="tool-status" in:scale={{ duration: 500, delay: 400 }}>
					<div class="status-item">
						<span class="status-dot"></span>
						<span class="status-text">Online</span>
					</div>
					<div class="model-badge">
						<span class="model-icon">🧠</span>
						<span class="model-name">{tool.model}</span>
					</div>
				</div>
			</div>
		</header>
		
		<!-- Chat Interface -->
		<main class="chat-main-2025" in:fade={{ duration: 600, delay: 500 }}>
			<div class="chat-container">
				<ChatInterface {tool} />
			</div>
			
			<!-- Floating Action Buttons -->
			<div class="floating-actions" in:fly={{ x: 50, duration: 600, delay: 700 }}>
				<button 
					class="fab-button"
					on:click={() => location.reload()}
					title="Clear Chat"
				>
					<span class="fab-icon">🗑️</span>
				</button>
				<button 
					class="fab-button fab-primary"
					on:click={() => goto('/')}
					title="Switch Tool"
				>
					<span class="fab-icon">🔄</span>
				</button>
			</div>
		</main>
	{:else if toolId && mounted}
		<!-- Tool Not Found -->
		<div class="error-container" in:scale={{ duration: 600 }}>
			<div class="error-box">
				<div class="error-icon-large">🔍</div>
				<h1 class="error-title">Tool Not Found</h1>
				<p class="error-message">The tool "{toolId}" doesn't exist or has been removed.</p>
				<button on:click={() => goto('/')} class="error-button">
					<span>Back to Tools</span>
					<span class="button-arrow">→</span>
				</button>
			</div>
		</div>
	{:else}
		<!-- Loading State -->
		<div class="loading-container">
			<div class="loading-content">
				<div class="loading-spinner"></div>
				<p class="loading-text">Initializing AI Assistant...</p>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Chat Page 2025 */
	.chat-page-2025 {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: var(--background-primary);
		display: flex;
		flex-direction: column;
	}
	
	/* Animated Background */
	.chat-bg {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}
	
	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(100px);
		opacity: 0.3;
		transition: transform 0.3s ease;
	}
	
	.orb-1 {
		width: 500px;
		height: 500px;
		background: radial-gradient(circle, #007AFF 0%, transparent 70%);
		top: -200px;
		right: -200px;
	}
	
	.orb-2 {
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, #00D4FF 0%, transparent 70%);
		bottom: -150px;
		left: -150px;
	}
	
	.bg-particles {
		position: absolute;
		inset: 0;
		background-image: 
			radial-gradient(circle at 20% 80%, rgba(0, 122, 255, 0.1) 0px, transparent 50%),
			radial-gradient(circle at 80% 20%, rgba(0, 212, 255, 0.1) 0px, transparent 50%),
			radial-gradient(circle at 50% 50%, rgba(255, 107, 107, 0.05) 0px, transparent 50%);
		animation: drift 20s ease-in-out infinite;
	}
	
	@keyframes drift {
		0%, 100% { transform: translate(0, 0); }
		33% { transform: translate(-20px, -20px); }
		66% { transform: translate(20px, -10px); }
	}
	
	/* Chat Header 2025 */
	.chat-header-2025 {
		position: relative;
		z-index: 10;
		height: 80px;
		flex-shrink: 0;
	}
	
	.header-blur {
		position: absolute;
		inset: 0;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}
	
	@media (prefers-color-scheme: dark) {
		.header-blur {
			background: rgba(0, 0, 0, 0.8);
			border-bottom-color: rgba(255, 255, 255, 0.1);
		}
	}
	
	.header-container {
		position: relative;
		height: 100%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
	}
	
	/* Back Button */
	.back-button-2025 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		color: var(--text-secondary);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}
	
	.back-button-2025:hover {
		background: rgba(0, 0, 0, 0.1);
		color: var(--text-primary);
		transform: translateX(-4px);
	}
	
	.back-icon {
		font-size: 1.25rem;
		transition: transform 0.3s ease;
	}
	
	.back-button-2025:hover .back-icon {
		transform: translateX(-2px);
	}
	
	/* Tool Info */
	.tool-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.tool-icon-large {
		font-size: 3rem;
		animation: float-gentle 4s ease-in-out infinite;
	}
	
	@keyframes float-gentle {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4px); }
	}
	
	.tool-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.tool-title {
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}
	
	.tool-desc {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	/* Tool Status */
	.tool-status {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}
	
	.status-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(81, 207, 102, 0.1);
		border: 1px solid rgba(81, 207, 102, 0.2);
		border-radius: 999px;
	}
	
	.status-dot {
		width: 8px;
		height: 8px;
		background: #51CF66;
		border-radius: 50%;
		animation: pulse-dot 2s ease-in-out infinite;
	}
	
	@keyframes pulse-dot {
		0%, 100% { transform: scale(1); opacity: 1; }
		50% { transform: scale(1.2); opacity: 0.8; }
	}
	
	.status-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: #51CF66;
	}
	
	.model-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 212, 255, 0.1));
		border: 1px solid rgba(0, 122, 255, 0.2);
		border-radius: 999px;
	}
	
	.model-icon {
		font-size: 1rem;
		opacity: 0.8;
	}
	
	.model-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--primary);
	}
	
	/* Chat Main */
	.chat-main-2025 {
		flex: 1;
		position: relative;
		z-index: 5;
		display: flex;
		overflow: hidden;
	}
	
	.chat-container {
		flex: 1;
		max-width: 1400px;
		width: 100%;
		margin: 0 auto;
		padding: 1rem 2rem 2rem;
		display: flex;
	}
	
	/* Floating Action Buttons */
	.floating-actions {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		z-index: 20;
	}
	
	.fab-button {
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}
	
	.fab-button:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
	}
	
	.fab-primary {
		background: linear-gradient(135deg, #007AFF, #0051D5);
		border-color: transparent;
		color: white;
	}
	
	.fab-primary:hover {
		box-shadow: 0 8px 30px rgba(0, 122, 255, 0.3);
	}
	
	.fab-icon {
		font-size: 1.5rem;
		animation: float-icon 3s ease-in-out infinite;
	}
	
	@keyframes float-icon {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-2px); }
	}
	
	/* Error Container */
	.error-container {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		z-index: 10;
	}
	
	.error-box {
		max-width: 500px;
		width: 100%;
		text-align: center;
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 24px;
		padding: 3rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
	}
	
	.error-icon-large {
		font-size: 5rem;
		margin-bottom: 1.5rem;
		animation: shake 0.5s ease-in-out;
	}
	
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
		20%, 40%, 60%, 80% { transform: translateX(5px); }
	}
	
	.error-title {
		font-size: 2rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.error-message {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin-bottom: 2rem;
		line-height: 1.5;
	}
	
	.error-button {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #007AFF, #0051D5);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
	}
	
	.error-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(0, 122, 255, 0.4);
	}
	
	.button-arrow {
		transition: transform 0.3s ease;
	}
	
	.error-button:hover .button-arrow {
		transform: translateX(4px);
	}
	
	/* Loading Container */
	.loading-container {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}
	
	.loading-content {
		text-align: center;
	}
	
	.loading-spinner {
		width: 60px;
		height: 60px;
		margin: 0 auto 1.5rem;
		border: 3px solid rgba(0, 122, 255, 0.1);
		border-top-color: #007AFF;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.loading-text {
		font-size: 1.125rem;
		color: var(--text-secondary);
		animation: pulse-text 1.5s ease-in-out infinite;
	}
	
	@keyframes pulse-text {
		0%, 100% { opacity: 0.6; }
		50% { opacity: 1; }
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.header-container {
			padding: 0 1rem;
		}
		
		.back-text {
			display: none;
		}
		
		.tool-icon-large {
			font-size: 2.5rem;
		}
		
		.tool-title {
			font-size: 1.25rem;
		}
		
		.tool-desc {
			display: none;
		}
		
		.tool-status {
			gap: 0.75rem;
		}
		
		.model-badge {
			display: none;
		}
		
		.chat-container {
			padding: 0.5rem 1rem 1rem;
		}
		
		.floating-actions {
			bottom: 1rem;
			right: 1rem;
			flex-direction: row;
		}
		
		.fab-button {
			width: 48px;
			height: 48px;
		}
		
		.fab-icon {
			font-size: 1.25rem;
		}
	}
	
	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.chat-page-2025 {
			background: #0a0a0a;
		}
		
		.back-button-2025 {
			background: rgba(255, 255, 255, 0.05);
			border-color: rgba(255, 255, 255, 0.1);
		}
		
		.back-button-2025:hover {
			background: rgba(255, 255, 255, 0.1);
		}
		
		.fab-button {
			background: rgba(20, 20, 20, 0.9);
			border-color: rgba(255, 255, 255, 0.1);
		}
		
		.error-box {
			background: rgba(20, 20, 20, 0.9);
			border-color: rgba(255, 255, 255, 0.1);
		}
	}
</style> 