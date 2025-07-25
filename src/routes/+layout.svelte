<script>
	import '../app.css';
	import { page } from '$app/stores';
	
	// Determine if we're in admin section
	$: isAdmin = $page.url.pathname.startsWith('/admin');
</script>

<!-- Apple 2025 Design System Layout -->
<div class="min-h-screen flex flex-col bg-background-primary">
	<!-- Clean Navigation Header -->
	<nav class="nav-header depth-1" role="navigation" aria-label="Main navigation">
		<div class="nav-container">
			<div class="nav-content">
				<!-- Logo/Brand -->
				<a href="/" class="nav-logo group" aria-label="OBT Helper GPT Home">
					<span class="logo-icon" aria-hidden="true">🤖</span>
					<span class="logo-text">OBT Helper GPT</span>
				</a>
				
				<!-- Navigation Links -->
				<div class="nav-links">
					<a 
						href="/admin" 
						class="nav-link"
						class:nav-link-active={isAdmin}
						aria-current={isAdmin ? 'page' : undefined}
					>
						<span class="nav-icon" aria-hidden="true">⚙️</span>
						<span>Admin</span>
					</a>
					<a 
						href="/demo" 
						class="nav-link"
						class:nav-link-active={$page.url.pathname === '/demo'}
						aria-current={$page.url.pathname === '/demo' ? 'page' : undefined}
					>
						<span class="nav-icon" aria-hidden="true">📱</span>
						<span>Demo</span>
					</a>
				</div>
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main id="main" class="flex-1">
		<slot />
	</main>

	<!-- Clean Footer -->
	<footer class="footer" role="contentinfo">
		<div class="footer-container">
			<div class="footer-content">
				<p class="footer-copyright">© 2025 OBT Helper GPT</p>
				<p class="footer-version">Version 5.1.0</p>
				<div class="footer-badges">
					<span class="badge badge-success">Free Forever</span>
					<span class="badge badge-info">Privacy First</span>
					<span class="badge badge-primary">AI Powered</span>
				</div>
			</div>
		</div>
	</footer>
</div>

<style>
	/* Navigation Styles */
	.nav-header {
		position: sticky;
		top: 0;
		z-index: 40;
		background: var(--surface-1);
		border-bottom: 1px solid var(--surface-3);
		transition: all var(--spring-smooth);
	}
	
	.nav-container {
		max-width: var(--content-xl);
		margin: 0 auto;
		padding: 0 var(--spacing-6);
	}
	
	.nav-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
	}
	
	/* Logo Styles */
	.nav-logo {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		text-decoration: none;
		color: var(--text-primary);
		font-weight: 700;
		font-size: 1.25rem;
		transition: all var(--spring-bounce);
	}
	
	.nav-logo:hover {
		transform: translateY(-2px);
	}
	
	.logo-icon {
		font-size: 2rem;
		transition: transform var(--spring-bounce);
	}
	
	.nav-logo:hover .logo-icon {
		transform: rotate(-10deg) scale(1.1);
	}
	
	.logo-text {
		background: linear-gradient(135deg, var(--primary), var(--primary-hover));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	/* Navigation Links */
	.nav-links {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}
	
	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--spacing-4);
		color: var(--text-secondary);
		text-decoration: none;
		font-weight: 500;
		border-radius: var(--radius-lg);
		transition: all var(--spring-smooth);
		position: relative;
	}
	
	.nav-link:hover {
		color: var(--text-primary);
		background: var(--surface-2);
		transform: translateY(-1px);
	}
	
	.nav-link-active {
		color: var(--primary);
		background: var(--primary-bg);
	}
	
	.nav-icon {
		font-size: 1.25rem;
	}
	
	/* Footer Styles */
	.footer {
		background: var(--surface-1);
		border-top: 1px solid var(--surface-3);
		margin-top: auto;
		padding: var(--spacing-12) 0;
	}
	
	.footer-container {
		max-width: var(--content-xl);
		margin: 0 auto;
		padding: 0 var(--spacing-6);
	}
	
	.footer-content {
		text-align: center;
		space-y: var(--spacing-4);
	}
	
	.footer-copyright {
		color: var(--text-primary);
		font-weight: 500;
	}
	
	.footer-version {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-top: var(--spacing-2);
	}
	
	.footer-badges {
		display: flex;
		justify-content: center;
		gap: var(--spacing-3);
		margin-top: var(--spacing-6);
		flex-wrap: wrap;
	}
	
	/* Badge Styles */
	.badge {
		display: inline-flex;
		align-items: center;
		padding: var(--spacing-1) var(--spacing-3);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 500;
		transition: all var(--spring-bounce);
	}
	
	.badge:hover {
		transform: scale(1.05);
	}
	
	.badge-success {
		background: var(--success-bg);
		color: var(--success);
		border: 1px solid var(--success);
	}
	
	.badge-info {
		background: var(--info-bg);
		color: var(--info);
		border: 1px solid var(--info);
	}
	
	.badge-primary {
		background: var(--primary-bg);
		color: var(--primary);
		border: 1px solid var(--primary);
	}
	
	/* Focus States */
	.nav-link:focus-visible,
	.nav-logo:focus-visible {
		outline: 3px solid var(--focus-ring);
		outline-offset: 2px;
	}
	
	/* Mobile Responsive */
	@media (max-width: 640px) {
		.nav-content {
			height: 56px;
		}
		
		.logo-text {
			font-size: 1rem;
		}
		
		.nav-link span:not(.nav-icon) {
			display: none;
		}
		
		.footer-badges {
			flex-direction: column;
			align-items: center;
		}
	}
	
	/* Dark Mode Support */
	@media (prefers-color-scheme: dark) {
		.nav-header {
			background: var(--surface-1-dark);
			border-color: var(--surface-3-dark);
		}
		
		.footer {
			background: var(--surface-1-dark);
			border-color: var(--surface-3-dark);
		}
	}
	
	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.nav-logo,
		.nav-link,
		.logo-icon,
		.badge {
			transition: none;
		}
	}
	
	/* Print Styles */
	@media print {
		.nav-header,
		.footer {
			display: none;
		}
	}
</style> 