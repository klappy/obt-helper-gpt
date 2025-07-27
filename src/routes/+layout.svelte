<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';
	
	let scrollY = 0;
	let isScrolled = false;
	let mobileMenuOpen = false;
	let mouseX = spring(0, { stiffness: 0.1, damping: 0.9 });
	let mouseY = spring(0, { stiffness: 0.1, damping: 0.9 });
	
	onMount(() => {
		const handleScroll = () => {
			scrollY = window.scrollY;
			isScrolled = scrollY > 20;
		};
		
		const handleMouseMove = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth - 0.5) * 10;
			const y = (e.clientY / window.innerHeight - 0.5) * 10;
			mouseX.set(x);
			mouseY.set(y);
		};
		
		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('mousemove', handleMouseMove);
		
		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('mousemove', handleMouseMove);
		};
	});
	
	const navLinks = [
		{ href: '/', label: 'Home', icon: '🏠' },
		{ href: '/demo', label: 'Demo', icon: '🎮' },
		{ href: '/admin', label: 'Admin', icon: '⚙️' }
	];
	
	const footerLinks = {
		product: [
			{ href: '/demo', label: 'Live Demo' },
			{ href: '#tools', label: 'AI Tools' },
			{ href: '#pricing', label: 'Pricing' }
		],
		company: [
			{ href: '#about', label: 'About Us' },
			{ href: '#blog', label: 'Blog' },
			{ href: '#careers', label: 'Careers' }
		],
		support: [
			{ href: '#help', label: 'Help Center' },
			{ href: '#contact', label: 'Contact' },
			{ href: '#status', label: 'System Status' }
		]
	};
	
	const socialLinks = [
		{ icon: '𝕏', href: '#', label: 'Twitter' },
		{ icon: '📧', href: '#', label: 'Email' },
		{ icon: '💼', href: '#', label: 'LinkedIn' }
	];
</script>

<div class="app-wrapper">
	<!-- Animated Background (Global) -->
	<div class="global-bg">
		<div class="bg-gradient-1" style="transform: translate({$mouseX * 0.5}px, {$mouseY * 0.5}px)"></div>
		<div class="bg-gradient-2" style="transform: translate({-$mouseX * 0.3}px, {-$mouseY * 0.3}px)"></div>
	</div>

	<!-- Epic 2025 Navigation Header -->
	<nav class="nav-2025" class:scrolled={isScrolled}>
		<div class="nav-blur"></div>
		<div class="nav-container">
			<!-- Logo Section -->
			<a href="/" class="nav-logo" aria-label="OBT Helper GPT Home">
				<span class="logo-icon">🤖</span>
				<span class="logo-text">
					<span class="logo-primary">OBT</span>
					<span class="logo-secondary">Helper</span>
				</span>
				<span class="logo-badge">GPT</span>
			</a>
			
			<!-- Desktop Navigation -->
			<div class="nav-links desktop-only">
				{#each navLinks as link}
					<a 
						href={link.href} 
						class="nav-link"
						class:active={$page.url.pathname === link.href}
						aria-current={$page.url.pathname === link.href ? 'page' : undefined}
					>
						<span class="nav-icon">{link.icon}</span>
						<span class="nav-label">{link.label}</span>
						{#if $page.url.pathname === link.href}
							<span class="nav-indicator"></span>
						{/if}
					</a>
				{/each}
			</div>
			
			<!-- CTA Buttons -->
			<div class="nav-actions">
				<a href="/demo" class="nav-cta-secondary desktop-only">
					<span>Try Demo</span>
				</a>
				<a href="/#start" class="nav-cta-primary">
					<span>Get Started</span>
					<span class="cta-sparkle">✨</span>
				</a>
				
				<!-- Mobile Menu Toggle -->
				<button 
					class="mobile-menu-toggle mobile-only"
					on:click={() => mobileMenuOpen = !mobileMenuOpen}
					aria-label="Toggle menu"
					aria-expanded={mobileMenuOpen}
				>
					<span class="menu-icon" class:open={mobileMenuOpen}>
						<span></span>
						<span></span>
						<span></span>
					</span>
				</button>
			</div>
		</div>
		
		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="mobile-menu" transition:fly={{ y: -20, duration: 300 }}>
				<div class="mobile-menu-content">
					{#each navLinks as link}
						<a 
							href={link.href} 
							class="mobile-nav-link"
							class:active={$page.url.pathname === link.href}
							on:click={() => mobileMenuOpen = false}
						>
							<span class="nav-icon">{link.icon}</span>
							<span>{link.label}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</nav>

	<!-- Main Content -->
	<main class="main-2025">
		<slot />
	</main>

	<!-- Epic 2025 Footer -->
	<footer class="footer-2025">
		<!-- Decorative Wave -->
		<div class="footer-wave">
			<svg viewBox="0 0 1440 120" preserveAspectRatio="none">
				<path d="M0,20 C480,120 960,120 1440,20 L1440,120 L0,120 Z" fill="currentColor" />
			</svg>
		</div>
		
		<div class="footer-container">
			<!-- Main Footer Content -->
			<div class="footer-content">
				<!-- Brand Section -->
				<div class="footer-brand">
					<div class="footer-logo">
						<span class="logo-icon">🤖</span>
						<span class="logo-text">OBT Helper GPT</span>
					</div>
					<p class="footer-tagline">
						AI that speaks your language.<br />
						Right in your WhatsApp.
					</p>
					<div class="footer-stats">
						<div class="stat-item">
							<span class="stat-number">50K+</span>
							<span class="stat-label">Users</span>
						</div>
						<div class="stat-item">
							<span class="stat-number">2M+</span>
							<span class="stat-label">Messages</span>
						</div>
					</div>
				</div>
				
				<!-- Links Sections -->
				<div class="footer-links">
					<div class="link-section">
						<h4 class="link-title">Product</h4>
						<ul class="link-list">
							{#each footerLinks.product as link}
								<li>
									<a href={link.href} class="footer-link">
										{link.label}
										<span class="link-arrow">→</span>
									</a>
								</li>
							{/each}
						</ul>
					</div>
					
					<div class="link-section">
						<h4 class="link-title">Company</h4>
						<ul class="link-list">
							{#each footerLinks.company as link}
								<li>
									<a href={link.href} class="footer-link">
										{link.label}
										<span class="link-arrow">→</span>
									</a>
								</li>
							{/each}
						</ul>
					</div>
					
					<div class="link-section">
						<h4 class="link-title">Support</h4>
						<ul class="link-list">
							{#each footerLinks.support as link}
								<li>
									<a href={link.href} class="footer-link">
										{link.label}
										<span class="link-arrow">→</span>
									</a>
								</li>
							{/each}
						</ul>
					</div>
				</div>
				
				<!-- Newsletter Section -->
				<div class="footer-newsletter">
					<h4 class="newsletter-title">Stay Updated</h4>
					<p class="newsletter-text">Get the latest AI tips and updates.</p>
					<form class="newsletter-form" on:submit|preventDefault>
						<input 
							type="email" 
							placeholder="Enter your email"
							class="newsletter-input"
							required
						/>
						<button type="submit" class="newsletter-button">
							<span>Subscribe</span>
							<span class="button-icon">→</span>
						</button>
					</form>
				</div>
			</div>
			
			<!-- Bottom Bar -->
			<div class="footer-bottom">
				<div class="footer-bottom-content">
					<div class="footer-copyright">
						<p>© 2025 OBT Helper GPT. Crafted with 💙 for the future.</p>
					</div>
					
					<div class="footer-social">
						{#each socialLinks as social}
							<a 
								href={social.href} 
								class="social-link"
								aria-label={social.label}
							>
								<span class="social-icon">{social.icon}</span>
							</a>
						{/each}
					</div>
					
					<div class="footer-legal">
						<a href="#privacy" class="legal-link">Privacy</a>
						<span class="legal-separator">•</span>
						<a href="#terms" class="legal-link">Terms</a>
						<span class="legal-separator">•</span>
						<a href="#cookies" class="legal-link">Cookies</a>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Floating Action Button (Mobile) -->
		<a href="/#start" class="fab mobile-only">
			<span class="fab-icon">💬</span>
			<span class="fab-text">Start Chat</span>
		</a>
	</footer>
</div>

<style>
	/* Global App Wrapper */
	.app-wrapper {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow-x: hidden;
	}
	
	/* Global Animated Background */
	.global-bg {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		opacity: 0.5;
	}
	
	.bg-gradient-1,
	.bg-gradient-2 {
		position: absolute;
		width: 800px;
		height: 800px;
		border-radius: 50%;
		filter: blur(100px);
		transition: transform 0.3s ease;
	}
	
	.bg-gradient-1 {
		top: -400px;
		right: -400px;
		background: radial-gradient(circle, #007AFF 0%, transparent 70%);
	}
	
	.bg-gradient-2 {
		bottom: -400px;
		left: -400px;
		background: radial-gradient(circle, #00D4FF 0%, transparent 70%);
	}
	
	/* Epic 2025 Navigation */
	.nav-2025 {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		transition: all 0.3s ease;
	}
	
	.nav-blur {
		position: absolute;
		inset: 0;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		transition: all 0.3s ease;
	}
	
	.nav-2025.scrolled .nav-blur {
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}
	
	@media (prefers-color-scheme: dark) {
		.nav-blur {
			background: rgba(0, 0, 0, 0.8);
			border-bottom-color: rgba(255, 255, 255, 0.1);
		}
		
		.nav-2025.scrolled .nav-blur {
			background: rgba(0, 0, 0, 0.95);
		}
	}
	
	.nav-container {
		position: relative;
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
	}
	
	/* Logo */
	.nav-logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		font-weight: 700;
		font-size: 1.25rem;
		transition: transform 0.3s ease;
	}
	
	.nav-logo:hover {
		transform: scale(1.05);
	}
	
	.logo-icon {
		font-size: 2rem;
		animation: float-gentle 4s ease-in-out infinite;
	}
	
	@keyframes float-gentle {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-3px); }
	}
	
	.logo-text {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
	}
	
	.logo-primary {
		color: var(--text-primary);
		font-weight: 800;
	}
	
	.logo-secondary {
		color: var(--text-secondary);
		font-weight: 600;
	}
	
	.logo-badge {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		background: linear-gradient(135deg, #007AFF, #00D4FF);
		color: white;
		border-radius: 999px;
		font-weight: 600;
		margin-left: 0.5rem;
	}
	
	/* Navigation Links */
	.nav-links {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		justify-content: center;
	}
	
	.nav-link {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		color: var(--text-secondary);
		text-decoration: none;
		font-weight: 500;
		border-radius: 12px;
		transition: all 0.3s ease;
	}
	
	.nav-link:hover {
		color: var(--text-primary);
		background: rgba(0, 122, 255, 0.08);
		transform: translateY(-1px);
	}
	
	.nav-link.active {
		color: var(--primary);
		background: rgba(0, 122, 255, 0.1);
	}
	
	.nav-icon {
		font-size: 1.125rem;
		opacity: 0.8;
	}
	
	.nav-indicator {
		position: absolute;
		bottom: 0.25rem;
		left: 50%;
		transform: translateX(-50%);
		width: 24px;
		height: 3px;
		background: linear-gradient(90deg, #007AFF, #00D4FF);
		border-radius: 999px;
		animation: pulse 2s ease-in-out infinite;
	}
	
	@keyframes pulse {
		0%, 100% { opacity: 1; transform: translateX(-50%) scaleX(1); }
		50% { opacity: 0.8; transform: translateX(-50%) scaleX(0.8); }
	}
	
	/* Navigation Actions */
	.nav-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.nav-cta-secondary,
	.nav-cta-primary {
		padding: 0.75rem 1.5rem;
		border-radius: 999px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.nav-cta-secondary {
		color: var(--text-primary);
		background: rgba(0, 0, 0, 0.05);
	}
	
	.nav-cta-secondary:hover {
		background: rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}
	
	.nav-cta-primary {
		background: linear-gradient(135deg, #007AFF, #0051D5);
		color: white;
		box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
	}
	
	.nav-cta-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 25px rgba(0, 122, 255, 0.4);
	}
	
	.cta-sparkle {
		font-size: 1rem;
		animation: sparkle 2s ease-in-out infinite;
	}
	
	@keyframes sparkle {
		0%, 100% { opacity: 1; transform: rotate(0deg) scale(1); }
		50% { opacity: 0.7; transform: rotate(180deg) scale(1.2); }
	}
	
	/* Mobile Menu Toggle */
	.mobile-menu-toggle {
		display: none;
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
	}
	
	.menu-icon {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 24px;
		height: 24px;
		position: relative;
	}
	
	.menu-icon span {
		display: block;
		width: 100%;
		height: 2px;
		background: var(--text-primary);
		border-radius: 2px;
		transition: all 0.3s ease;
		position: absolute;
	}
	
	.menu-icon span:nth-child(1) { top: 0; }
	.menu-icon span:nth-child(2) { top: 50%; transform: translateY(-50%); }
	.menu-icon span:nth-child(3) { bottom: 0; }
	
	.menu-icon.open span:nth-child(1) {
		top: 50%;
		transform: translateY(-50%) rotate(45deg);
	}
	
	.menu-icon.open span:nth-child(2) {
		opacity: 0;
	}
	
	.menu-icon.open span:nth-child(3) {
		bottom: 50%;
		transform: translateY(50%) rotate(-45deg);
	}
	
	/* Mobile Menu */
	.mobile-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}
	
	.mobile-menu-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.mobile-nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		color: var(--text-primary);
		text-decoration: none;
		font-weight: 500;
		border-radius: 12px;
		transition: all 0.3s ease;
	}
	
	.mobile-nav-link:hover,
	.mobile-nav-link.active {
		background: rgba(0, 122, 255, 0.1);
		color: var(--primary);
	}
	
	/* Main Content */
	.main-2025 {
		flex: 1;
		padding-top: 80px; /* Account for fixed nav */
		position: relative;
		z-index: 1;
	}
	
	/* Epic 2025 Footer */
	.footer-2025 {
		position: relative;
		background: linear-gradient(to bottom, var(--background-primary), var(--surface-1));
		margin-top: 5rem;
		overflow: hidden;
	}
	
	.footer-wave {
		position: absolute;
		top: -119px;
		left: 0;
		right: 0;
		height: 120px;
		color: var(--surface-1);
		z-index: 1;
	}
	
	.footer-wave svg {
		width: 100%;
		height: 100%;
	}
	
	.footer-container {
		position: relative;
		z-index: 2;
		max-width: 1400px;
		margin: 0 auto;
		padding: 5rem 2rem 2rem;
	}
	
	.footer-content {
		display: grid;
		grid-template-columns: 2fr 3fr 1.5fr;
		gap: 4rem;
		margin-bottom: 4rem;
	}
	
	/* Footer Brand */
	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.footer-logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--text-primary);
	}
	
	.footer-tagline {
		color: var(--text-secondary);
		line-height: 1.6;
		font-size: 1.125rem;
	}
	
	.footer-stats {
		display: flex;
		gap: 2rem;
	}
	
	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.stat-number {
		font-size: 1.5rem;
		font-weight: 800;
		background: linear-gradient(135deg, #007AFF, #00D4FF);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.stat-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	/* Footer Links */
	.footer-links {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
	}
	
	.link-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.link-title {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}
	
	.link-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.footer-link {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.95rem;
		transition: all 0.3s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.footer-link:hover {
		color: var(--primary);
		transform: translateX(4px);
	}
	
	.link-arrow {
		opacity: 0;
		transform: translateX(-4px);
		transition: all 0.3s ease;
		font-size: 0.875rem;
	}
	
	.footer-link:hover .link-arrow {
		opacity: 1;
		transform: translateX(0);
	}
	
	/* Newsletter */
	.footer-newsletter {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.newsletter-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	
	.newsletter-text {
		color: var(--text-secondary);
		font-size: 0.95rem;
	}
	
	.newsletter-form {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}
	
	.newsletter-input {
		flex: 1;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		color: var(--text-primary);
		font-size: 0.95rem;
		transition: all 0.3s ease;
	}
	
	.newsletter-input::placeholder {
		color: var(--text-tertiary);
	}
	
	.newsletter-input:focus {
		outline: none;
		border-color: var(--primary);
		background: rgba(255, 255, 255, 0.15);
	}
	
	.newsletter-button {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #007AFF, #0051D5);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
	}
	
	.newsletter-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
	}
	
	.button-icon {
		transition: transform 0.3s ease;
	}
	
	.newsletter-button:hover .button-icon {
		transform: translateX(2px);
	}
	
	/* Footer Bottom */
	.footer-bottom {
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		padding-top: 2rem;
	}
	
	.footer-bottom-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 2rem;
	}
	
	.footer-copyright {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.footer-social {
		display: flex;
		gap: 0.75rem;
	}
	
	.social-link {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 50%;
		color: var(--text-primary);
		text-decoration: none;
		transition: all 0.3s ease;
		font-size: 1.25rem;
	}
	
	.social-link:hover {
		background: linear-gradient(135deg, #007AFF, #00D4FF);
		color: white;
		transform: translateY(-4px) scale(1.1);
	}
	
	.footer-legal {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.875rem;
	}
	
	.legal-link {
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 0.3s ease;
	}
	
	.legal-link:hover {
		color: var(--primary);
	}
	
	.legal-separator {
		color: var(--text-tertiary);
		font-size: 0.625rem;
	}
	
	/* Floating Action Button */
	.fab {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, #25D366, #128C7E);
		color: white;
		text-decoration: none;
		border-radius: 999px;
		font-weight: 600;
		box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
		transition: all 0.3s ease;
	}
	
	.fab:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 30px rgba(37, 211, 102, 0.5);
	}
	
	.fab-icon {
		font-size: 1.5rem;
		animation: bounce 2s ease-in-out infinite;
	}
	
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4px); }
	}
	
	/* Responsive Utilities */
	.desktop-only {
		display: flex;
	}
	
	.mobile-only {
		display: none;
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.desktop-only {
			display: none;
		}
		
		.mobile-only {
			display: flex;
		}
		
		.nav-container {
			padding: 1rem;
		}
		
		.nav-links {
			display: none;
		}
		
		.mobile-menu-toggle {
			display: block;
		}
		
		.footer-content {
			grid-template-columns: 1fr;
			gap: 3rem;
		}
		
		.footer-links {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.footer-bottom-content {
			flex-direction: column;
			text-align: center;
		}
		
		.newsletter-form {
			flex-direction: column;
		}
		
		.newsletter-button {
			width: 100%;
			justify-content: center;
		}
	}
	
	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.footer-2025 {
			background: linear-gradient(to bottom, var(--background-primary), #0a0a0a);
		}
		
		.footer-wave {
			color: #0a0a0a;
		}
		
		.newsletter-input {
			background: rgba(255, 255, 255, 0.05);
			border-color: rgba(255, 255, 255, 0.1);
		}
		
		.social-link {
			background: rgba(255, 255, 255, 0.05);
		}
		
		.footer-bottom {
			border-top-color: rgba(255, 255, 255, 0.1);
		}
		
		.mobile-menu {
			background: rgba(0, 0, 0, 0.98);
			border-top-color: rgba(255, 255, 255, 0.1);
		}
	}
</style> 