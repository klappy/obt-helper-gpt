<script lang="ts">
	import { getActiveTools } from '$lib/stores/tools.js';
	import { goto } from '$app/navigation';
	import { FloatingCard } from '$lib/components/ui/index.js';
	import TrustBadges from '$lib/components/TrustBadges.svelte';
	import { onMount } from 'svelte';
	
	const tools = getActiveTools();
	
	// Sort tools by popularity (you'd get this from analytics in real app)
	// For now, using a mock popularity score
	const toolsWithPopularity = tools.map((tool, index) => ({
		...tool,
		popularity: Math.random() * 100, // Mock popularity score
		// Assign depth based on popularity rank
		depth: 2 // Will be updated after sorting
	}));
	
	// Sort by popularity (highest first)
	const sortedTools = toolsWithPopularity.sort((a, b) => b.popularity - a.popularity);
	
	// Assign depth levels based on popularity rank
	sortedTools.forEach((tool, index) => {
		if (index === 0) tool.depth = 4; // Most popular
		else if (index <= 2) tool.depth = 3; // Top 3
		else if (index <= 5) tool.depth = 2; // Top 6
		else tool.depth = 1; // Rest
	});
	let phoneNumber = '';
	let phoneError = '';
	let isLinking = false;
	
	// Load saved phone number on mount
	let scrollY = 0;
	let heroRef: HTMLElement;
	let assistantsRef: HTMLElement;
	let isLoading = true;
	
	onMount(() => {
		const saved = localStorage.getItem('obt-phone-number');
		if (saved) {
			phoneNumber = saved;
		}
		
		// Add parallax scroll listener
		const handleScroll = () => {
			scrollY = window.scrollY;
		};
		
		window.addEventListener('scroll', handleScroll, { passive: true });
		
		// Simulate loading delay
		setTimeout(() => {
			isLoading = false;
		}, 800);
		
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});
	
	// Validate phone number
	function validatePhone(number: string): boolean {
		// Remove all non-digit characters
		const digits = number.replace(/\D/g, '');
		// Check if it's a valid length (10-15 digits)
		return digits.length >= 10 && digits.length <= 15;
	}
	
	// Handle WhatsApp linking
	async function handleWhatsAppLink() {
		phoneError = '';
		
		if (!phoneNumber) {
			phoneError = 'Please enter your phone number';
			return;
		}
		
		if (!validatePhone(phoneNumber)) {
			phoneError = 'Please enter a valid phone number';
			return;
		}
		
		isLinking = true;
		
		// Save phone number
		localStorage.setItem('obt-phone-number', phoneNumber);
		
		// TODO: Implement actual WhatsApp linking
		// For now, just show success
		setTimeout(() => {
			isLinking = false;
			// Show success message or redirect
			goto('/demo');
		}, 1500);
	}
	
	// Format phone number as user types
	function formatPhoneNumber(value: string) {
		// Remove all non-digit characters
		const digits = value.replace(/\D/g, '');
		
		// Format based on length
		if (digits.length <= 3) {
			phoneNumber = digits;
		} else if (digits.length <= 6) {
			phoneNumber = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
		} else {
			phoneNumber = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
		}
	}
</script>

<svelte:head>
	<title>OBT Helper GPT - WhatsApp AI Assistant</title>
	<meta name="description" content="Connect your WhatsApp to powerful AI assistants. Get help with writing, coding, analysis, and more - right in your chats.">
</svelte:head>

<div class="homepage">
	<!-- Hero Section - WhatsApp First -->
	<section class="hero-section" bind:this={heroRef}>
		<div class="hero-container" style="transform: translateY({scrollY * 0.3}px)">
			<!-- Main Hero Content -->
			<div class="hero-content">
				<h1 class="hero-title">
					<span class="hero-emoji">💬</span>
					AI Assistants in Your
					<span class="hero-gradient">WhatsApp</span>
				</h1>
				
				<p class="hero-subtitle">
					Connect your phone number to access 10+ specialized AI tools directly in WhatsApp. 
					No app downloads, no complex setup - just text and go.
				</p>
				
				<!-- Phone Number Input -->
				<div class="phone-input-container">
					<FloatingCard depth={2} padding="md">
						<form on:submit|preventDefault={handleWhatsAppLink} class="phone-form">
							<label for="phone" class="phone-label">
								Enter your WhatsApp number to get started
							</label>
							
							<div class="phone-input-group">
								<span class="phone-icon">📱</span>
								<input
									id="phone"
									type="tel"
									bind:value={phoneNumber}
									on:input={(e) => formatPhoneNumber(e.currentTarget.value)}
									placeholder="(555) 123-4567"
									class="phone-input"
									class:error={phoneError}
									disabled={isLinking}
									autocomplete="tel"
								/>
							</div>
							
							{#if phoneError}
								<p class="error-message" role="alert">{phoneError}</p>
							{/if}
							
							<button 
								type="submit" 
								class="neu-button neu-button-primary link-button pulse-cta"
								disabled={isLinking}
							>
								{#if isLinking}
									<span class="spinner"></span>
									Connecting...
								{:else}
									<span class="button-text">Link WhatsApp</span>
									<span class="button-arrow">→</span>
								{/if}
							</button>
							
							<p class="privacy-note">
								🔒 Your number is stored locally. We never share your data.
							</p>
						</form>
					</FloatingCard>
				</div>
				
				<!-- Live Demo Preview -->
				<div class="demo-preview">
					<p class="demo-label">See it in action</p>
					<div class="demo-messages">
						<div class="demo-message user">
							Help me write a professional email
						</div>
						<div class="demo-message assistant">
							I'd be happy to help! What's the purpose of your email?
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
	
	<!-- Available Assistants Grid -->
	<section class="assistants-section" bind:this={assistantsRef}>
		<div class="section-container" style="transform: translateY({scrollY * -0.1}px)">
			<h2 class="section-title">
				Choose Your AI Assistant
			</h2>
			
			<p class="section-subtitle">
				Each assistant is specialized for different tasks. Pick one to start chatting.
			</p>
			
			<div class="assistants-grid">
				{#if isLoading}
					<!-- Loading Skeletons -->
					{#each Array(8) as _, index}
						<FloatingCard depth={1} class="assistant-card skeleton-card">
							<div class="skeleton-content">
								<div class="skeleton-icon"></div>
								<div class="skeleton-title"></div>
								<div class="skeleton-description"></div>
								<div class="skeleton-description short"></div>
								<div class="skeleton-badge"></div>
							</div>
						</FloatingCard>
					{/each}
				{:else}
					<!-- Actual Content -->
					{#each sortedTools as tool, index}
					<div style="transform: translateY({scrollY * -0.05 * (index % 3)}px)">
						<FloatingCard 
							depth={tool.depth} 
							hover={true} 
							animate={true}
							delay={index * 50}
							class="assistant-card"
						>
						<button 
							class="assistant-button"
							style="--index: {index}"
							on:click={() => goto(`/chat/${tool.id}`)}
							aria-label="Open {tool.name} assistant"
						>
							<span class="assistant-icon">{tool.icon}</span>
							<h3 class="assistant-name">{tool.name}</h3>
							<p class="assistant-description">{tool.description}</p>
							<span class="assistant-model">{tool.model}</span>
						</button>
						</FloatingCard>
					</div>
					{/each}
				{/if}
			</div>
		</div>
	</section>
	
	<!-- Social Proof Section -->
	<section class="social-proof-section">
		<div class="section-container">
			<h2 class="section-title">What Our Users Say</h2>
			<p class="section-subtitle">
				Join thousands of satisfied users who've transformed their WhatsApp experience
			</p>
			
			<div class="testimonials-grid">
				<FloatingCard depth={1} class="testimonial-card">
					<div class="testimonial-content">
						<div class="stars">⭐⭐⭐⭐⭐</div>
						<p class="testimonial-text">
							"The AI responses are incredibly fast and accurate. It's like having a personal assistant in WhatsApp!"
						</p>
						<div class="testimonial-author">
							<span class="author-avatar">👩‍💼</span>
							<div>
								<p class="author-name">Sarah Chen</p>
								<p class="author-role">Marketing Manager</p>
							</div>
						</div>
					</div>
				</FloatingCard>
				
				<FloatingCard depth={1} class="testimonial-card">
					<div class="testimonial-content">
						<div class="stars">⭐⭐⭐⭐⭐</div>
						<p class="testimonial-text">
							"I use the Code Helper daily. It's saved me hours of debugging time. Absolutely essential tool!"
						</p>
						<div class="testimonial-author">
							<span class="author-avatar">👨‍💻</span>
							<div>
								<p class="author-name">Alex Rodriguez</p>
								<p class="author-role">Software Developer</p>
							</div>
						</div>
					</div>
				</FloatingCard>
				
				<FloatingCard depth={1} class="testimonial-card">
					<div class="testimonial-content">
						<div class="stars">⭐⭐⭐⭐⭐</div>
						<p class="testimonial-text">
							"The Email Assistant helps me write professional emails in seconds. Game changer for productivity!"
						</p>
						<div class="testimonial-author">
							<span class="author-avatar">👨‍💼</span>
							<div>
								<p class="author-name">David Park</p>
								<p class="author-role">Business Owner</p>
							</div>
						</div>
					</div>
				</FloatingCard>
			</div>
			
			<!-- Trust Badges -->
			<div class="trust-badges-wrapper">
				<TrustBadges position="inline" />
			</div>
		</div>
	</section>
	
	<!-- Features Section -->
	<section class="features-section">
		<div class="section-container">
			<h2 class="section-title">Why OBT Helper GPT?</h2>
			
			<div class="features-grid">
				<FloatingCard depth={1} class="feature-card">
					<span class="feature-icon">⚡</span>
					<h3 class="feature-title">Instant Access</h3>
					<p class="feature-description">
						No app downloads or signups. Just save our number and start chatting.
					</p>
				</FloatingCard>
				
				<FloatingCard depth={1} class="feature-card">
					<span class="feature-icon">🎯</span>
					<h3 class="feature-title">Specialized Tools</h3>
					<p class="feature-description">
						Each assistant is fine-tuned for specific tasks with custom instructions.
					</p>
				</FloatingCard>
				
				<FloatingCard depth={1} class="feature-card">
					<span class="feature-icon">🔒</span>
					<h3 class="feature-title">Privacy First</h3>
					<p class="feature-description">
						Your conversations stay private. No tracking, no data collection.
					</p>
				</FloatingCard>
			</div>
		</div>
	</section>
</div>

<style>
	/* Hero Section */
	.hero-section {
		padding: var(--spacing-20) 0;
		background: linear-gradient(to bottom, var(--surface-1), var(--background-primary));
	}
	
	.hero-container {
		max-width: var(--content-lg);
		margin: 0 auto;
		padding: 0 var(--spacing-6);
	}
	
	.hero-content {
		text-align: center;
	}
	
	.hero-title {
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 800;
		line-height: 1.2;
		margin-bottom: var(--spacing-6);
		color: var(--text-primary);
	}
	
	.hero-emoji {
		display: block;
		font-size: 5rem;
		margin-bottom: var(--spacing-4);
		animation: bounce-in var(--spring-elastic) both;
	}
	
	.hero-gradient {
		background: linear-gradient(135deg, #25D366, #128C7E);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.hero-subtitle {
		font-size: 1.25rem;
		color: var(--text-secondary);
		max-width: 600px;
		margin: 0 auto var(--spacing-12);
		line-height: 1.6;
	}
	
	/* Phone Input */
	.phone-input-container {
		max-width: 500px;
		margin: 0 auto var(--spacing-12);
	}
	
	.phone-form {
		padding: var(--spacing-8);
	}
	
	.phone-label {
		display: block;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--spacing-4);
		font-size: 1.125rem;
	}
	
	.phone-input-group {
		position: relative;
		margin-bottom: var(--spacing-4);
	}
	
	.phone-icon {
		position: absolute;
		left: var(--spacing-4);
		top: 50%;
		transform: translateY(-50%);
		font-size: 1.5rem;
	}
	
	.phone-input {
		width: 100%;
		padding: var(--spacing-4) var(--spacing-4) var(--spacing-4) var(--spacing-12);
		font-size: 1.125rem;
		border: 2px solid var(--surface-3);
		border-radius: var(--radius-lg);
		background: var(--background-primary);
		color: var(--text-primary);
		transition: all var(--spring-smooth);
	}
	
	.phone-input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px var(--primary-bg);
	}
	
	.phone-input.error {
		border-color: var(--error);
	}
	
	.phone-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.error-message {
		color: var(--error);
		font-size: 0.875rem;
		margin-top: var(--spacing-2);
	}
	
	.link-button {
		width: 100%;
		padding: var(--spacing-4) var(--spacing-6);
		font-size: 1.125rem;
		font-weight: 600;
		margin-top: var(--spacing-4);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2);
	}
	
	.spinner {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	
	.privacy-note {
		text-align: center;
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: var(--spacing-4);
	}
	
	/* Demo Preview */
	.demo-preview {
		max-width: 400px;
		margin: 0 auto;
		animation: fade-in var(--spring-smooth) 0.5s both;
	}
	
	.demo-label {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: var(--spacing-3);
	}
	
	.demo-messages {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
	}
	
	.demo-message {
		padding: var(--spacing-3) var(--spacing-4);
		border-radius: var(--radius-xl);
		font-size: 0.875rem;
		max-width: 80%;
		animation: slide-up var(--spring-smooth) both;
	}
	
	.demo-message.user {
		align-self: flex-end;
		background: #25D366;
		color: white;
		animation-delay: 0.2s;
	}
	
	.demo-message.assistant {
		align-self: flex-start;
		background: var(--surface-2);
		color: var(--text-primary);
		animation-delay: 0.4s;
	}
	
	/* Assistants Section */
	.assistants-section {
		padding: var(--spacing-20) 0;
		background: var(--background-primary);
	}
	
	.section-container {
		max-width: var(--content-xl);
		margin: 0 auto;
		padding: 0 var(--spacing-6);
	}
	
	.section-title {
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		text-align: center;
		margin-bottom: var(--spacing-4);
		color: var(--text-primary);
	}
	
	.section-subtitle {
		text-align: center;
		color: var(--text-secondary);
		font-size: 1.125rem;
		margin-bottom: var(--spacing-12);
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.assistants-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--spacing-6);
	}
	
	:global(.assistant-card) {
		height: 100%;
	}
	
	.assistant-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--spacing-8);
		width: 100%;
		height: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
		color: inherit;
		text-decoration: none;
	}
	
	.assistant-icon {
		font-size: 3rem;
		margin-bottom: var(--spacing-4);
		transition: transform var(--spring-bounce);
	}
	
	.assistant-button:hover .assistant-icon {
		transform: scale(1.2) rotate(-5deg);
	}
	
	.assistant-name {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: var(--spacing-2);
		color: var(--text-primary);
	}
	
	.assistant-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: var(--spacing-4);
		flex: 1;
	}
	
	.assistant-model {
		font-size: 0.75rem;
		padding: var(--spacing-1) var(--spacing-3);
		background: var(--primary-bg);
		color: var(--primary);
		border-radius: var(--radius-full);
		font-weight: 500;
	}
	
	/* Social Proof Section */
	.social-proof-section {
		padding: var(--spacing-20) 0;
		background: var(--background-primary);
	}
	
	.testimonials-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: var(--spacing-8);
		margin-bottom: var(--spacing-16);
	}
	
	:global(.testimonial-card) {
		height: 100%;
	}
	
	.testimonial-content {
		padding: var(--spacing-8);
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	
	.stars {
		font-size: 1.25rem;
		margin-bottom: var(--spacing-4);
		letter-spacing: 0.25rem;
	}
	
	.testimonial-text {
		flex: 1;
		font-size: 1.125rem;
		line-height: 1.6;
		color: var(--text-primary);
		margin-bottom: var(--spacing-6);
		font-style: italic;
	}
	
	.testimonial-author {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		padding-top: var(--spacing-4);
		border-top: 1px solid var(--surface-3);
	}
	
	.author-avatar {
		font-size: 2.5rem;
		display: block;
	}
	
	.author-name {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--spacing-1);
	}
	
	.author-role {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.trust-badges-wrapper {
		margin-top: var(--spacing-12);
	}
	
	/* Features Section */
	.features-section {
		padding: var(--spacing-20) 0;
		background: var(--surface-1);
	}
	
	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--spacing-8);
		margin-top: var(--spacing-12);
	}
	
	:global(.feature-card) {
		text-align: center;
		padding: var(--spacing-8);
	}
	
	.feature-icon {
		display: block;
		font-size: 3rem;
		margin-bottom: var(--spacing-4);
		animation: bounce-in var(--spring-elastic) both;
	}
	
	.feature-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: var(--spacing-3);
		color: var(--text-primary);
	}
	
	.feature-description {
		color: var(--text-secondary);
		line-height: 1.6;
	}
	
	/* CTA Animations */
	.pulse-cta {
		position: relative;
		overflow: hidden;
		animation: pulse-shadow 2s ease-in-out infinite;
	}
	
	@keyframes pulse-shadow {
		0%, 100% {
			box-shadow: 0 0 0 0 var(--primary);
		}
		50% {
			box-shadow: 0 0 20px 5px var(--primary);
		}
	}
	
	.button-arrow {
		display: inline-block;
		margin-left: var(--spacing-2);
		transition: transform var(--spring-bounce);
	}
	
	.pulse-cta:hover .button-arrow {
		transform: translateX(4px);
		animation: arrow-bounce 0.6s ease-in-out infinite;
	}
	
	@keyframes arrow-bounce {
		0%, 100% { transform: translateX(4px); }
		50% { transform: translateX(8px); }
	}
	
	/* Ripple effect on click */
	.pulse-cta::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.5);
		transform: translate(-50%, -50%);
		transition: width 0.6s, height 0.6s;
	}
	
	.pulse-cta:active::after {
		width: 300px;
		height: 300px;
	}
	
	/* Floating animation for assistant buttons */
	.assistant-button {
		animation: gentle-float 4s ease-in-out infinite;
		animation-delay: calc(var(--index, 0) * 0.2s);
	}
	
	@keyframes gentle-float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4px); }
	}
	
	/* Hover lift animation */
	.assistant-button:hover {
		animation-play-state: paused;
		transform: translateY(-8px) scale(1.02);
		transition: all var(--spring-bounce);
	}
	
	/* Add shine effect to CTAs */
	.neu-button-primary::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.2),
			transparent
		);
		transition: left 0.5s;
	}
	
	.neu-button-primary:hover::before {
		left: 100%;
	}
	
	/* Animations */
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	/* Mobile Responsive */
	@media (max-width: 640px) {
		.hero-section {
			padding: var(--spacing-12) 0;
		}
		
		.hero-emoji {
			font-size: 3.5rem;
		}
		
		.hero-title {
			font-size: 2rem;
		}
		
		.hero-subtitle {
			font-size: 1rem;
		}
		
		.phone-form {
			padding: var(--spacing-6);
		}
		
		.assistants-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-4);
		}
		
		.features-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-6);
		}
	}
	
	/* Skeleton Loading */
	:global(.skeleton-card) {
		pointer-events: none;
	}
	
	.skeleton-content {
		padding: var(--spacing-8);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-4);
		height: 100%;
	}
	
	.skeleton-icon,
	.skeleton-title,
	.skeleton-description,
	.skeleton-badge {
		background: linear-gradient(90deg, 
			var(--surface-2) 25%, 
			var(--surface-3) 50%, 
			var(--surface-2) 75%
		);
		background-size: 200% 100%;
		animation: skeleton-loading 1.5s ease-in-out infinite;
		border-radius: var(--radius-md);
	}
	
	.skeleton-icon {
		width: 60px;
		height: 60px;
		border-radius: var(--radius-full);
		margin-bottom: var(--spacing-2);
	}
	
	.skeleton-title {
		width: 80%;
		height: 24px;
	}
	
	.skeleton-description {
		width: 100%;
		height: 16px;
	}
	
	.skeleton-description.short {
		width: 60%;
	}
	
	.skeleton-badge {
		width: 100px;
		height: 24px;
		border-radius: var(--radius-full);
		margin-top: auto;
	}
	
	@keyframes skeleton-loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
	
	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.phone-input {
			background: var(--surface-1-dark);
		}
		
		.demo-message.assistant {
			background: var(--surface-2-dark);
		}
		
		.skeleton-icon,
		.skeleton-title,
		.skeleton-description,
		.skeleton-badge {
			background: linear-gradient(90deg, 
				var(--surface-2-dark) 25%, 
				var(--surface-3-dark) 50%, 
				var(--surface-2-dark) 75%
			);
			background-size: 200% 100%;
		}
	}
</style> 