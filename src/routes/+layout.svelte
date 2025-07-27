<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
</script>

<div class="app-layout">
	<!-- Simple Navigation -->
	<nav class="simple-nav">
		<div class="nav-container">
			<a href="/" class="nav-logo">
				<span class="logo-icon">🤖</span>
				<span class="logo-text">OBT Helper</span>
			</a>
			
			<div class="nav-links">
				<a href="/" class="nav-link" class:active={$page.url.pathname === '/'}>
					Home
				</a>
				<a href="/demo" class="nav-link" class:active={$page.url.pathname === '/demo'}>
					Demo
				</a>
				<a href="/admin" class="nav-link" class:active={$page.url.pathname.startsWith('/admin')}>
					Admin
				</a>
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="main-content">
		<slot />
	</main>

	<!-- Simple Footer -->
	<footer class="simple-footer">
		<div class="footer-container">
			<p>&copy; 2025 OBT Helper GPT • <a href="/admin">Admin</a></p>
		</div>
	</footer>
</div>

<style>
	/* Layout */
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	
	/* Navigation */
	.simple-nav {
		background: #ffffff;
		border-bottom: 2px solid #000000;
		position: sticky;
		top: 0;
		z-index: 100;
	}
	
	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.nav-logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: #000000;
		font-weight: 900;
		font-size: 1.25rem;
	}
	
	.logo-icon {
		font-size: 1.5rem;
	}
	
	.nav-links {
		display: flex;
		gap: 2rem;
	}
	
	.nav-link {
		color: #666666;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s;
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;
	}
	
	.nav-link:hover {
		color: #000000;
	}
	
	.nav-link.active {
		color: #000000;
		border-bottom-color: #000000;
	}
	
	/* Main Content */
	.main-content {
		flex: 1;
		background: #ffffff;
	}
	
	/* Footer */
	.simple-footer {
		background: #ffffff;
		border-top: 2px solid #000000;
		padding: 2rem 0;
	}
	
	.footer-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
		text-align: center;
		color: #666666;
	}
	
	.footer-container a {
		color: #666666;
		text-decoration: underline;
	}
	
	.footer-container a:hover {
		color: #000000;
	}
	
	/* Mobile */
	@media (max-width: 768px) {
		.nav-container {
			padding: 1rem;
		}
		
		.nav-logo {
			font-size: 1.125rem;
		}
		
		.logo-text {
			display: none;
		}
		
		.nav-links {
			gap: 1rem;
			font-size: 0.875rem;
		}
	}
	
	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.simple-nav {
			background: #000000;
			border-bottom-color: #ffffff;
		}
		
		.nav-logo {
			color: #ffffff;
		}
		
		.nav-link {
			color: #999999;
		}
		
		.nav-link:hover {
			color: #ffffff;
		}
		
		.nav-link.active {
			color: #ffffff;
			border-bottom-color: #ffffff;
		}
		
		.main-content {
			background: #000000;
			color: #ffffff;
		}
		
		.simple-footer {
			background: #000000;
			border-top-color: #ffffff;
			color: #999999;
		}
		
		.footer-container {
			color: #999999;
		}
		
		.footer-container a {
			color: #999999;
		}
		
		.footer-container a:hover {
			color: #ffffff;
		}
	}
</style> 