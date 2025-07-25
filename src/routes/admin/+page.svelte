<script>
	import { onMount } from 'svelte';
	import { getAllTools, isLoading } from '$lib/stores/tools.js';
	import { FloatingCard, LiveMetric, SpatialGrid } from '$lib/components/ui/index.js';
	import CostMeter from '$lib/components/CostMeter.svelte';
	import SessionTimer from '$lib/components/SessionTimer.svelte';
	import AssistantPresence from '$lib/components/AssistantPresence.svelte';
	import { assistants, activeAssistant } from '$lib/stores/assistants.js';
	import { fade, fly, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	
	// Core data
	let tools = [];
	let metricsData = {
		totalUsers: 1247,
		activeChats: 42,
		messagesProcessed: 15384,
		totalCost: 127.43,
		uptime: 99.97,
		responseTime: 234,
		errorRate: 0.02,
		satisfaction: 4.8
	};
	
	// Real-time updates
	let lastUpdate = new Date();
	let updateInterval;
	
	// Card configurations with depth hierarchy
	const metricCards = [
		{
			id: 'users',
			title: 'Active Users',
			metric: 'totalUsers',
			format: 'number',
			icon: '👥',
			color: 'primary',
			depth: 3,
			trend: 'up',
			trendValue: 12.5,
			sparkline: true
		},
		{
			id: 'chats',
			title: 'Live Chats',
			metric: 'activeChats',
			format: 'number',
			icon: '💬',
			color: 'success',
			depth: 4,
			live: true,
			pulse: true
		},
		{
			id: 'messages',
			title: 'Messages Today',
			metric: 'messagesProcessed',
			format: 'compact',
			icon: '📨',
			color: 'secondary',
			depth: 3,
			trend: 'up',
			trendValue: 8.3
		},
		{
			id: 'cost',
			title: 'Daily Cost',
			metric: 'totalCost',
			format: 'currency',
			icon: '💰',
			color: 'warning',
			depth: 5,
			showBudget: true,
			budget: 200
		},
		{
			id: 'uptime',
			title: 'System Uptime',
			metric: 'uptime',
			format: 'percent',
			icon: '🟢',
			color: 'success',
			depth: 3,
			suffix: '%'
		},
		{
			id: 'response',
			title: 'Avg Response',
			metric: 'responseTime',
			format: 'number',
			icon: '⚡',
			color: 'primary',
			depth: 3,
			suffix: 'ms',
			trend: 'down',
			trendValue: 5.2
		}
	];
	
	// Simulate real-time updates
	function updateMetrics() {
		// Random variations for demo
		metricsData = {
			...metricsData,
			activeChats: Math.max(0, metricsData.activeChats + Math.floor(Math.random() * 5 - 2)),
			messagesProcessed: metricsData.messagesProcessed + Math.floor(Math.random() * 10),
			totalCost: metricsData.totalCost + Math.random() * 0.5,
			responseTime: Math.max(100, metricsData.responseTime + Math.floor(Math.random() * 20 - 10))
		};
		lastUpdate = new Date();
	}
	
	// Quick actions
	const quickActions = [
		{ id: 'refresh', label: 'Refresh Data', icon: '🔄', action: refreshData },
		{ id: 'export', label: 'Export Report', icon: '📊', action: exportReport },
		{ id: 'settings', label: 'Settings', icon: '⚙️', action: openSettings },
		{ id: 'help', label: 'Help', icon: '❓', action: showHelp }
	];
	
	async function refreshData() {
		// Simulate data refresh
		$isLoading = true;
		await new Promise(resolve => setTimeout(resolve, 1000));
		updateMetrics();
		$isLoading = false;
	}
	
	function exportReport() {
		console.log('Exporting report...');
	}
	
	function openSettings() {
		console.log('Opening settings...');
	}
	
	function showHelp() {
		console.log('Showing help...');
	}
	
	onMount(async () => {
		tools = await getAllTools();
		
		// Start real-time updates
		updateInterval = setInterval(updateMetrics, 5000);
		
		return () => {
			if (updateInterval) clearInterval(updateInterval);
		};
	});
	
	// Calculate metric value with optional formatting
	function getMetricValue(metric) {
		return metricsData[metric.metric] || 0;
	}
	
	// Get card animation delay based on position
	function getCardDelay(index) {
		return index * 50;
	}
</script>

<div class="admin-dashboard">
	<!-- Header Section -->
	<header class="dashboard-header">
		<div class="header-content">
			<div class="header-title">
				<h1>Command Center</h1>
				<p class="subtitle">System Overview & Analytics</p>
			</div>
			
			<div class="header-actions">
				<div class="last-update">
					<span class="update-label">Last updated</span>
					<time class="update-time">{lastUpdate.toLocaleTimeString()}</time>
				</div>
				
				<div class="quick-actions">
					{#each quickActions as action}
						<button
							class="action-button"
							on:click={action.action}
							aria-label={action.label}
							title={action.label}
						>
							<span class="action-icon">{action.icon}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
		
		{#if $isLoading}
			<div class="loading-bar" transition:fade />
		{/if}
	</header>
	
	<!-- Metrics Grid -->
	<section class="metrics-section">
		<div class="metrics-grid">
			{#each metricCards as card, index (card.id)}
				<div
					class="metric-card-wrapper"
					in:fly={{ y: 20, duration: 300, delay: getCardDelay(index) }}
					animate:flip={{ duration: 300 }}
				>
					<FloatingCard 
						depth={card.depth} 
						hover={true} 
						animate={true}
						class="metric-card"
					>
						<div class="card-header">
							<span class="card-icon">{card.icon}</span>
							<h3 class="card-title">{card.title}</h3>
							{#if card.live}
								<span class="live-indicator" class:pulse={card.pulse}>
									<span class="live-dot"></span>
									LIVE
								</span>
							{/if}
						</div>
						
						<div class="card-body">
							<LiveMetric
								label=""
								value={getMetricValue(card)}
								format={card.format}
								color={card.color}
								size="lg"
								prefix={card.format === 'currency' ? '$' : ''}
								suffix={card.suffix}
								trend={card.trend}
								trendValue={card.trendValue}
								animated={true}
							/>
						</div>
						
						{#if card.showBudget}
							<div class="card-footer">
								<div class="budget-bar">
									<div 
										class="budget-fill"
										style="width: {Math.min((getMetricValue(card) / card.budget) * 100, 100)}%"
									/>
								</div>
								<span class="budget-label">
									${card.budget} daily budget
								</span>
							</div>
						{/if}
						
						{#if card.sparkline}
							<div class="sparkline">
								<!-- Placeholder for sparkline chart -->
								<svg viewBox="0 0 100 30" class="sparkline-svg">
									<polyline
										points="0,25 10,20 20,22 30,15 40,18 50,12 60,15 70,10 80,13 90,8 100,10"
										fill="none"
										stroke="var(--color-{card.color})"
										stroke-width="2"
										opacity="0.5"
									/>
								</svg>
							</div>
						{/if}
					</FloatingCard>
				</div>
			{/each}
		</div>
	</section>
	
	<!-- Secondary Sections -->
	<div class="dashboard-content">
		<!-- Tools Overview -->
		<section class="tools-section">
			<FloatingCard depth={2} hover={false} class="section-card">
				<h2 class="section-title">AI Assistants</h2>
				<div class="tools-summary">
					<div class="summary-stat">
						<span class="stat-value">{tools.length}</span>
						<span class="stat-label">Total Tools</span>
					</div>
					<div class="summary-stat">
						<span class="stat-value">{tools.filter(t => t.enabled).length}</span>
						<span class="stat-label">Active</span>
					</div>
					<div class="summary-stat">
						<span class="stat-value">{$assistants.filter(a => a.status === 'online').length}</span>
						<span class="stat-label">Online</span>
					</div>
				</div>
				
				<div class="tools-grid">
					{#each tools.slice(0, 6) as tool}
						<a href="/admin/tools/{tool.id}" class="tool-link">
							<FloatingCard depth={1} hover={true} padding="sm" class="tool-card">
								<span class="tool-icon">{tool.icon}</span>
								<span class="tool-name">{tool.name}</span>
								<span class="tool-status" class:active={tool.enabled}>
									{tool.enabled ? 'Active' : 'Inactive'}
								</span>
							</FloatingCard>
						</a>
					{/each}
				</div>
				
				{#if tools.length > 6}
					<a href="/admin/tools" class="view-all-link">
						View all {tools.length} tools →
					</a>
				{/if}
			</FloatingCard>
		</section>
		
		<!-- System Status -->
		<section class="status-section">
			<FloatingCard depth={2} hover={false} class="section-card">
				<h2 class="section-title">System Status</h2>
				<div class="status-grid">
					<div class="status-item">
						<span class="status-indicator status-healthy"></span>
						<div class="status-info">
							<span class="status-name">API Gateway</span>
							<span class="status-detail">Responding normally</span>
						</div>
					</div>
					<div class="status-item">
						<span class="status-indicator status-healthy"></span>
						<div class="status-info">
							<span class="status-name">WhatsApp Integration</span>
							<span class="status-detail">Connected</span>
						</div>
					</div>
					<div class="status-item">
						<span class="status-indicator status-warning"></span>
						<div class="status-info">
							<span class="status-name">Cost Monitoring</span>
							<span class="status-detail">Approaching limit</span>
						</div>
					</div>
					<div class="status-item">
						<span class="status-indicator status-healthy"></span>
						<div class="status-info">
							<span class="status-name">Database</span>
							<span class="status-detail">Optimal performance</span>
						</div>
					</div>
				</div>
			</FloatingCard>
		</section>
	</div>
	
	<!-- Floating Assistant -->
	{#if $activeAssistant}
		<AssistantPresence
			assistant={$activeAssistant}
			position="bottom-right"
			showCost={true}
			showTimer={true}
		>
			<div slot="cost">
				<CostMeter
					currentCost={metricsData.totalCost}
					dailyCost={metricsData.totalCost}
					variant="minimal"
				/>
			</div>
			<div slot="timer">
				<SessionTimer format="minimal" />
			</div>
		</AssistantPresence>
	{/if}
</div>

<style>
	.admin-dashboard {
		min-height: 100vh;
		background: var(--surface-base);
		color: var(--text-primary);
		padding-bottom: var(--spacing-2xl);
	}
	
	/* Header */
	.dashboard-header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--surface-base);
		border-bottom: 1px solid var(--border-subtle);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}
	
	.header-content {
		padding: var(--spacing-lg) var(--spacing-xl);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		max-width: 1400px;
		margin: 0 auto;
	}
	
	.header-title h1 {
		font-size: var(--text-2xl);
		font-weight: 700;
		margin: 0;
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--color-primary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.subtitle {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 4px 0 0 0;
	}
	
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
	}
	
	.last-update {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}
	
	.update-label {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.update-time {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}
	
	.quick-actions {
		display: flex;
		gap: var(--spacing-xs);
	}
	
	.action-button {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--animation-quick);
		font-size: 18px;
	}
	
	.action-button:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-elevated);
	}
	
	.loading-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, 
			transparent 0%,
			var(--color-primary) 50%,
			transparent 100%
		);
		animation: loading-slide 1.5s ease-in-out infinite;
	}
	
	@keyframes loading-slide {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
	
	/* Metrics Section */
	.metrics-section {
		padding: var(--spacing-xl);
		max-width: 1400px;
		margin: 0 auto;
	}
	
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--spacing-lg);
	}
	
	.metric-card-wrapper {
		will-change: transform;
	}
	
	:global(.metric-card) {
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	
	.card-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
		position: relative;
	}
	
	.card-icon {
		font-size: 24px;
		opacity: 0.8;
	}
	
	.card-title {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
		margin: 0;
		flex: 1;
	}
	
	.live-indicator {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-success);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.live-dot {
		width: 6px;
		height: 6px;
		background: var(--color-success);
		border-radius: 50%;
		display: block;
	}
	
	.live-indicator.pulse .live-dot {
		animation: pulse-dot 2s ease-in-out infinite;
	}
	
	@keyframes pulse-dot {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(1.5);
		}
	}
	
	.card-body {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.card-footer {
		margin-top: var(--spacing-md);
		padding-top: var(--spacing-sm);
		border-top: 1px solid var(--border-subtle);
	}
	
	.budget-bar {
		height: 4px;
		background: var(--surface-raised);
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: var(--spacing-xs);
	}
	
	.budget-fill {
		height: 100%;
		background: var(--color-warning);
		transition: width var(--animation-smooth);
		border-radius: 2px;
	}
	
	.budget-label {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}
	
	.sparkline {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 30px;
		opacity: 0.3;
		pointer-events: none;
	}
	
	.sparkline-svg {
		width: 100%;
		height: 100%;
	}
	
	/* Content Sections */
	.dashboard-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-xl);
		padding: 0 var(--spacing-xl);
		max-width: 1400px;
		margin: 0 auto;
	}
	
	:global(.section-card) {
		height: 100%;
	}
	
	.section-title {
		font-size: var(--text-lg);
		font-weight: 600;
		margin: 0 0 var(--spacing-md) 0;
		color: var(--text-primary);
	}
	
	/* Tools Section */
	.tools-summary {
		display: flex;
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
		padding-bottom: var(--spacing-md);
		border-bottom: 1px solid var(--border-subtle);
	}
	
	.summary-stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.stat-value {
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.stat-label {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.tools-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}
	
	.tool-link {
		text-decoration: none;
		color: inherit;
	}
	
	:global(.tool-card) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xs);
		text-align: center;
		transition: all var(--animation-quick);
	}
	
	.tool-icon {
		font-size: 24px;
		opacity: 0.8;
	}
	
	.tool-name {
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
	}
	
	.tool-status {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		padding: 2px 8px;
		background: var(--surface-subtle);
		border-radius: var(--radius-sm);
	}
	
	.tool-status.active {
		color: var(--color-success);
		background: var(--color-success-subtle);
	}
	
	.view-all-link {
		display: inline-flex;
		align-items: center;
		color: var(--color-primary);
		text-decoration: none;
		font-size: var(--text-sm);
		font-weight: 500;
		transition: all var(--animation-quick);
	}
	
	.view-all-link:hover {
		transform: translateX(4px);
	}
	
	/* Status Section */
	.status-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}
	
	.status-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}
	
	.status-indicator {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	
	.status-healthy {
		background: var(--color-success);
		box-shadow: 0 0 0 4px var(--color-success-subtle);
	}
	
	.status-warning {
		background: var(--color-warning);
		box-shadow: 0 0 0 4px var(--color-warning-subtle);
	}
	
	.status-error {
		background: var(--color-error);
		box-shadow: 0 0 0 4px var(--color-error-subtle);
	}
	
	.status-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}
	
	.status-name {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.status-detail {
		font-size: var(--text-xs);
		color: var(--text-secondary);
	}
	
	/* Dark mode */
	:global(.dark) .dashboard-header {
		background: rgba(17, 17, 17, 0.8);
	}
	
	:global(.dark) .action-button {
		background: var(--surface-raised);
	}
	
	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.header-content {
			padding: var(--spacing-md);
		}
		
		.metrics-section {
			padding: var(--spacing-md);
		}
		
		.metrics-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-md);
		}
		
		.dashboard-content {
			grid-template-columns: 1fr;
			padding: 0 var(--spacing-md);
		}
		
		.tools-grid {
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		}
		
		.header-actions {
			width: 100%;
			justify-content: space-between;
		}
	}
	
	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.loading-bar {
			animation: none;
			opacity: 0.5;
		}
		
		.live-indicator.pulse .live-dot {
			animation: none;
		}
		
		.action-button:hover {
			transform: none;
		}
	}
</style> 