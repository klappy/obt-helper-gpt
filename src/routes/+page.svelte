<script lang="ts">
	import { getActiveTools } from '$lib/stores/tools.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade, fly, scale, blur } from 'svelte/transition';
	
	const tools = getActiveTools();
	
	// Animation states
	let mounted = false;
	let heroLoaded = false;
	let phoneNumber = '';
	let phoneError = '';
	let isLinking = false;
	let currentTestimonial = 0;
	let mouseX = spring(0, { stiffness: 0.1, damping: 0.9 });
	let mouseY = spring(0, { stiffness: 0.1, damping: 0.9 });
	
	// Feature showcase states
	let activeFeature = 0;
	let chatMessages = [
		{ type: 'user', text: 'Help me write a professional email' },
		{ type: 'assistant', text: "I'd be happy to help! What's the purpose?" },
		{ type: 'user', text: 'Following up on a job interview' },
		{ type: 'assistant', text: 'Great! Here\'s a professional template...' }
	];
	
	// Stats for social proof
	const stats = [
		{ number: '50K+', label: 'Active Users' },
		{ number: '2M+', label: 'Messages Sent' },
		{ number: '4.9★', label: 'User Rating' },
		{ number: '24/7', label: 'Availability' }
	];
	
	// Testimonials with rotation
	const testimonials = [
		{
			text: "This AI assistant transformed how I work. It's like having a genius in my pocket!",
			author: 'Sarah Chen',
			role: 'CEO, TechStart',
			avatar: '👩‍💼'
		},
		{
			text: "The code suggestions are incredibly accurate. Saved me hours of debugging time.",
			author: 'Marcus Johnson',
			role: 'Senior Developer',
			avatar: '👨‍💻'
		},
		{
			text: "I use it for everything - emails, planning, research. Can't imagine work without it.",
			author: 'Emily Rodriguez',
			role: 'Product Manager',
			avatar: '👩‍💼'
		}
	];
	
	onMount(() => {
		mounted = true;
		setTimeout(() => heroLoaded = true, 100);
		
		// Handle mouse movement for parallax
		const handleMouseMove = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth - 0.5) * 20;
			const y = (e.clientY / window.innerHeight - 0.5) * 20;
			mouseX.set(x);
			mouseY.set(y);
		};
		
		// Rotate testimonials
		const testimonialInterval = setInterval(() => {
			currentTestimonial = (currentTestimonial + 1) % testimonials.length;
		}, 5000);
		
		// Rotate features
		const featureInterval = setInterval(() => {
			activeFeature = (activeFeature + 1) % 3;
		}, 4000);
		
		window.addEventListener('mousemove', handleMouseMove);
		
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			clearInterval(testimonialInterval);
			clearInterval(featureInterval);
		};
	});
	
	// Validate phone number
	function validatePhone(number: string): boolean {
		const digits = number.replace(/\D/g, '');
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
		localStorage.setItem('obt-phone-number', phoneNumber);
		
		// Simulate connection animation
		setTimeout(() => {
			isLinking = false;
			goto('/demo');
		}, 1500);
	}
	
	// Format phone number as user types
	function formatPhoneNumber(value: string) {
		const digits = value.replace(/\D/g, '');
		
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
	<title>OBT Helper GPT - AI That Speaks Your Language | WhatsApp AI Assistant</title>
	<meta name="description" content="Transform your WhatsApp into an AI powerhouse. Get instant help with writing, coding, analysis, and more. Join 50,000+ users revolutionizing their productivity.">
</svelte:head>

<div class="homepage-2025">
	<!-- Animated Background -->
	<div class="animated-bg">
		<div class="gradient-orb orb-1" style="transform: translate({$mouseX}px, {$mouseY}px)"></div>
		<div class="gradient-orb orb-2" style="transform: translate({-$mouseX}px, {-$mouseY}px)"></div>
		<div class="gradient-orb orb-3" style="transform: translate({$mouseX * 0.5}px, {$mouseY * 0.5}px)"></div>
		<div class="mesh-gradient"></div>
	</div>
	
	<!-- Hero Section - Epic & Immersive -->
	{#if mounted}
		<section class="hero-2025" in:fade={{ duration: 800 }}>
			<div class="hero-content-wrapper">
				<!-- Floating UI Elements -->
				<div class="floating-ui-elements">
					<div class="floating-card-demo card-1" style="transform: translate({$mouseX * 0.3}px, {$mouseY * 0.3}px)">
						<span class="tool-icon">🤖</span>
						<span class="tool-label">AI Assistant</span>
					</div>
					<div class="floating-card-demo card-2" style="transform: translate({$mouseX * -0.2}px, {$mouseY * -0.2}px)">
						<span class="tool-icon">💻</span>
						<span class="tool-label">Code Helper</span>
					</div>
					<div class="floating-card-demo card-3" style="transform: translate({$mouseX * 0.4}px, {$mouseY * -0.3}px)">
						<span class="tool-icon">✍️</span>
						<span class="tool-label">Writer Pro</span>
					</div>
				</div>
				
				<!-- Main Hero Content -->
				<div class="hero-main">
					{#if heroLoaded}
						<div class="hero-badge" in:fly={{ y: -20, duration: 600, delay: 200 }}>
							<span class="badge-icon">🚀</span>
							<span class="badge-text">50,000+ Users Trust Us</span>
						</div>
						
						<h1 class="hero-title-2025" in:fly={{ y: 20, duration: 800, delay: 400 }}>
							Your AI Assistant
							<span class="title-gradient">Lives in WhatsApp</span>
							<span class="title-emoji">💬</span>
						</h1>
						
						<p class="hero-subtitle-2025" in:fly={{ y: 20, duration: 800, delay: 600 }}>
							No apps. No downloads. Just text your new AI companion and watch the magic happen.
							<br />
							<span class="subtitle-highlight">10+ specialized tools at your fingertips.</span>
						</p>
						
						<!-- CTA Section with Phone Input -->
						<div class="hero-cta-section" in:scale={{ duration: 600, delay: 800 }}>
							<form on:submit|preventDefault={handleWhatsAppLink} class="hero-form">
								<div class="input-wrapper">
									<div class="input-icon">📱</div>
									<input
										type="tel"
										bind:value={phoneNumber}
										on:input={(e) => formatPhoneNumber(e.currentTarget.value)}
										placeholder="Enter your WhatsApp number"
										class="hero-input"
										class:error={phoneError}
										disabled={isLinking}
										autocomplete="tel"
									/>
									<button 
										type="submit" 
										class="hero-cta-button"
										class:loading={isLinking}
										disabled={isLinking}
									>
										{#if isLinking}
											<span class="button-spinner"></span>
										{:else}
											<span>Start Free</span>
											<span class="button-icon">→</span>
										{/if}
									</button>
								</div>
								{#if phoneError}
									<p class="error-message" in:fly={{ y: -10, duration: 300 }}>{phoneError}</p>
								{/if}
							</form>
							
							<div class="cta-features">
								<span class="cta-feature">
									<span class="feature-icon">✅</span>
									No Credit Card
								</span>
								<span class="cta-feature">
									<span class="feature-icon">⚡</span>
									Instant Setup
								</span>
								<span class="cta-feature">
									<span class="feature-icon">🔒</span>
									100% Private
								</span>
							</div>
						</div>
					{/if}
				</div>
				
				<!-- Live Demo Preview -->
				{#if heroLoaded}
					<div class="live-demo-preview" in:fly={{ x: 50, duration: 800, delay: 1000 }}>
						<div class="demo-phone">
							<div class="phone-notch"></div>
							<div class="demo-chat">
								<div class="chat-header">
									<span class="chat-avatar">🤖</span>
									<span class="chat-name">OBT Assistant</span>
									<span class="chat-status">● Online</span>
								</div>
								<div class="chat-messages">
									{#each chatMessages as message, i}
										<div 
											class="chat-message {message.type}"
											in:fly={{ x: message.type === 'user' ? 20 : -20, delay: 1200 + i * 300 }}
										>
											{message.text}
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</section>
	{/if}
	
	<!-- Social Proof Stats -->
	<section class="stats-section">
		<div class="stats-wrapper">
			{#each stats as stat, i}
				<div class="stat-card" in:scale={{ delay: 200 + i * 100, duration: 600 }}>
					<div class="stat-number">{stat.number}</div>
					<div class="stat-label">{stat.label}</div>
				</div>
			{/each}
		</div>
	</section>
	
	<!-- Interactive Feature Showcase -->
	<section class="features-showcase">
		<div class="showcase-container">
			<h2 class="section-title-2025">
				<span class="title-label">WHY CHOOSE US</span>
				Experience the Future of AI Assistance
			</h2>
			
			<div class="showcase-grid">
				<!-- Feature Cards -->
				<div class="feature-cards">
					<button 
						class="feature-card-2025"
						class:active={activeFeature === 0}
						on:click={() => activeFeature = 0}
					>
						<div class="feature-icon-wrapper">
							<span class="feature-icon">🎯</span>
						</div>
						<h3>Instant Responses</h3>
						<p>Get answers in seconds, not minutes. Our AI is always ready.</p>
					</button>
					
					<button 
						class="feature-card-2025"
						class:active={activeFeature === 1}
						on:click={() => activeFeature = 1}
					>
						<div class="feature-icon-wrapper">
							<span class="feature-icon">🧠</span>
						</div>
						<h3>Context Aware</h3>
						<p>Remembers your conversations and learns your preferences.</p>
					</button>
					
					<button 
						class="feature-card-2025"
						class:active={activeFeature === 2}
						on:click={() => activeFeature = 2}
					>
						<div class="feature-icon-wrapper">
							<span class="feature-icon">🛡️</span>
						</div>
						<h3>Privacy First</h3>
						<p>Your data stays yours. End-to-end encryption always.</p>
					</button>
				</div>
				
				<!-- Feature Display -->
				<div class="feature-display">
					{#if activeFeature === 0}
						<div class="display-content" in:fade={{ duration: 300 }}>
							<div class="speed-demo">
								<div class="speed-bar">
									<div class="speed-fill"></div>
								</div>
								<p class="speed-text">Average response time: <strong>1.2 seconds</strong></p>
							</div>
						</div>
					{:else if activeFeature === 1}
						<div class="display-content" in:fade={{ duration: 300 }}>
							<div class="context-demo">
								<div class="memory-item">📝 Remembers your writing style</div>
								<div class="memory-item">🎨 Knows your preferences</div>
								<div class="memory-item">📊 Learns from feedback</div>
							</div>
						</div>
					{:else}
						<div class="display-content" in:fade={{ duration: 300 }}>
							<div class="security-badges">
								<div class="security-badge">🔐 E2E Encrypted</div>
								<div class="security-badge">🚫 No Data Selling</div>
								<div class="security-badge">🗑️ Auto-Delete Option</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>
	
	<!-- Tool Grid - Modern & Engaging -->
	<section class="tools-section-2025">
		<div class="tools-container">
			<h2 class="section-title-2025">
				<span class="title-label">OUR TOOLS</span>
				One Number. Endless Possibilities.
			</h2>
			
			<div class="tools-grid-2025">
				{#each tools as tool, i}
					<button 
						class="tool-card-2025"
						on:click={() => goto(`/chat/${tool.id}`)}
						in:scale={{ delay: 100 + i * 50, duration: 500 }}
					>
						<div class="tool-glow"></div>
						<div class="tool-content">
							<span class="tool-emoji">{tool.icon}</span>
							<h3 class="tool-name">{tool.name}</h3>
							<p class="tool-description">{tool.description}</p>
							<div class="tool-meta">
								<span class="tool-model">{tool.model}</span>
								<span class="tool-arrow">→</span>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</section>
	
	<!-- Testimonials - Auto-rotating -->
	<section class="testimonials-2025">
		<div class="testimonials-container">
			<h2 class="section-title-2025">
				<span class="title-label">TESTIMONIALS</span>
				Join Thousands of Happy Users
			</h2>
			
			<div class="testimonial-wrapper">
				{#key currentTestimonial}
					<div class="testimonial-card-2025" in:scale={{ duration: 500 }}>
						<div class="quote-icon">"</div>
						<p class="testimonial-text">{testimonials[currentTestimonial].text}</p>
						<div class="testimonial-author">
							<span class="author-avatar">{testimonials[currentTestimonial].avatar}</span>
							<div class="author-info">
								<p class="author-name">{testimonials[currentTestimonial].author}</p>
								<p class="author-role">{testimonials[currentTestimonial].role}</p>
							</div>
						</div>
					</div>
				{/key}
				
				<!-- Testimonial dots -->
				<div class="testimonial-dots">
					{#each testimonials as _, i}
						<button 
							class="dot"
							class:active={i === currentTestimonial}
							on:click={() => currentTestimonial = i}
						></button>
					{/each}
				</div>
			</div>
		</div>
	</section>
	
	<!-- Final CTA -->
	<section class="final-cta-2025">
		<div class="cta-container">
			<h2 class="cta-title">Ready to Transform Your WhatsApp?</h2>
			<p class="cta-subtitle">Join 50,000+ users who've already upgraded their messaging experience</p>
			<button 
				class="cta-button-large"
				on:click={() => document.querySelector('.hero-input')?.focus()}
			>
				<span>Get Started Now</span>
				<span class="button-sparkle">✨</span>
			</button>
		</div>
	</section>
</div>

<style>
	/* 2025 Homepage Styles - Epic & Immersive */
	.homepage-2025 {
		position: relative;
		overflow: hidden;
		background: var(--background-primary);
	}
	
	/* Animated Background */
	.animated-bg {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}
	
	.gradient-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.6;
		animation: float 20s ease-in-out infinite;
	}
	
	.orb-1 {
		width: 600px;
		height: 600px;
		background: radial-gradient(circle, #007AFF 0%, transparent 70%);
		top: -200px;
		left: -200px;
	}
	
	.orb-2 {
		width: 500px;
		height: 500px;
		background: radial-gradient(circle, #00D4FF 0%, transparent 70%);
		bottom: -150px;
		right: -150px;
		animation-delay: -5s;
	}
	
	.orb-3 {
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, #FF6B6B 0%, transparent 70%);
		top: 50%;
		left: 50%;
		animation-delay: -10s;
	}
	
	.mesh-gradient {
		position: absolute;
		inset: 0;
		background-image: 
			radial-gradient(at 40% 20%, hsla(210, 100%, 56%, 0.3) 0px, transparent 50%),
			radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.3) 0px, transparent 50%),
			radial-gradient(at 0% 50%, hsla(355, 100%, 70%, 0.3) 0px, transparent 50%);
		opacity: 0.4;
	}
	
	@keyframes float {
		0%, 100% { transform: translate(0, 0) scale(1); }
		33% { transform: translate(30px, -30px) scale(1.1); }
		66% { transform: translate(-20px, 20px) scale(0.9); }
	}
	
	/* Hero Section 2025 */
	.hero-2025 {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		padding: var(--space-8) var(--space-6);
		z-index: 1;
	}
	
	.hero-content-wrapper {
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-12);
		align-items: center;
	}
	
	/* Floating UI Elements */
	.floating-ui-elements {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
	}
	
	.floating-card-demo {
		position: absolute;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		padding: 12px 20px;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: transform 0.3s ease;
	}
	
	.card-1 {
		top: 20%;
		left: 10%;
		animation: float-slow 15s ease-in-out infinite;
	}
	
	.card-2 {
		top: 60%;
		right: 15%;
		animation: float-slow 20s ease-in-out infinite reverse;
	}
	
	.card-3 {
		bottom: 30%;
		left: 20%;
		animation: float-slow 18s ease-in-out infinite;
		animation-delay: -5s;
	}
	
	@keyframes float-slow {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-20px); }
	}
	
	.tool-icon {
		font-size: 1.5rem;
	}
	
	.tool-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	/* Hero Main Content */
	.hero-main {
		position: relative;
		z-index: 2;
	}
	
	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: linear-gradient(135deg, #007AFF, #00D4FF);
		color: white;
		padding: 8px 16px;
		border-radius: 24px;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: var(--space-6);
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
	
	.hero-title-2025 {
		font-size: clamp(3rem, 8vw, 5rem);
		font-weight: 800;
		line-height: 1.1;
		margin-bottom: var(--space-6);
		letter-spacing: -0.02em;
	}
	
	.title-gradient {
		background: linear-gradient(135deg, #007AFF, #00D4FF, #FF6B6B);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		display: block;
	}
	
	.title-emoji {
		display: inline-block;
		font-size: 0.8em;
		animation: bounce 2s ease-in-out infinite;
		margin-left: 0.2em;
	}
	
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}
	
	.hero-subtitle-2025 {
		font-size: clamp(1.125rem, 2vw, 1.5rem);
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: var(--space-8);
		max-width: 600px;
	}
	
	.subtitle-highlight {
		color: var(--text-primary);
		font-weight: 600;
	}
	
	/* Hero CTA Section */
	.hero-cta-section {
		max-width: 500px;
	}
	
	.hero-form {
		margin-bottom: var(--space-4);
	}
	
	.input-wrapper {
		position: relative;
		display: flex;
		background: white;
		border-radius: 64px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
		overflow: hidden;
		transition: all 0.3s ease;
	}
	
	.input-wrapper:focus-within {
		box-shadow: 0 12px 48px rgba(0, 122, 255, 0.25);
		transform: translateY(-2px);
	}
	
	.input-icon {
		position: absolute;
		left: 24px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 1.5rem;
		pointer-events: none;
	}
	
	.hero-input {
		flex: 1;
		padding: 20px 24px 20px 60px;
		font-size: 1.125rem;
		border: none;
		background: transparent;
		color: var(--text-primary);
		outline: none;
	}
	
	.hero-input::placeholder {
		color: var(--text-tertiary);
	}
	
	.hero-cta-button {
		padding: 20px 32px;
		background: linear-gradient(135deg, #007AFF, #0051D5);
		color: white;
		border: none;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: all 0.3s ease;
		white-space: nowrap;
	}
	
	.hero-cta-button:hover:not(.loading) {
		background: linear-gradient(135deg, #0051D5, #003D9D);
		transform: translateX(2px);
	}
	
	.hero-cta-button.loading {
		pointer-events: none;
		opacity: 0.8;
	}
	
	.button-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	
	.button-icon {
		transition: transform 0.3s ease;
	}
	
	.hero-cta-button:hover .button-icon {
		transform: translateX(4px);
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.error-message {
		color: var(--error);
		font-size: 0.875rem;
		margin-top: 8px;
		padding-left: 24px;
	}
	
	.cta-features {
		display: flex;
		gap: var(--space-6);
		justify-content: center;
	}
	
	.cta-feature {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.feature-icon {
		font-size: 1rem;
		color: var(--primary);
	}
	
	/* Live Demo Preview */
	.live-demo-preview {
		position: relative;
		z-index: 2;
	}
	
	.demo-phone {
		width: 320px;
		height: 640px;
		background: #000;
		border-radius: 36px;
		padding: 12px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		position: relative;
		overflow: hidden;
	}
	
	.phone-notch {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 120px;
		height: 30px;
		background: #000;
		border-radius: 0 0 16px 16px;
		z-index: 10;
	}
	
	.demo-chat {
		background: white;
		height: 100%;
		border-radius: 24px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	
	.chat-header {
		background: #f0f0f0;
		padding: 48px 20px 16px;
		display: flex;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid #e0e0e0;
	}
	
	.chat-avatar {
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, #007AFF, #00D4FF);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
	}
	
	.chat-name {
		flex: 1;
		font-weight: 600;
		color: #1a1a1a;
	}
	
	.chat-status {
		font-size: 0.75rem;
		color: #25D366;
	}
	
	.chat-messages {
		flex: 1;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		background: #f5f5f5;
	}
	
	.chat-message {
		max-width: 70%;
		padding: 12px 16px;
		border-radius: 18px;
		font-size: 0.875rem;
		line-height: 1.4;
		animation: message-pop 0.3s ease;
	}
	
	.chat-message.user {
		align-self: flex-end;
		background: #007AFF;
		color: white;
		border-bottom-right-radius: 4px;
	}
	
	.chat-message.assistant {
		align-self: flex-start;
		background: white;
		color: #1a1a1a;
		border-bottom-left-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}
	
	@keyframes message-pop {
		from {
			opacity: 0;
			transform: scale(0.8) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
	
	/* Stats Section */
	.stats-section {
		padding: var(--space-16) var(--space-6);
		background: rgba(255, 255, 255, 0.02);
		backdrop-filter: blur(10px);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		position: relative;
		z-index: 1;
	}
	
	.stats-wrapper {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-8);
	}
	
	.stat-card {
		text-align: center;
		padding: var(--space-6);
		background: rgba(255, 255, 255, 0.05);
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
	}
	
	.stat-card:hover {
		transform: translateY(-4px);
		background: rgba(255, 255, 255, 0.08);
		box-shadow: 0 8px 32px rgba(0, 122, 255, 0.1);
	}
	
	.stat-number {
		font-size: 3rem;
		font-weight: 800;
		background: linear-gradient(135deg, #007AFF, #00D4FF);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: var(--space-2);
	}
	
	.stat-label {
		font-size: 1.125rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	/* Features Showcase */
	.features-showcase {
		padding: var(--space-20) var(--space-6);
		position: relative;
		z-index: 1;
	}
	
	.showcase-container {
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.section-title-2025 {
		text-align: center;
		margin-bottom: var(--space-16);
	}
	
	.title-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--primary);
		letter-spacing: 0.1em;
		margin-bottom: var(--space-3);
	}
	
	.section-title-2025 {
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 800;
		line-height: 1.2;
		color: var(--text-primary);
	}
	
	.showcase-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-12);
		align-items: center;
	}
	
	.feature-cards {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.feature-card-2025 {
		padding: var(--space-6);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		text-align: left;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}
	
	.feature-card-2025:hover {
		transform: translateX(8px);
		background: rgba(255, 255, 255, 0.08);
	}
	
	.feature-card-2025.active {
		background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 212, 255, 0.1));
		border-color: var(--primary);
		transform: translateX(8px);
	}
	
	.feature-icon-wrapper {
		width: 60px;
		height: 60px;
		background: linear-gradient(135deg, #007AFF, #00D4FF);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.feature-icon {
		font-size: 2rem;
	}
	
	.feature-card-2025 h3 {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: var(--space-2);
		color: var(--text-primary);
	}
	
	.feature-card-2025 p {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	.feature-display {
		height: 400px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8);
	}
	
	.display-content {
		width: 100%;
		text-align: center;
	}
	
	.speed-demo {
		max-width: 300px;
		margin: 0 auto;
	}
	
	.speed-bar {
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: var(--space-4);
	}
	
	.speed-fill {
		height: 100%;
		width: 0;
		background: linear-gradient(90deg, #007AFF, #00D4FF);
		border-radius: 4px;
		animation: speed-fill 2s ease forwards;
	}
	
	@keyframes speed-fill {
		to { width: 85%; }
	}
	
	.speed-text {
		font-size: 1.125rem;
		color: var(--text-secondary);
	}
	
	.speed-text strong {
		color: var(--primary);
		font-size: 1.5rem;
	}
	
	.context-demo,
	.security-badges {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 400px;
		margin: 0 auto;
	}
	
	.memory-item,
	.security-badge {
		padding: var(--space-4) var(--space-6);
		background: rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		font-size: 1.125rem;
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	
	/* Tools Section */
	.tools-section-2025 {
		padding: var(--space-20) var(--space-6);
		background: rgba(0, 0, 0, 0.02);
		position: relative;
		z-index: 1;
	}
	
	.tools-container {
		max-width: 1400px;
		margin: 0 auto;
	}
	
	.tools-grid-2025 {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-6);
		margin-top: var(--space-12);
	}
	
	.tool-card-2025 {
		position: relative;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 24px;
		padding: var(--space-8);
		cursor: pointer;
		transition: all 0.3s ease;
		overflow: hidden;
		text-align: left;
	}
	
	.tool-glow {
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}
	
	.tool-card-2025:hover {
		transform: translateY(-8px);
		border-color: var(--primary);
		box-shadow: 0 20px 40px rgba(0, 122, 255, 0.2);
	}
	
	.tool-card-2025:hover .tool-glow {
		opacity: 0.1;
	}
	
	.tool-content {
		position: relative;
		z-index: 1;
	}
	
	.tool-emoji {
		font-size: 3rem;
		display: block;
		margin-bottom: var(--space-4);
		animation: float-gentle 4s ease-in-out infinite;
	}
	
	@keyframes float-gentle {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-5px); }
	}
	
	.tool-name {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: var(--space-3);
		color: var(--text-primary);
	}
	
	.tool-description {
		font-size: 1rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: var(--space-6);
	}
	
	.tool-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.tool-model {
		font-size: 0.875rem;
		padding: 6px 12px;
		background: rgba(0, 122, 255, 0.1);
		color: var(--primary);
		border-radius: 20px;
		font-weight: 500;
	}
	
	.tool-arrow {
		font-size: 1.5rem;
		color: var(--primary);
		transition: transform 0.3s ease;
	}
	
	.tool-card-2025:hover .tool-arrow {
		transform: translateX(4px);
	}
	
	/* Testimonials */
	.testimonials-2025 {
		padding: var(--space-20) var(--space-6);
		position: relative;
		z-index: 1;
	}
	
	.testimonials-container {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}
	
	.testimonial-wrapper {
		margin-top: var(--space-12);
	}
	
	.testimonial-card-2025 {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 24px;
		padding: var(--space-12);
		position: relative;
	}
	
	.quote-icon {
		position: absolute;
		top: var(--space-6);
		left: var(--space-6);
		font-size: 4rem;
		color: var(--primary);
		opacity: 0.2;
		font-family: Georgia, serif;
	}
	
	.testimonial-text {
		font-size: 1.5rem;
		line-height: 1.6;
		color: var(--text-primary);
		margin-bottom: var(--space-8);
		font-style: italic;
	}
	
	.testimonial-author {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
	}
	
	.author-avatar {
		font-size: 3rem;
	}
	
	.author-info {
		text-align: left;
	}
	
	.author-name {
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	
	.author-role {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.testimonial-dots {
		display: flex;
		justify-content: center;
		gap: var(--space-2);
		margin-top: var(--space-6);
	}
	
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		border: none;
		cursor: pointer;
		transition: all 0.3s ease;
		padding: 0;
	}
	
	.dot.active {
		width: 24px;
		border-radius: 4px;
		background: var(--primary);
	}
	
	/* Final CTA */
	.final-cta-2025 {
		padding: var(--space-20) var(--space-6);
		background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(0, 212, 255, 0.05));
		position: relative;
		z-index: 1;
		text-align: center;
	}
	
	.cta-container {
		max-width: 800px;
		margin: 0 auto;
	}
	
	.cta-title {
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 800;
		margin-bottom: var(--space-4);
		background: linear-gradient(135deg, #007AFF, #00D4FF);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.cta-subtitle {
		font-size: 1.25rem;
		color: var(--text-secondary);
		margin-bottom: var(--space-8);
	}
	
	.cta-button-large {
		padding: 24px 48px;
		font-size: 1.25rem;
		font-weight: 700;
		background: linear-gradient(135deg, #007AFF, #0051D5);
		color: white;
		border: none;
		border-radius: 64px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 12px;
		transition: all 0.3s ease;
		box-shadow: 0 8px 32px rgba(0, 122, 255, 0.3);
	}
	
	.cta-button-large:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 48px rgba(0, 122, 255, 0.4);
	}
	
	.button-sparkle {
		font-size: 1.5rem;
		animation: sparkle 2s ease-in-out infinite;
	}
	
	@keyframes sparkle {
		0%, 100% { opacity: 1; transform: rotate(0deg) scale(1); }
		50% { opacity: 0.8; transform: rotate(180deg) scale(1.2); }
	}
	
	/* Mobile Responsive - Make it look amazing on phones too! */
	@media (max-width: 768px) {
		.hero-content-wrapper {
			grid-template-columns: 1fr;
			text-align: center;
		}
		
		.live-demo-preview {
			display: none; /* Hide on mobile for better performance */
		}
		
		.floating-ui-elements {
			display: none; /* Simplify mobile experience */
		}
		
		.hero-title-2025 {
			font-size: clamp(2.5rem, 10vw, 3.5rem);
		}
		
		.input-wrapper {
			flex-direction: column;
			border-radius: 16px;
		}
		
		.hero-input {
			padding: 16px 16px 16px 56px;
			font-size: 16px; /* Prevent zoom */
		}
		
		.hero-cta-button {
			width: 100%;
			justify-content: center;
			padding: 16px;
			border-radius: 16px;
		}
		
		.cta-features {
			flex-wrap: wrap;
			gap: var(--space-3);
		}
		
		.showcase-grid {
			grid-template-columns: 1fr;
			gap: var(--space-8);
		}
		
		.tools-grid-2025 {
			grid-template-columns: 1fr;
		}
		
		.stat-number {
			font-size: 2.5rem;
		}
		
		.testimonial-text {
			font-size: 1.125rem;
		}
		
		.gradient-orb {
			filter: blur(60px);
		}
		
		.orb-1, .orb-2, .orb-3 {
			width: 300px;
			height: 300px;
		}
	}
	
	/* Dark mode adjustments */
	@media (prefers-color-scheme: dark) {
		.demo-chat {
			background: #1a1a1a;
		}
		
		.chat-header {
			background: #2a2a2a;
			border-bottom-color: #3a3a3a;
		}
		
		.chat-messages {
			background: #1a1a1a;
		}
		
		.chat-message.assistant {
			background: #2a2a2a;
			color: white;
		}
		
		.input-wrapper {
			background: rgba(255, 255, 255, 0.05);
		}
		
		.hero-input {
			color: white;
		}
	}
</style> 