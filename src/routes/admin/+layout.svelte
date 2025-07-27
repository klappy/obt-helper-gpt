<script lang="ts">
	import { isAdmin, adminEmail, login, logout } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { spring } from 'svelte/motion';
	import { fade, fly, scale } from 'svelte/transition';
	
	let email = '';
	let password = '';
	let loginError = false;
	let loginLoading = false;
	let mounted = false;
	let mouseX = spring(0, { stiffness: 0.1, damping: 0.9 });
	let mouseY = spring(0, { stiffness: 0.1, damping: 0.9 });
	
	// System status store
	const systemStatus = writable({
		health: 'normal', // 'normal', 'warning', 'error', 'critical'
		lastUpdate: new Date(),
		metrics: {
			cpu: 45,
			memory: 62,
			requests: 1234,
			errors: 2,
			uptime: 99.9
		}
	});
	
	// Simulate system status updates
	let statusInterval;
	
	onMount(() => {
		mounted = true;
		
		const handleMouseMove = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth - 0.5) * 20;
			const y = (e.clientY / window.innerHeight - 0.5) * 20;
			mouseX.set(x);
			mouseY.set(y);
		};
		
		window.addEventListener('mousemove', handleMouseMove);
		
		statusInterval = setInterval(() => {
			systemStatus.update(s => {
				// Simulate random status changes
				const random = Math.random();
				let health = 'normal';
				if (random > 0.95) health = 'critical';
				else if (random > 0.85) health = 'error';
				else if (random > 0.7) health = 'warning';
				
				return {
					health,
					lastUpdate: new Date(),
					metrics: {
						cpu: Math.round(40 + Math.random() * 40),
						memory: Math.round(50 + Math.random() * 30),
						requests: s.metrics.requests + Math.round(Math.random() * 10),
						errors: s.metrics.errors + (Math.random() > 0.9 ? 1 : 0),
						uptime: Math.max(95, Math.min(100, 99.9 - (Math.random() * 0.5)))
					}
				};
			});
		}, 5000);
		
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
		};
	});
	
	onDestroy(() => {
		if (statusInterval) clearInterval(statusInterval);
	});
	
	// Get status color
	function getStatusColor(health: string) {
		switch(health) {
			case 'critical': return '#FF3737';
			case 'error': return '#FF6B6B';
			case 'warning': return '#FFD93D';
			default: return '#51CF66';
		}
	}

	async function handleLogin() {
		loginLoading = true;
		loginError = false;
		
		// Simulate async login
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		if (login(email, password)) {
			loginError = false;
			email = '';
			password = '';
		} else {
			loginError = true;
		}
		
		loginLoading = false;
	}

	function handleLogout() {
		logout();
		goto('/');
	}
</script>

{#if $isAdmin}
	<!-- Admin Interface 2025 -->
	<div class="admin-2025">
		<!-- Animated Background -->
		<div class="admin-bg">
			<div class="bg-orb orb-1" style="transform: translate({$mouseX}px, {$mouseY}px)"></div>
			<div class="bg-orb orb-2" style="transform: translate({-$mouseX * 0.5}px, {-$mouseY * 0.5}px)"></div>
			<div class="bg-grid"></div>
		</div>
		
		<!-- Status Glow Effect -->
		<div 
			class="status-glow"
			style="--status-color: {getStatusColor($systemStatus.health)}"
			class:pulse-warning={$systemStatus.health === 'warning'}
			class:pulse-error={$systemStatus.health === 'error'}
			class:pulse-critical={$systemStatus.health === 'critical'}
		></div>
		
		<!-- Navigation -->
		<nav class="admin-nav-2025">
			<div class="nav-blur"></div>
			<div class="nav-container">
				<!-- Left Section -->
				<div class="nav-left">
					<a href="/" class="back-button">
						<span class="back-icon">←</span>
						<span class="back-text">Exit Admin</span>
					</a>
					
					<div class="nav-divider"></div>
					
					<div class="nav-brand">
						<span class="brand-icon">🛠️</span>
						<div class="brand-info">
							<h1 class="brand-title">Control Center</h1>
							<span class="brand-status" class:status-{$systemStatus.health}>
								System {$systemStatus.health}
							</span>
						</div>
					</div>
				</div>
				
				<!-- Right Section -->
				<div class="nav-right">
					<!-- Live Metrics -->
					<div class="live-metrics">
						<div class="metric-item">
							<span class="metric-icon">💻</span>
							<div class="metric-data">
								<span class="metric-value">{$systemStatus.metrics.cpu}%</span>
								<span class="metric-label">CPU</span>
							</div>
						</div>
						<div class="metric-item">
							<span class="metric-icon">🧠</span>
							<div class="metric-data">
								<span class="metric-value">{$systemStatus.metrics.memory}%</span>
								<span class="metric-label">Memory</span>
							</div>
						</div>
						<div class="metric-item">
							<span class="metric-icon">⚡</span>
							<div class="metric-data">
								<span class="metric-value">{$systemStatus.metrics.uptime}%</span>
								<span class="metric-label">Uptime</span>
							</div>
						</div>
						{#if $systemStatus.metrics.errors > 0}
							<div class="metric-item metric-error">
								<span class="metric-icon">⚠️</span>
								<div class="metric-data">
									<span class="metric-value">{$systemStatus.metrics.errors}</span>
									<span class="metric-label">Errors</span>
								</div>
							</div>
						{/if}
					</div>
					
					<!-- User Menu -->
					<div class="user-menu">
						<div class="user-info">
							<span class="user-avatar">👤</span>
							<div class="user-details">
								<span class="user-name">{$adminEmail.split('@')[0]}</span>
								<span class="user-role">Administrator</span>
							</div>
						</div>
						<button on:click={handleLogout} class="logout-button">
							<span class="logout-icon">🚪</span>
							<span class="logout-text">Logout</span>
						</button>
					</div>
				</div>
			</div>
		</nav>

		<!-- Main Content -->
		<main class="admin-main-2025">
			{#if mounted}
				<div in:fade={{ duration: 300 }}>
					<slot />
				</div>
			{/if}
		</main>
	</div>
{:else}
	<!-- Login Form 2025 -->
	<div class="login-2025">
		<!-- Animated Background -->
		<div class="login-bg">
			<div class="bg-orb orb-1" style="transform: translate({$mouseX}px, {$mouseY}px)"></div>
			<div class="bg-orb orb-2" style="transform: translate({-$mouseX * 0.5}px, {-$mouseY * 0.5}px)"></div>
			<div class="bg-mesh"></div>
		</div>
		
		{#if mounted}
			<div class="login-container" in:scale={{ duration: 600 }}>
				<!-- Logo Section -->
				<div class="login-header" in:fly={{ y: -20, duration: 600, delay: 200 }}>
					<div class="login-logo">
						<span class="logo-icon">🔐</span>
					</div>
					<h1 class="login-title">Admin Access</h1>
					<p class="login-subtitle">Enter your credentials to continue</p>
				</div>
				
				<!-- Login Form -->
				<form on:submit|preventDefault={handleLogin} class="login-form" in:fade={{ duration: 600, delay: 400 }}>
					<!-- Email Field -->
					<div class="form-field">
						<label for="email" class="field-label">Email</label>
						<div class="field-wrapper">
							<span class="field-icon">📧</span>
							<input
								type="email"
								id="email"
								bind:value={email}
								class="field-input"
								placeholder="admin@example.com"
								required
								disabled={loginLoading}
							/>
						</div>
					</div>
					
					<!-- Password Field -->
					<div class="form-field">
						<label for="password" class="field-label">Password</label>
						<div class="field-wrapper">
							<span class="field-icon">🔑</span>
							<input
								type="password"
								id="password"
								bind:value={password}
								class="field-input"
								placeholder="••••••••"
								required
								disabled={loginLoading}
							/>
						</div>
					</div>
					
					<!-- Error Message -->
					{#if loginError}
						<div class="error-box" in:fly={{ y: -10, duration: 300 }}>
							<span class="error-icon">❌</span>
							<span class="error-text">Invalid credentials. Please try again.</span>
						</div>
					{/if}
					
					<!-- Submit Button -->
					<button 
						type="submit" 
						class="login-button"
						class:loading={loginLoading}
						disabled={loginLoading}
					>
						{#if loginLoading}
							<span class="button-spinner"></span>
							<span>Authenticating...</span>
						{:else}
							<span>Sign In</span>
							<span class="button-arrow">→</span>
						{/if}
					</button>
				</form>
				
				<!-- Footer Links -->
				<div class="login-footer" in:fade={{ duration: 600, delay: 600 }}>
					<a href="/" class="footer-link">
						<span>←</span>
						<span>Back to Homepage</span>
					</a>
					<span class="footer-divider">•</span>
					<a href="#" class="footer-link">
						<span>Need Help?</span>
					</a>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* Admin 2025 Layout */
	.admin-2025 {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: #0a0a0a;
	}
	
	/* Animated Background */
	.admin-bg,
	.login-bg {
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
		width: 600px;
		height: 600px;
		background: radial-gradient(circle, #007AFF 0%, transparent 70%);
		top: -200px;
		right: -200px;
	}
	
	.orb-2 {
		width: 500px;
		height: 500px;
		background: radial-gradient(circle, #00D4FF 0%, transparent 70%);
		bottom: -200px;
		left: -200px;
	}
	
	.bg-grid {
		position: absolute;
		inset: 0;
		background-image: 
			linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
		background-size: 50px 50px;
		opacity: 0.5;
	}
	
	.bg-mesh {
		position: absolute;
		inset: 0;
		background-image: 
			radial-gradient(at 20% 80%, hsla(210, 100%, 56%, 0.3) 0px, transparent 50%),
			radial-gradient(at 80% 20%, hsla(189, 100%, 56%, 0.3) 0px, transparent 50%);
		opacity: 0.5;
	}
	
	/* Status Glow */
	.status-glow {
		position: fixed;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 200%;
		height: 200px;
		background: radial-gradient(ellipse at center top, var(--status-color, #51CF66) 0%, transparent 70%);
		opacity: 0.2;
		filter: blur(100px);
		pointer-events: none;
		z-index: 1;
	}
	
	.pulse-warning {
		animation: pulse-glow 3s ease-in-out infinite;
	}
	
	.pulse-error {
		animation: pulse-glow 2s ease-in-out infinite;
	}
	
	.pulse-critical {
		animation: pulse-glow-critical 1s ease-in-out infinite;
	}
	
	@keyframes pulse-glow {
		0%, 100% { opacity: 0.2; transform: translateX(-50%) scale(1); }
		50% { opacity: 0.4; transform: translateX(-50%) scale(1.1); }
	}
	
	@keyframes pulse-glow-critical {
		0%, 100% { opacity: 0.3; transform: translateX(-50%) scale(1); }
		25% { opacity: 0.6; transform: translateX(-50%) scale(1.2); }
		50% { opacity: 0.3; transform: translateX(-50%) scale(1); }
		75% { opacity: 0.6; transform: translateX(-50%) scale(1.2); }
	}
	
	/* Navigation 2025 */
	.admin-nav-2025 {
		position: sticky;
		top: 0;
		z-index: 100;
		height: 80px;
	}
	
	.nav-blur {
		position: absolute;
		inset: 0;
		background: rgba(10, 10, 10, 0.8);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.nav-container {
		position: relative;
		max-width: 1600px;
		margin: 0 auto;
		padding: 0 2rem;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.nav-left,
	.nav-right {
		display: flex;
		align-items: center;
		gap: 2rem;
	}
	
	/* Back Button */
	.back-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		font-weight: 500;
		transition: all 0.3s ease;
	}
	
	.back-button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		transform: translateX(-4px);
	}
	
	.back-icon {
		font-size: 1.25rem;
		transition: transform 0.3s ease;
	}
	
	.back-button:hover .back-icon {
		transform: translateX(-4px);
	}
	
	.nav-divider {
		width: 1px;
		height: 40px;
		background: rgba(255, 255, 255, 0.1);
	}
	
	/* Brand */
	.nav-brand {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.brand-icon {
		font-size: 2.5rem;
		animation: float-gentle 4s ease-in-out infinite;
	}
	
	@keyframes float-gentle {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4px); }
	}
	
	.brand-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.brand-title {
		font-size: 1.5rem;
		font-weight: 800;
		color: white;
		letter-spacing: -0.02em;
	}
	
	.brand-status {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.6);
		text-transform: capitalize;
	}
	
	.brand-status.status-warning {
		color: #FFD93D;
	}
	
	.brand-status.status-error {
		color: #FF6B6B;
	}
	
	.brand-status.status-critical {
		color: #FF3737;
		font-weight: 600;
		animation: blink 1s ease-in-out infinite;
	}
	
	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
	
	/* Live Metrics */
	.live-metrics {
		display: flex;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.metric-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0 1rem;
		border-right: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.metric-item:last-child {
		border-right: none;
		padding-right: 0;
	}
	
	.metric-icon {
		font-size: 1.5rem;
		opacity: 0.8;
	}
	
	.metric-data {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	
	.metric-value {
		font-size: 1.125rem;
		font-weight: 700;
		color: white;
		font-variant-numeric: tabular-nums;
	}
	
	.metric-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.metric-error .metric-value {
		color: #FF6B6B;
	}
	
	/* User Menu */
	.user-menu {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}
	
	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.user-avatar {
		font-size: 1.75rem;
		opacity: 0.8;
	}
	
	.user-details {
		display: flex;
		flex-direction: column;
	}
	
	.user-name {
		font-weight: 600;
		color: white;
		font-size: 0.875rem;
	}
	
	.user-role {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}
	
	.logout-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: rgba(255, 71, 87, 0.1);
		border: 1px solid rgba(255, 71, 87, 0.2);
		border-radius: 12px;
		color: #FF4757;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}
	
	.logout-button:hover {
		background: rgba(255, 71, 87, 0.2);
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(255, 71, 87, 0.2);
	}
	
	.logout-icon {
		font-size: 1rem;
	}
	
	/* Main Content */
	.admin-main-2025 {
		position: relative;
		z-index: 10;
		max-width: 1600px;
		margin: 0 auto;
		padding: 2rem;
		min-height: calc(100vh - 80px);
	}
	
	/* Login 2025 */
	.login-2025 {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		position: relative;
		background: #0a0a0a;
		overflow: hidden;
	}
	
	.login-container {
		position: relative;
		z-index: 10;
		width: 100%;
		max-width: 420px;
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 24px;
		padding: 3rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}
	
	/* Login Header */
	.login-header {
		text-align: center;
		margin-bottom: 2.5rem;
	}
	
	.login-logo {
		width: 80px;
		height: 80px;
		margin: 0 auto 1.5rem;
		background: linear-gradient(135deg, #007AFF, #0051D5);
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 32px rgba(0, 122, 255, 0.3);
		animation: float-gentle 4s ease-in-out infinite;
	}
	
	.logo-icon {
		font-size: 3rem;
	}
	
	.login-title {
		font-size: 2rem;
		font-weight: 800;
		color: white;
		margin-bottom: 0.5rem;
		letter-spacing: -0.02em;
	}
	
	.login-subtitle {
		color: rgba(255, 255, 255, 0.6);
		font-size: 1rem;
	}
	
	/* Login Form */
	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.field-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
		margin-left: 0.25rem;
	}
	
	.field-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}
	
	.field-icon {
		position: absolute;
		left: 1rem;
		font-size: 1.25rem;
		opacity: 0.6;
		pointer-events: none;
	}
	
	.field-input {
		width: 100%;
		padding: 0.875rem 1rem 0.875rem 3rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		color: white;
		font-size: 1rem;
		transition: all 0.3s ease;
	}
	
	.field-input::placeholder {
		color: rgba(255, 255, 255, 0.3);
	}
	
	.field-input:focus {
		outline: none;
		border-color: #007AFF;
		background: rgba(255, 255, 255, 0.08);
		box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
	}
	
	.field-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	/* Error Box */
	.error-box {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(255, 71, 87, 0.1);
		border: 1px solid rgba(255, 71, 87, 0.2);
		border-radius: 12px;
		color: #FF4757;
		font-size: 0.875rem;
	}
	
	.error-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}
	
	/* Login Button */
	.login-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #007AFF, #0051D5);
		border: none;
		border-radius: 12px;
		color: white;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
		margin-top: 0.5rem;
	}
	
	.login-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(0, 122, 255, 0.4);
	}
	
	.login-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
	
	.login-button.loading {
		pointer-events: none;
	}
	
	.button-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.button-arrow {
		transition: transform 0.3s ease;
	}
	
	.login-button:hover:not(:disabled) .button-arrow {
		transform: translateX(4px);
	}
	
	/* Login Footer */
	.login-footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 2rem;
		font-size: 0.875rem;
	}
	
	.footer-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.6);
		text-decoration: none;
		transition: color 0.3s ease;
	}
	
	.footer-link:hover {
		color: white;
	}
	
	.footer-divider {
		color: rgba(255, 255, 255, 0.3);
	}
	
	/* Responsive */
	@media (max-width: 1200px) {
		.live-metrics {
			display: none;
		}
	}
	
	@media (max-width: 768px) {
		.admin-nav-2025 {
			height: 60px;
		}
		
		.nav-container {
			padding: 0 1rem;
		}
		
		.nav-brand {
			gap: 0.75rem;
		}
		
		.brand-icon {
			font-size: 2rem;
		}
		
		.brand-title {
			font-size: 1.125rem;
		}
		
		.brand-status {
			font-size: 0.75rem;
		}
		
		.user-info {
			padding: 0.5rem;
		}
		
		.user-details {
			display: none;
		}
		
		.logout-text {
			display: none;
		}
		
		.login-container {
			padding: 2rem;
		}
		
		.admin-main-2025 {
			padding: 1rem;
			min-height: calc(100vh - 60px);
		}
	}
</style> 