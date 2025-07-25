<script>
	import { isAdmin, adminEmail, login, logout } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	
	let email = '';
	let password = '';
	let loginError = false;
	
	// System status store
	const systemStatus = writable({
		health: 'normal', // 'normal', 'warning', 'error', 'critical'
		lastUpdate: new Date(),
		metrics: {
			cpu: 45,
			memory: 62,
			requests: 1234,
			errors: 2
		}
	});
	
	// Simulate system status updates
	let statusInterval;
	
	onMount(() => {
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
						errors: s.metrics.errors + (Math.random() > 0.9 ? 1 : 0)
					}
				};
			});
		}, 5000);
	});
	
	onDestroy(() => {
		if (statusInterval) clearInterval(statusInterval);
	});
	
	// Get ambient color based on status
	function getAmbientColor(health) {
		switch(health) {
			case 'critical': return 'var(--color-error-subtle)';
			case 'error': return 'var(--color-error-subtle)';
			case 'warning': return 'var(--color-warning-subtle)';
			default: return 'var(--color-success-subtle)';
		}
	}
	
	// Get pulse animation based on status
	function getPulseAnimation(health) {
		switch(health) {
			case 'critical': return 'pulse-critical';
			case 'error': return 'pulse-error';
			case 'warning': return 'pulse-warning';
			default: return 'pulse-normal';
		}
	}

	function handleLogin() {
		if (login(email, password)) {
			loginError = false;
			email = '';
			password = '';
		} else {
			loginError = true;
		}
	}

	function handleLogout() {
		logout();
		goto('/');
	}
</script>

{#if $isAdmin}
	<!-- Admin Interface with Ambient Status Background -->
	<div class="admin-layout min-h-screen">
		<!-- Ambient status background -->
		<div 
			class="ambient-status"
			style="--ambient-color: {getAmbientColor($systemStatus.health)}"
			class:pulse-critical={$systemStatus.health === 'critical'}
			class:pulse-error={$systemStatus.health === 'error'}
			class:pulse-warning={$systemStatus.health === 'warning'}
			class:pulse-normal={$systemStatus.health === 'normal'}
		>
			<div class="ambient-gradient"></div>
			<div class="ambient-particles"></div>
		</div>
		
		<!-- Navigation -->
		<nav class="admin-nav">
			<div class="nav-container">
				<div class="nav-left">
					<a href="/" class="back-link">
						<span class="back-arrow">←</span>
						<span>Back to Site</span>
					</a>
					<div class="nav-title">
						<span class="nav-icon">🛠️</span>
						<span class="nav-text">Admin Panel</span>
						<span class="status-indicator status-{$systemStatus.health}"></span>
					</div>
				</div>
				<div class="nav-right">
					<div class="status-metrics">
						<span class="metric" title="CPU Usage">
							💻 {$systemStatus.metrics.cpu}%
						</span>
						<span class="metric" title="Memory Usage">
							🧠 {$systemStatus.metrics.memory}%
						</span>
						<span class="metric" title="Total Requests">
							📊 {$systemStatus.metrics.requests}
						</span>
						{#if $systemStatus.metrics.errors > 0}
							<span class="metric metric-error" title="Errors">
								⚠️ {$systemStatus.metrics.errors}
							</span>
						{/if}
					</div>
					<span class="user-info">Welcome, {$adminEmail}</span>
					<button on:click={handleLogout} class="logout-btn">
						Logout
					</button>
				</div>
			</div>
		</nav>

		<!-- Main Content -->
		<main class="admin-main">
			<slot />
		</main>
	</div>
{:else}
	<!-- Login Form -->
	<div class="min-h-screen bg-gray-100 flex items-center justify-center">
		<div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
			<h2 class="text-2xl font-bold text-center text-gray-900 mb-6">
				🔐 Admin Login
			</h2>
			
			<form on:submit|preventDefault={handleLogin} class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">
						Email
					</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						placeholder="your.email@example.com"
						required
					/>
				</div>
				
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						Password
					</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						placeholder="Enter password"
						required
					/>
				</div>
				
				{#if loginError}
					<div class="text-red-600 text-sm">
						Invalid email or password. Make sure your email is authorized.
					</div>
				{/if}
				
				<button type="submit" class="w-full btn-primary">
					Login
				</button>
			</form>
			
			<div class="mt-4 text-center">
				<a href="/" class="text-sm text-gray-600 hover:text-gray-900">
					← Back to homepage
				</a>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Admin Layout */
	.admin-layout {
		position: relative;
		background: var(--color-background-primary);
		overflow: hidden;
	}
	
	/* Ambient Status Background */
	.ambient-status {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 0;
		opacity: 0.3;
		transition: all var(--duration-slow);
	}
	
	.ambient-gradient {
		position: absolute;
		top: -50%;
		right: -25%;
		width: 100%;
		height: 100%;
		background: radial-gradient(
			ellipse at center,
			var(--ambient-color) 0%,
			transparent 70%
		);
		filter: blur(100px);
		transform: rotate(-15deg);
	}
	
	.ambient-particles {
		position: absolute;
		bottom: -50%;
		left: -25%;
		width: 100%;
		height: 100%;
		background: radial-gradient(
			ellipse at center,
			var(--ambient-color) 0%,
			transparent 60%
		);
		filter: blur(120px);
		transform: rotate(15deg);
	}
	
	/* Pulse Animations */
	@keyframes pulse-normal {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 0.4; }
	}
	
	@keyframes pulse-warning {
		0%, 100% { opacity: 0.4; transform: scale(1); }
		50% { opacity: 0.6; transform: scale(1.05); }
	}
	
	@keyframes pulse-error {
		0%, 100% { opacity: 0.5; transform: scale(1); }
		50% { opacity: 0.7; transform: scale(1.1); }
	}
	
	@keyframes pulse-critical {
		0%, 100% { opacity: 0.6; transform: scale(1); }
		25% { opacity: 0.8; transform: scale(1.15); }
		50% { opacity: 0.6; transform: scale(1); }
		75% { opacity: 0.8; transform: scale(1.15); }
	}
	
	.pulse-normal { animation: pulse-normal 4s ease-in-out infinite; }
	.pulse-warning { animation: pulse-warning 3s ease-in-out infinite; }
	.pulse-error { animation: pulse-error 2s ease-in-out infinite; }
	.pulse-critical { animation: pulse-critical 1s ease-in-out infinite; }
	
	/* Navigation */
	.admin-nav {
		position: relative;
		z-index: 10;
		background: var(--color-background-primary);
		border-bottom: 1px solid var(--color-border-secondary);
		box-shadow: var(--shadow-subtle);
	}
	
	.nav-container {
		max-width: 90rem;
		margin: 0 auto;
		padding: 0 1.5rem;
		height: 4rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.nav-left,
	.nav-right {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}
	
	.back-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-secondary);
		text-decoration: none;
		font-size: 0.875rem;
		transition: all var(--duration-fast);
	}
	
	.back-link:hover {
		color: var(--color-text-primary);
		transform: translateX(-2px);
	}
	
	.back-arrow {
		font-size: 1.125rem;
		transition: transform var(--duration-fast);
	}
	
	.back-link:hover .back-arrow {
		transform: translateX(-2px);
	}
	
	.nav-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}
	
	.nav-icon {
		font-size: 1.5rem;
	}
	
	/* Status Indicator */
	.status-indicator {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--radius-full);
		background: var(--color-success-base);
		box-shadow: 0 0 0 2px var(--color-success-subtle);
		transition: all var(--duration-fast);
	}
	
	.status-indicator.status-warning {
		background: var(--color-warning-base);
		box-shadow: 0 0 0 2px var(--color-warning-subtle);
	}
	
	.status-indicator.status-error {
		background: var(--color-error-base);
		box-shadow: 0 0 0 2px var(--color-error-subtle);
	}
	
	.status-indicator.status-critical {
		background: var(--color-error-base);
		box-shadow: 0 0 0 2px var(--color-error-subtle);
		animation: blink 0.5s ease-in-out infinite;
	}
	
	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
	}
	
	/* Status Metrics */
	.status-metrics {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 1rem;
		background: var(--color-background-secondary);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}
	
	.metric {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-variant-numeric: tabular-nums;
		cursor: help;
		transition: color var(--duration-fast);
	}
	
	.metric:hover {
		color: var(--color-text-primary);
	}
	
	.metric-error {
		color: var(--color-error);
	}
	
	.user-info {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}
	
	.logout-btn {
		padding: 0.5rem 1rem;
		background: var(--color-background-secondary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.logout-btn:hover {
		background: var(--color-background-tertiary);
		border-color: var(--color-border-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-subtle);
	}
	
	/* Main Content */
	.admin-main {
		position: relative;
		z-index: 5;
		max-width: 90rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		min-height: calc(100vh - 4rem);
	}
	
	/* Responsive */
	@media (max-width: 1024px) {
		.nav-container {
			padding: 0 1rem;
		}
		
		.status-metrics {
			display: none;
		}
	}
	
	@media (max-width: 768px) {
		.nav-left,
		.nav-right {
			gap: 0.75rem;
		}
		
		.nav-title .nav-text {
			display: none;
		}
		
		.user-info {
			display: none;
		}
		
		.ambient-gradient,
		.ambient-particles {
			filter: blur(60px);
		}
	}
</style> 