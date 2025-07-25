<script lang="ts">
	import { onMount } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade, slide } from 'svelte/transition';
	import { FloatingCard, LiveMetric } from './ui/index.js';
	
	export let title = 'Analytics';
	export let expanded = false;
	export let variant: 'inline' | 'overlay' | 'sidebar' = 'inline';
	export let period: '24h' | '7d' | '30d' | '90d' = '7d';
	export let showControls = true;
	export let autoRefresh = true;
	export let refreshInterval = 30000; // 30 seconds
	
	// Animation springs
	const rotation = spring(0, { stiffness: 0.3, damping: 0.4 });
	const scale = spring(1, { stiffness: 0.3, damping: 0.4 });
	
	// Mock data
	let analyticsData = {
		overview: {
			totalUsers: 3847,
			activeUsers: 1234,
			totalMessages: 45678,
			avgResponseTime: 342,
			successRate: 98.7,
			errorRate: 1.3
		},
		timeline: generateTimelineData(),
		distribution: generateDistributionData(),
		performance: generatePerformanceData()
	};
	
	let refreshTimer;
	let containerElement: HTMLElement;
	
	// Generate mock timeline data
	function generateTimelineData() {
		const points = 24;
		const data = [];
		for (let i = 0; i < points; i++) {
			data.push({
				time: i,
				users: Math.floor(Math.random() * 100) + 50,
				messages: Math.floor(Math.random() * 300) + 100,
				cost: Math.random() * 5 + 1
			});
		}
		return data;
	}
	
	// Generate mock distribution data
	function generateDistributionData() {
		return [
			{ label: 'WhatsApp', value: 45, color: '#25D366' },
			{ label: 'Web Chat', value: 30, color: 'var(--color-primary)' },
			{ label: 'API', value: 20, color: 'var(--color-secondary)' },
			{ label: 'Other', value: 5, color: 'var(--text-tertiary)' }
		];
	}
	
	// Generate mock performance data
	function generatePerformanceData() {
		return {
			responseTime: {
				p50: 234,
				p90: 456,
				p99: 892
			},
			throughput: {
				current: 1234,
				max: 2000,
				average: 987
			},
			errors: {
				rate: 0.02,
				total: 23,
				types: [
					{ type: 'timeout', count: 12 },
					{ type: 'rate_limit', count: 8 },
					{ type: 'other', count: 3 }
				]
			}
		};
	}
	
	// Toggle expanded state
	export function toggle() {
		expanded = !expanded;
		$rotation = expanded ? 180 : 0;
		$scale = expanded ? 1.05 : 1;
		setTimeout(() => $scale = 1, 200);
	}
	
	// Refresh data
	function refreshData() {
		analyticsData = {
			overview: {
				...analyticsData.overview,
				activeUsers: Math.floor(Math.random() * 500) + 1000,
				totalMessages: analyticsData.overview.totalMessages + Math.floor(Math.random() * 50),
				avgResponseTime: Math.floor(Math.random() * 100) + 250
			},
			timeline: generateTimelineData(),
			distribution: generateDistributionData(),
			performance: generatePerformanceData()
		};
	}
	
	// Get max value for chart scaling
	function getMaxValue(data: any[], key: string) {
		return Math.max(...data.map(d => d[key]));
	}
	
	// Format number with abbreviation
	function formatNumber(num: number): string {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toString();
	}
	
	// Get period label
	function getPeriodLabel(period: string): string {
		const labels = {
			'24h': 'Last 24 Hours',
			'7d': 'Last 7 Days',
			'30d': 'Last 30 Days',
			'90d': 'Last 90 Days'
		};
		return labels[period] || period;
	}
	
	onMount(() => {
		if (autoRefresh) {
			refreshTimer = setInterval(refreshData, refreshInterval);
		}
		
		return () => {
			if (refreshTimer) clearInterval(refreshTimer);
		};
	});
</script>

<div 
	class="analytics-panel analytics-panel-{variant}"
	class:expanded
	bind:this={containerElement}
>
	<!-- Header -->
	<div class="panel-header" on:click={toggle}>
		<div class="header-content">
			<h3 class="panel-title">{title}</h3>
			<span class="panel-subtitle">{getPeriodLabel(period)}</span>
		</div>
		
		{#if showControls}
			<div class="header-controls">
				<button
					class="expand-button"
					aria-label={expanded ? 'Collapse' : 'Expand'}
					aria-expanded={expanded}
					style="transform: rotate({$rotation}deg) scale({$scale})"
				>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
						<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
					</svg>
				</button>
			</div>
		{/if}
	</div>
	
	<!-- Overview Metrics -->
	<div class="overview-metrics">
		<div class="metrics-grid">
			<LiveMetric
				label="Active Users"
				value={analyticsData.overview.activeUsers}
				format="compact"
				color="primary"
				size="sm"
				animated={true}
			/>
			<LiveMetric
				label="Messages"
				value={analyticsData.overview.totalMessages}
				format="compact"
				color="secondary"
				size="sm"
				animated={true}
			/>
			<LiveMetric
				label="Avg Response"
				value={analyticsData.overview.avgResponseTime}
				format="number"
				suffix="ms"
				color="success"
				size="sm"
				animated={true}
			/>
			<LiveMetric
				label="Success Rate"
				value={analyticsData.overview.successRate}
				format="percent"
				suffix="%"
				color="success"
				size="sm"
				animated={true}
			/>
		</div>
	</div>
	
	<!-- Expanded Content -->
	{#if expanded}
		<div class="expanded-content" transition:slide={{ duration: 300 }}>
			<FloatingCard depth={2} hover={false} padding="lg">
				<!-- Timeline Chart -->
				<div class="chart-section">
					<h4 class="chart-title">Activity Timeline</h4>
					<div class="timeline-chart">
						<svg viewBox="0 0 600 200" class="chart-svg">
							<!-- Grid lines -->
							{#each [0, 50, 100, 150] as y}
								<line
									x1="40"
									y1={y + 20}
									x2="560"
									y2={y + 20}
									stroke="var(--border-subtle)"
									stroke-dasharray="2,2"
								/>
							{/each}
							
							<!-- Data lines -->
							<polyline
								points={analyticsData.timeline.map((d, i) => 
									`${40 + (i * 520 / 23)},${170 - (d.users / getMaxValue(analyticsData.timeline, 'users') * 150)}`
								).join(' ')}
								fill="none"
								stroke="var(--color-primary)"
								stroke-width="2"
							/>
							<polyline
								points={analyticsData.timeline.map((d, i) => 
									`${40 + (i * 520 / 23)},${170 - (d.messages / getMaxValue(analyticsData.timeline, 'messages') * 150)}`
								).join(' ')}
								fill="none"
								stroke="var(--color-secondary)"
								stroke-width="2"
								opacity="0.7"
							/>
							
							<!-- Axes -->
							<line x1="40" y1="170" x2="560" y2="170" stroke="var(--border-default)" />
							<line x1="40" y1="20" x2="40" y2="170" stroke="var(--border-default)" />
							
							<!-- Labels -->
							<text x="30" y="25" class="chart-label">High</text>
							<text x="30" y="175" class="chart-label">Low</text>
							
							<!-- Legend -->
							<g transform="translate(450, 30)">
								<rect x="0" y="0" width="12" height="12" fill="var(--color-primary)" />
								<text x="16" y="10" class="chart-legend">Users</text>
								<rect x="0" y="20" width="12" height="12" fill="var(--color-secondary)" opacity="0.7" />
								<text x="16" y="30" class="chart-legend">Messages</text>
							</g>
						</svg>
					</div>
				</div>
				
				<!-- Distribution Chart -->
				<div class="chart-section">
					<h4 class="chart-title">Channel Distribution</h4>
					<div class="distribution-chart">
						{#each analyticsData.distribution as item}
							<div class="distribution-item">
								<div class="distribution-label">
									<span class="label-text">{item.label}</span>
									<span class="label-value">{item.value}%</span>
								</div>
								<div class="distribution-bar">
									<div 
										class="distribution-fill"
										style="width: {item.value}%; background-color: {item.color}"
									/>
								</div>
							</div>
						{/each}
					</div>
				</div>
				
				<!-- Performance Metrics -->
				<div class="chart-section">
					<h4 class="chart-title">Performance Metrics</h4>
					<div class="performance-grid">
						<div class="performance-card">
							<h5 class="performance-title">Response Time</h5>
							<div class="performance-stats">
								<div class="stat-item">
									<span class="stat-label">P50</span>
									<span class="stat-value">{analyticsData.performance.responseTime.p50}ms</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">P90</span>
									<span class="stat-value">{analyticsData.performance.responseTime.p90}ms</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">P99</span>
									<span class="stat-value">{analyticsData.performance.responseTime.p99}ms</span>
								</div>
							</div>
						</div>
						
						<div class="performance-card">
							<h5 class="performance-title">Throughput</h5>
							<div class="throughput-meter">
								<div class="meter-bar">
									<div 
										class="meter-fill"
										style="width: {(analyticsData.performance.throughput.current / analyticsData.performance.throughput.max) * 100}%"
									/>
								</div>
								<div class="meter-labels">
									<span>{formatNumber(analyticsData.performance.throughput.current)} req/s</span>
									<span class="text-tertiary">of {formatNumber(analyticsData.performance.throughput.max)}</span>
								</div>
							</div>
						</div>
						
						<div class="performance-card">
							<h5 class="performance-title">Error Breakdown</h5>
							<div class="error-list">
								{#each analyticsData.performance.errors.types as error}
									<div class="error-item">
										<span class="error-type">{error.type.replace('_', ' ')}</span>
										<span class="error-count">{error.count}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
				
				<!-- Actions -->
				<div class="panel-actions">
					<button class="action-button" on:click={refreshData}>
						🔄 Refresh
					</button>
					<button class="action-button">
						📊 Export
					</button>
					<button class="action-button">
						⚙️ Configure
					</button>
				</div>
			</FloatingCard>
		</div>
	{/if}
</div>

<style>
	.analytics-panel {
		width: 100%;
		background: var(--surface-base);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
		transition: all var(--animation-smooth);
	}
	
	.analytics-panel.expanded {
		box-shadow: var(--shadow-elevated);
	}
	
	/* Header */
	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-lg);
		cursor: pointer;
		user-select: none;
		transition: background var(--animation-quick);
	}
	
	.panel-header:hover {
		background: var(--surface-hover);
	}
	
	.header-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	
	.panel-title {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}
	
	.panel-subtitle {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	
	.expand-button {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border-radius: var(--radius-md);
		transition: all var(--animation-quick);
	}
	
	.expand-button:hover {
		background: var(--surface-raised);
		color: var(--text-primary);
	}
	
	/* Overview Metrics */
	.overview-metrics {
		padding: 0 var(--spacing-lg) var(--spacing-md);
	}
	
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--spacing-md);
	}
	
	/* Expanded Content */
	.expanded-content {
		padding: 0 var(--spacing-lg) var(--spacing-lg);
	}
	
	.chart-section {
		margin-bottom: var(--spacing-xl);
	}
	
	.chart-section:last-child {
		margin-bottom: 0;
	}
	
	.chart-title {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 var(--spacing-md) 0;
	}
	
	/* Timeline Chart */
	.timeline-chart {
		height: 200px;
		margin-bottom: var(--spacing-md);
	}
	
	.chart-svg {
		width: 100%;
		height: 100%;
	}
	
	.chart-label {
		fill: var(--text-tertiary);
		font-size: 10px;
	}
	
	.chart-legend {
		fill: var(--text-secondary);
		font-size: 11px;
	}
	
	/* Distribution Chart */
	.distribution-chart {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}
	
	.distribution-item {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}
	
	.distribution-label {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-sm);
	}
	
	.label-text {
		color: var(--text-primary);
		font-weight: 500;
	}
	
	.label-value {
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}
	
	.distribution-bar {
		height: 8px;
		background: var(--surface-subtle);
		border-radius: 4px;
		overflow: hidden;
	}
	
	.distribution-fill {
		height: 100%;
		transition: width var(--animation-smooth);
		border-radius: 4px;
	}
	
	/* Performance Metrics */
	.performance-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-md);
	}
	
	.performance-card {
		padding: var(--spacing-md);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
	}
	
	.performance-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 var(--spacing-sm) 0;
	}
	
	.performance-stats {
		display: flex;
		gap: var(--spacing-md);
	}
	
	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	
	.stat-label {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.stat-value {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
	
	.throughput-meter {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}
	
	.meter-bar {
		height: 6px;
		background: var(--surface-raised);
		border-radius: 3px;
		overflow: hidden;
	}
	
	.meter-fill {
		height: 100%;
		background: var(--color-primary);
		transition: width var(--animation-smooth);
		border-radius: 3px;
	}
	
	.meter-labels {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-xs);
		color: var(--text-secondary);
	}
	
	.error-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}
	
	.error-item {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-sm);
	}
	
	.error-type {
		color: var(--text-secondary);
		text-transform: capitalize;
	}
	
	.error-count {
		color: var(--color-error);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	
	/* Actions */
	.panel-actions {
		display: flex;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-lg);
		padding-top: var(--spacing-lg);
		border-top: 1px solid var(--border-subtle);
	}
	
	.action-button {
		padding: var(--spacing-sm) var(--spacing-md);
		border: none;
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--animation-quick);
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}
	
	.action-button:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-subtle);
	}
	
	/* Variants */
	.analytics-panel-overlay {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		max-width: 800px;
		z-index: 1000;
		box-shadow: var(--shadow-floating);
	}
	
	.analytics-panel-sidebar {
		position: fixed;
		right: 0;
		top: 0;
		height: 100vh;
		width: 400px;
		max-width: 90vw;
		overflow-y: auto;
		box-shadow: var(--shadow-floating);
	}
	
	/* Dark mode */
	:global(.dark) .analytics-panel {
		background: var(--surface-raised);
	}
	
	:global(.dark) .panel-header:hover {
		background: var(--surface-elevated);
	}
	
	:global(.dark) .performance-card {
		background: var(--surface-elevated);
	}
	
	/* Mobile adjustments */
	@media (max-width: 768px) {
		.metrics-grid {
			grid-template-columns: 1fr 1fr;
		}
		
		.performance-grid {
			grid-template-columns: 1fr;
		}
		
		.analytics-panel-sidebar {
			width: 100%;
		}
		
		.panel-actions {
			flex-wrap: wrap;
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.analytics-panel,
		.expand-button,
		.distribution-fill,
		.meter-fill {
			transition: none;
		}
	}
	
	/* Print styles */
	@media print {
		.panel-header {
			cursor: default;
		}
		
		.header-controls,
		.panel-actions {
			display: none;
		}
		
		.expanded-content {
			display: block !important;
		}
	}
</style>