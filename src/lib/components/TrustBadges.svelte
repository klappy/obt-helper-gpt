<script lang="ts">
	import { onMount } from 'svelte';
	import { LiveMetric } from './ui/index.js';
	
	export let position: 'top' | 'bottom' | 'inline' = 'bottom';
	export let animate = true;
	
	// Mock data - in production, this would come from analytics
	let metrics = {
		activeUsers: 0,
		messagesProcessed: 0,
		avgResponseTime: 0,
		uptime: 0
	};
	
	let targetMetrics = {
		activeUsers: 1847,
		messagesProcessed: 48392,
		avgResponseTime: 1.2,
		uptime: 99.9
	};
	
	onMount(() => {
		if (animate) {
			// Animate metrics counting up
			animateMetrics();
		} else {
			metrics = { ...targetMetrics };
		}
		
		// Simulate real-time updates
		const interval = setInterval(() => {
			// Random small increases
			metrics.activeUsers += Math.floor(Math.random() * 3);
			metrics.messagesProcessed += Math.floor(Math.random() * 10);
		}, 3000);
		
		return () => clearInterval(interval);
	});
	
	function animateMetrics() {
		const duration = 2000;
		const startTime = Date.now();
		
		function update() {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			
			// Easing function
			const eased = 1 - Math.pow(1 - progress, 3);
			
			metrics = {
				activeUsers: Math.floor(targetMetrics.activeUsers * eased),
				messagesProcessed: Math.floor(targetMetrics.messagesProcessed * eased),
				avgResponseTime: Number((targetMetrics.avgResponseTime * eased).toFixed(1)),
				uptime: Number((targetMetrics.uptime * eased).toFixed(1))
			};
			
			if (progress < 1) {
				requestAnimationFrame(update);
			}
		}
		
		requestAnimationFrame(update);
	}
</script>

<div 
	class="trust-badges trust-badges-{position}"
	class:floating={position !== 'inline'}
>
	<div class="badges-container">
		<div class="badge-item" data-tooltip="Currently active WhatsApp users">
			<LiveMetric
				label="Active Users"
				value={metrics.activeUsers}
				format="compact"
				color="success"
				size="sm"
				animated={false}
			/>
			<div class="tooltip">
				<div class="tooltip-content">
					<strong>{metrics.activeUsers.toLocaleString()}</strong> users online
					<div class="tooltip-detail">Peak today: 2,341</div>
				</div>
			</div>
		</div>
		
		<div class="badge-item" data-tooltip="Messages processed in last 24 hours">
			<LiveMetric
				label="Messages Today"
				value={metrics.messagesProcessed}
				format="compact"
				color="primary"
				size="sm"
				animated={false}
			/>
			<div class="tooltip">
				<div class="tooltip-content">
					<strong>{metrics.messagesProcessed.toLocaleString()}</strong> messages
					<div class="tooltip-detail">Average: 2,000/hour</div>
				</div>
			</div>
		</div>
		
		<div class="badge-item" data-tooltip="Average AI response time">
			<LiveMetric
				label="Avg Response"
				value={metrics.avgResponseTime}
				suffix="s"
				color="info"
				size="sm"
				decimals={1}
				animated={false}
			/>
			<div class="tooltip">
				<div class="tooltip-content">
					<strong>{metrics.avgResponseTime}s</strong> average
					<div class="tooltip-detail">95th percentile: 2.1s</div>
				</div>
			</div>
		</div>
		
		<div class="badge-item" data-tooltip="Service availability">
			<LiveMetric
				label="Uptime"
				value={metrics.uptime}
				suffix="%"
				color="success"
				size="sm"
				decimals={1}
				animated={false}
			/>
			<div class="tooltip">
				<div class="tooltip-content">
					<strong>{metrics.uptime}%</strong> uptime
					<div class="tooltip-detail">Last 30 days</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.trust-badges {
		z-index: 20;
		pointer-events: none;
	}
	
	.trust-badges.floating {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		animation: float-in var(--spring-smooth) 0.5s both;
	}
	
	.trust-badges-top {
		top: calc(64px + var(--spacing-4)); /* Below nav */
	}
	
	.trust-badges-bottom {
		bottom: var(--spacing-6);
	}
	
	.trust-badges-inline {
		position: relative;
		margin: var(--spacing-8) 0;
	}
	
	.badges-container {
		display: flex;
		gap: var(--spacing-4);
		padding: var(--spacing-3);
		background: var(--surface-1);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-3);
		pointer-events: auto;
		flex-wrap: wrap;
		justify-content: center;
		backdrop-filter: blur(10px);
		border: 1px solid var(--surface-3);
	}
	
	.badge-item {
		animation: badge-appear var(--spring-elastic) both;
		animation-delay: calc(var(--index, 0) * 0.1s);
		position: relative;
		cursor: help;
	}
	
	.badge-item:nth-child(1) { --index: 0; }
	.badge-item:nth-child(2) { --index: 1; }
	.badge-item:nth-child(3) { --index: 2; }
	.badge-item:nth-child(4) { --index: 3; }
	
	/* Tooltip styles */
	.tooltip {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%) translateY(-8px);
		opacity: 0;
		visibility: hidden;
		transition: all var(--spring-smooth);
		pointer-events: none;
		z-index: 100;
		min-width: 180px;
	}
	
	.badge-item:hover .tooltip {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) translateY(-12px);
	}
	
	.tooltip-content {
		background: var(--surface-4);
		color: var(--text-primary);
		padding: var(--spacing-3) var(--spacing-4);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-4);
		text-align: center;
		font-size: 0.875rem;
		line-height: 1.4;
		border: 1px solid var(--surface-3);
		backdrop-filter: blur(10px);
	}
	
	/* Tooltip arrow */
	.tooltip-content::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-top: 6px solid var(--surface-4);
	}
	
	.tooltip-detail {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: var(--spacing-1);
	}
	
	/* Animations */
	@keyframes float-in {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
	
	@keyframes badge-appear {
		from {
			opacity: 0;
			transform: scale(0.8) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
	
	/* Floating animation */
	@keyframes gentle-float {
		0%, 100% { transform: translateX(-50%) translateY(0); }
		50% { transform: translateX(-50%) translateY(-5px); }
	}
	
	.trust-badges.floating {
		animation: float-in var(--spring-smooth) 0.5s both,
				  gentle-float 6s ease-in-out infinite 2s;
	}
	
	/* Mobile responsive */
	@media (max-width: 768px) {
		.badges-container {
			gap: var(--spacing-2);
			padding: var(--spacing-2);
			max-width: calc(100vw - var(--spacing-8));
		}
		
		.trust-badges-bottom {
			bottom: var(--spacing-4);
		}
		
		:global(.badge-item .live-metric) {
			padding: var(--spacing-2);
		}
		
		:global(.badge-item .metric-label) {
			font-size: 0.75rem;
		}
		
		:global(.badge-item .metric-value) {
			font-size: 1.25rem;
		}
	}
	
	/* Small screens - 2x2 grid */
	@media (max-width: 480px) {
		.badges-container {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: var(--spacing-2);
		}
	}
	
	/* Touch devices - hide tooltips */
	@media (hover: none) {
		.tooltip {
			display: none;
		}
	}
	
	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.badges-container {
			background: var(--surface-1-dark);
			border-color: var(--surface-3-dark);
		}
		
		.tooltip-content {
			background: var(--surface-4-dark);
			border-color: var(--surface-3-dark);
		}
		
		.tooltip-content::after {
			border-top-color: var(--surface-4-dark);
		}
	}
	
	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.trust-badges.floating {
			animation: none;
		}
		
		.badge-item {
			animation: none;
		}
	}
	
	/* High contrast mode */
	@media (prefers-contrast: high) {
		.badges-container {
			border-width: 2px;
		}
	}
</style>