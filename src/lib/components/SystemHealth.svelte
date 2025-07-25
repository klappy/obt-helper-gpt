<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { spring, tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';
	import { FloatingCard } from './ui/index.js';
	
	export let variant: 'compact' | 'detailed' | 'minimal' = 'compact';
	export let showDetails = true;
	export let animateIndicators = true;
	export let refreshInterval = 5000;
	export let showHistory = false;
	
	// Health status types
	type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
	
	// System components to monitor
	const healthMetrics = {
		api: {
			name: 'API Gateway',
			status: 'healthy' as HealthStatus,
			value: 99.9,
			unit: '%',
			threshold: { warning: 95, critical: 90 },
			icon: '🔗',
			details: 'Response time: 142ms'
		},
		database: {
			name: 'Database',
			status: 'healthy' as HealthStatus,
			value: 87,
			unit: '%',
			threshold: { warning: 80, critical: 60 },
			icon: '🗄️',
			details: 'Connections: 45/100'
		},
		memory: {
			name: 'Memory Usage',
			status: 'warning' as HealthStatus,
			value: 78,
			unit: '%',
			threshold: { warning: 70, critical: 85 },
			icon: '💾',
			details: '6.2GB / 8GB'
		},
		cpu: {
			name: 'CPU Load',
			status: 'healthy' as HealthStatus,
			value: 34,
			unit: '%',
			threshold: { warning: 60, critical: 80 },
			icon: '⚡',
			details: 'Load avg: 2.1'
		},
		storage: {
			name: 'Storage',
			status: 'healthy' as HealthStatus,
			value: 42,
			unit: '%',
			threshold: { warning: 70, critical: 85 },
			icon: '💿',
			details: '42GB / 100GB'
		},
		network: {
			name: 'Network',
			status: 'healthy' as HealthStatus,
			value: 99.99,
			unit: '%',
			threshold: { warning: 98, critical: 95 },
			icon: '🌐',
			details: 'Latency: 23ms'
		}
	};
	
	// Animated values
	let metrics = { ...healthMetrics };
	const pulseScale = spring(1, { stiffness: 0.3, damping: 0.4 });
	const overallHealth = tweened(0, { duration: 800, easing: cubicOut });
	
	// History data for sparklines
	let historyData: Record<string, number[]> = {};
	Object.keys(metrics).forEach(key => {
		historyData[key] = Array(20).fill(0).map(() => 
			Math.random() * 20 + (metrics[key].value - 10)
		);
	});
	
	// Calculate overall health
	function calculateOverallHealth() {
		const statuses = Object.values(metrics).map(m => m.status);
		const criticalCount = statuses.filter(s => s === 'critical').length;
		const warningCount = statuses.filter(s => s === 'warning').length;
		const healthyCount = statuses.filter(s => s === 'healthy').length;
		
		if (criticalCount > 0) return 'critical';
		if (warningCount > 2) return 'critical';
		if (warningCount > 0) return 'warning';
		if (healthyCount === statuses.length) return 'healthy';
		return 'unknown';
	}
	
	// Update metric status based on value
	function updateMetricStatus(metric: any) {
		if (metric.value >= metric.threshold.warning && metric.value < metric.threshold.critical) {
			metric.status = 'warning';
		} else if (metric.value >= metric.threshold.critical) {
			metric.status = metric.threshold.critical > metric.threshold.warning ? 'critical' : 'healthy';
		} else {
			metric.status = metric.threshold.critical > metric.threshold.warning ? 'healthy' : 'critical';
		}
		return metric;
	}
	
	// Simulate metric updates
	function updateMetrics() {
		Object.keys(metrics).forEach(key => {
			// Simulate value changes
			const change = (Math.random() - 0.5) * 10;
			const newValue = Math.max(0, Math.min(100, metrics[key].value + change));
			metrics[key].value = Math.round(newValue * 10) / 10;
			metrics[key] = updateMetricStatus(metrics[key]);
			
			// Update history
			if (showHistory) {
				historyData[key] = [...historyData[key].slice(1), newValue];
			}
		});
		
		// Trigger pulse animation for critical items
		const hasCritical = Object.values(metrics).some(m => m.status === 'critical');
		if (hasCritical && animateIndicators) {
			$pulseScale = 1.1;
			setTimeout(() => $pulseScale = 1, 200);
		}
		
		// Update overall health score
		const healthyCount = Object.values(metrics).filter(m => m.status === 'healthy').length;
		$overallHealth = (healthyCount / Object.keys(metrics).length) * 100;
	}
	
	// Get status color
	function getStatusColor(status: HealthStatus): string {
		const colors = {
			healthy: 'var(--color-success)',
			warning: 'var(--color-warning)',
			critical: 'var(--color-error)',
			unknown: 'var(--text-tertiary)'
		};
		return colors[status];
	}
	
	// Get status icon
	function getStatusIcon(status: HealthStatus): string {
		const icons = {
			healthy: '✅',
			warning: '⚠️',
			critical: '🚨',
			unknown: '❓'
		};
		return icons[status];
	}
	
	// Format uptime
	function formatUptime(seconds: number): string {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		
		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
	
	let updateTimer: number;
	
	onMount(() => {
		updateTimer = setInterval(updateMetrics, refreshInterval) as unknown as number;
		updateMetrics(); // Initial update
	});
	
	onDestroy(() => {
		if (updateTimer) clearInterval(updateTimer);
	});
	
	$: overallStatus = calculateOverallHealth();
</script>

<div class="system-health system-health-{variant}">
	{#if variant === 'minimal'}
		<!-- Minimal variant - just overall status -->
		<div class="health-minimal">
			<span 
				class="health-icon"
				style="color: {getStatusColor(overallStatus)}"
			>
				{getStatusIcon(overallStatus)}
			</span>
			<span class="health-label">System Health</span>
			<span class="health-percentage">{Math.round($overallHealth)}%</span>
		</div>
		
	{:else if variant === 'compact'}
		<!-- Compact variant - grid of indicators -->
		<FloatingCard depth={2} hover={false}>
			<div class="health-header">
				<h3 class="health-title">System Health</h3>
				<div 
					class="overall-status"
					style="color: {getStatusColor(overallStatus)}"
				>
					{getStatusIcon(overallStatus)}
					<span>{overallStatus}</span>
				</div>
			</div>
			
			<div class="health-grid">
				{#each Object.entries(metrics) as [key, metric]}
					<div 
						class="health-item"
						class:pulse={metric.status === 'critical' && animateIndicators}
						style="--pulse-scale: {$pulseScale}"
						transition:scale={{ duration: 200 }}
					>
						<div class="item-header">
							<span class="item-icon">{metric.icon}</span>
							<span class="item-name">{metric.name}</span>
						</div>
						<div class="item-status">
							<span 
								class="status-icon"
								style="color: {getStatusColor(metric.status)}"
							>
								{getStatusIcon(metric.status)}
							</span>
							<span class="status-value">
								{metric.value}{metric.unit}
							</span>
						</div>
						{#if showDetails}
							<div class="item-details">
								{metric.details}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</FloatingCard>
		
	{:else}
		<!-- Detailed variant - full dashboard -->
		<div class="health-detailed">
			<FloatingCard depth={3} hover={false}>
				<div class="dashboard-header">
					<div class="header-left">
						<h2 class="dashboard-title">System Health Monitor</h2>
						<p class="dashboard-subtitle">
							Last updated: {new Date().toLocaleTimeString()}
						</p>
					</div>
					<div class="header-right">
						<div class="overall-health-circle">
							<svg viewBox="0 0 100 100" class="health-svg">
								<circle
									cx="50"
									cy="50"
									r="45"
									fill="none"
									stroke="var(--border-subtle)"
									stroke-width="8"
								/>
								<circle
									cx="50"
									cy="50"
									r="45"
									fill="none"
									stroke={getStatusColor(overallStatus)}
									stroke-width="8"
									stroke-dasharray={`${$overallHealth * 2.83} 283`}
									stroke-dashoffset="0"
									transform="rotate(-90 50 50)"
									class="health-progress"
								/>
								<text
									x="50"
									y="50"
									text-anchor="middle"
									dominant-baseline="middle"
									class="health-score"
								>
									{Math.round($overallHealth)}%
								</text>
							</svg>
							<p class="overall-label">{overallStatus}</p>
						</div>
					</div>
				</div>
				
				<div class="metrics-detailed">
					{#each Object.entries(metrics) as [key, metric]}
						<div class="metric-card" in:fade={{ duration: 200 }}>
							<div class="metric-header">
								<div class="metric-title">
									<span class="metric-icon">{metric.icon}</span>
									<span class="metric-name">{metric.name}</span>
								</div>
								<span 
									class="metric-status"
									style="color: {getStatusColor(metric.status)}"
								>
									{getStatusIcon(metric.status)}
								</span>
							</div>
							
							<div class="metric-body">
								<div class="metric-value-section">
									<div class="value-display">
										<span class="value-number">{metric.value}</span>
										<span class="value-unit">{metric.unit}</span>
									</div>
									<div class="value-bar">
										<div 
											class="value-fill"
											style="
												width: {metric.value}%;
												background-color: {getStatusColor(metric.status)}
											"
										/>
										{#if metric.threshold.warning < 100}
											<div 
												class="threshold-marker threshold-warning"
												style="left: {metric.threshold.warning}%"
											/>
										{/if}
										{#if metric.threshold.critical < 100}
											<div 
												class="threshold-marker threshold-critical"
												style="left: {metric.threshold.critical}%"
											/>
										{/if}
									</div>
								</div>
								
								{#if showHistory && historyData[key]}
									<div class="metric-history">
										<svg viewBox="0 0 100 30" class="history-svg">
											<polyline
												points={historyData[key].map((v, i) => 
													`${i * 5},${30 - (v / 100 * 25)}`
												).join(' ')}
												fill="none"
												stroke={getStatusColor(metric.status)}
												stroke-width="1.5"
												opacity="0.7"
											/>
										</svg>
									</div>
								{/if}
								
								<div class="metric-details">
									{metric.details}
								</div>
							</div>
						</div>
					{/each}
				</div>
				
				<div class="health-footer">
					<div class="uptime-section">
						<span class="uptime-label">System Uptime:</span>
						<span class="uptime-value">{formatUptime(432000)}</span>
					</div>
					<div class="actions">
						<button class="health-action">
							📊 View Logs
						</button>
						<button class="health-action">
							🔄 Refresh
						</button>
						<button class="health-action">
							⚙️ Configure
						</button>
					</div>
				</div>
			</FloatingCard>
		</div>
	{/if}
</div>

<style>
	.system-health {
		width: 100%;
	}
	
	/* Minimal variant */
	.health-minimal {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
	}
	
	.health-icon {
		font-size: 16px;
	}
	
	.health-label {
		color: var(--text-secondary);
	}
	
	.health-percentage {
		font-weight: 600;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
	
	/* Compact variant */
	.health-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-md);
		border-bottom: 1px solid var(--border-subtle);
	}
	
	.health-title {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}
	
	.overall-status {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: var(--text-sm);
		font-weight: 500;
		text-transform: capitalize;
	}
	
	.health-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-md);
	}
	
	.health-item {
		padding: var(--spacing-md);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
		transition: all var(--animation-quick);
	}
	
	.health-item.pulse {
		animation: pulse-health 2s ease-in-out infinite;
	}
	
	@keyframes pulse-health {
		0%, 100% {
			transform: scale(1);
			box-shadow: none;
		}
		50% {
			transform: scale(var(--pulse-scale));
			box-shadow: 0 0 20px var(--color-error-subtle);
		}
	}
	
	.item-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-xs);
	}
	
	.item-icon {
		font-size: 20px;
		opacity: 0.8;
	}
	
	.item-name {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.item-status {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-xs);
	}
	
	.status-icon {
		font-size: 20px;
	}
	
	.status-value {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
	
	.item-details {
		font-size: var(--text-xs);
		color: var(--text-secondary);
		opacity: 0.8;
	}
	
	/* Detailed variant */
	.health-detailed {
		padding: var(--spacing-lg);
	}
	
	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--spacing-xl);
		padding-bottom: var(--spacing-lg);
		border-bottom: 1px solid var(--border-subtle);
	}
	
	.dashboard-title {
		font-size: var(--text-xl);
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	
	.dashboard-subtitle {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 4px 0 0 0;
	}
	
	.overall-health-circle {
		text-align: center;
	}
	
	.health-svg {
		width: 100px;
		height: 100px;
	}
	
	.health-progress {
		transition: stroke-dasharray var(--animation-smooth);
	}
	
	.health-score {
		font-size: 24px;
		font-weight: 700;
		fill: var(--text-primary);
	}
	
	.overall-label {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		text-transform: capitalize;
		margin: var(--spacing-xs) 0 0 0;
	}
	
	.metrics-detailed {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-xl);
	}
	
	.metric-card {
		background: var(--surface-subtle);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		border: 1px solid var(--border-subtle);
		transition: all var(--animation-quick);
	}
	
	.metric-card:hover {
		border-color: var(--border-default);
		box-shadow: var(--shadow-subtle);
	}
	
	.metric-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}
	
	.metric-title {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}
	
	.metric-icon {
		font-size: 24px;
		opacity: 0.8;
	}
	
	.metric-name {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.metric-status {
		font-size: 24px;
	}
	
	.value-display {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-sm);
	}
	
	.value-number {
		font-size: var(--text-2xl);
		font-weight: 700;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
	
	.value-unit {
		font-size: var(--text-base);
		color: var(--text-secondary);
	}
	
	.value-bar {
		height: 8px;
		background: var(--surface-raised);
		border-radius: 4px;
		position: relative;
		overflow: hidden;
		margin-bottom: var(--spacing-sm);
	}
	
	.value-fill {
		height: 100%;
		transition: width var(--animation-smooth);
		border-radius: 4px;
	}
	
	.threshold-marker {
		position: absolute;
		top: -2px;
		width: 2px;
		height: 12px;
		background: var(--text-tertiary);
		opacity: 0.5;
	}
	
	.threshold-warning {
		background: var(--color-warning);
	}
	
	.threshold-critical {
		background: var(--color-error);
	}
	
	.metric-history {
		height: 30px;
		margin-bottom: var(--spacing-sm);
	}
	
	.history-svg {
		width: 100%;
		height: 100%;
	}
	
	.metric-details {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	
	.health-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--spacing-lg);
		border-top: 1px solid var(--border-subtle);
	}
	
	.uptime-section {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: var(--text-sm);
	}
	
	.uptime-label {
		color: var(--text-secondary);
	}
	
	.uptime-value {
		font-weight: 600;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
	
	.actions {
		display: flex;
		gap: var(--spacing-sm);
	}
	
	.health-action {
		padding: var(--spacing-xs) var(--spacing-sm);
		border: none;
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--animation-quick);
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}
	
	.health-action:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
		transform: translateY(-1px);
	}
	
	/* Dark mode */
	:global(.dark) .health-item {
		background: var(--surface-raised);
	}
	
	:global(.dark) .metric-card {
		background: var(--surface-raised);
	}
	
	:global(.dark) .health-action {
		background: var(--surface-raised);
	}
	
	/* Mobile adjustments */
	@media (max-width: 768px) {
		.health-grid {
			grid-template-columns: 1fr;
		}
		
		.metrics-detailed {
			grid-template-columns: 1fr;
		}
		
		.dashboard-header {
			flex-direction: column;
			align-items: center;
			text-align: center;
			gap: var(--spacing-lg);
		}
		
		.health-footer {
			flex-direction: column;
			gap: var(--spacing-md);
		}
		
		.actions {
			width: 100%;
			justify-content: stretch;
		}
		
		.health-action {
			flex: 1;
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.health-item.pulse {
			animation: none;
		}
		
		.health-progress,
		.value-fill {
			transition: none;
		}
	}
	
	/* High contrast */
	@media (prefers-contrast: high) {
		.value-bar {
			border: 1px solid currentColor;
		}
		
		.metric-card {
			border-width: 2px;
		}
	}
</style>