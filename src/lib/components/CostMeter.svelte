<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { LiveMetric } from './ui/index.js';
	
	export let currentCost = 0;
	export let sessionCost = 0;
	export let dailyCost = 0;
	export let monthlyBudget = 100;
	export let currency = 'USD';
	export let variant: 'compact' | 'detailed' | 'minimal' = 'compact';
	export let showBudget = true;
	export let showTrend = true;
	export let animate = true;
	export let precision = 4;
	
	// Cost breakdown
	export let costBreakdown = {
		input: 0,
		output: 0,
		embeddings: 0,
		images: 0,
		audio: 0,
		other: 0
	};
	
	// Animated values
	const animatedCost = tweened(currentCost, {
		duration: animate ? 400 : 0,
		easing: cubicOut
	});
	
	const budgetProgress = tweened(0, {
		duration: animate ? 800 : 0,
		easing: cubicOut
	});
	
	// Update animated values when props change
	$: animatedCost.set(currentCost);
	$: budgetProgress.set((dailyCost / (monthlyBudget / 30)) * 100);
	
	// Format currency
	function formatCurrency(value: number, showCents = true) {
		const formatter = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: showCents ? precision : 0,
			maximumFractionDigits: showCents ? precision : 2
		});
		return formatter.format(value);
	}
	
	// Calculate cost rate
	let startTime = Date.now();
	let costRate = 0;
	let rateInterval: number;
	
	function calculateRate() {
		const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
		if (elapsed > 0) {
			costRate = sessionCost / elapsed; // $ per minute
		}
	}
	
	// Budget status
	$: budgetStatus = (() => {
		const dailyBudget = monthlyBudget / 30;
		const percentUsed = (dailyCost / dailyBudget) * 100;
		
		if (percentUsed >= 100) return 'exceeded';
		if (percentUsed >= 80) return 'warning';
		if (percentUsed >= 50) return 'moderate';
		return 'good';
	})();
	
	// Color based on budget status
	$: statusColor = {
		good: 'var(--color-success)',
		moderate: 'var(--color-primary)',
		warning: 'var(--color-warning)',
		exceeded: 'var(--color-error)'
	}[budgetStatus];
	
	// Cost trend (mock data for demo)
	let trend = 0;
	let trendDirection: 'up' | 'down' | 'stable' = 'stable';
	
	function updateTrend() {
		// In real app, compare with historical data
		const yesterdayCost = dailyCost * 0.8; // Mock yesterday's cost
		trend = ((dailyCost - yesterdayCost) / yesterdayCost) * 100;
		
		if (trend > 5) trendDirection = 'up';
		else if (trend < -5) trendDirection = 'down';
		else trendDirection = 'stable';
	}
	
	// Breakdown percentages
	$: breakdownPercentages = (() => {
		const total = Object.values(costBreakdown).reduce((a, b) => a + b, 0);
		if (total === 0) return {};
		
		return Object.entries(costBreakdown).reduce((acc, [key, value]) => {
			acc[key] = (value / total) * 100;
			return acc;
		}, {} as Record<string, number>);
	})();
	
	// Auto-update rate
	onMount(() => {
		rateInterval = setInterval(() => {
			calculateRate();
			updateTrend();
		}, 5000) as unknown as number;
	});
	
	onDestroy(() => {
		if (rateInterval) clearInterval(rateInterval);
	});
	
	// Icon mapping for breakdown
	const breakdownIcons = {
		input: '📝',
		output: '💬',
		embeddings: '🔤',
		images: '🖼️',
		audio: '🎤',
		other: '📊'
	};
</script>

<div class="cost-meter cost-meter-{variant}" style="--status-color: {statusColor}">
	{#if variant === 'minimal'}
		<!-- Minimal variant - just the number -->
		<div class="minimal-display">
			<span class="cost-value">{formatCurrency($animatedCost)}</span>
		</div>
		
	{:else if variant === 'compact'}
		<!-- Compact variant - cost with budget indicator -->
		<div class="compact-display">
			<div class="cost-row">
				<span class="cost-label">Current</span>
				<span class="cost-value">{formatCurrency($animatedCost)}</span>
			</div>
			
			{#if showBudget}
				<div class="budget-indicator">
					<div class="budget-bar">
						<div 
							class="budget-fill"
							style="width: {Math.min($budgetProgress, 100)}%"
						/>
					</div>
					<span class="budget-text">{Math.round($budgetProgress)}% of daily budget</span>
				</div>
			{/if}
			
			{#if showTrend && costRate > 0}
				<div class="rate-display">
					<span class="rate-icon">⚡</span>
					<span class="rate-value">{formatCurrency(costRate, false)}/min</span>
				</div>
			{/if}
		</div>
		
	{:else}
		<!-- Detailed variant - full breakdown -->
		<div class="detailed-display">
			<div class="metrics-grid">
				<LiveMetric
					label="Session"
					value={sessionCost}
					format="currency"
					prefix="$"
					color="primary"
					size="md"
				/>
				<LiveMetric
					label="Today"
					value={dailyCost}
					format="currency"
					prefix="$"
					color={budgetStatus === 'good' ? 'success' : budgetStatus === 'exceeded' ? 'error' : 'warning'}
					size="md"
					trend={showTrend ? trendDirection : null}
					trendValue={Math.abs(trend)}
				/>
			</div>
			
			{#if showBudget}
				<div class="budget-section">
					<div class="budget-header">
						<span class="budget-label">Daily Budget</span>
						<span class="budget-amount">{formatCurrency(monthlyBudget / 30, false)}</span>
					</div>
					<div class="budget-bar">
						<div 
							class="budget-fill"
							class:warning={budgetStatus === 'warning'}
							class:exceeded={budgetStatus === 'exceeded'}
							style="width: {Math.min($budgetProgress, 100)}%"
						/>
						{#if $budgetProgress > 100}
							<div class="budget-overflow" style="width: {$budgetProgress - 100}%" />
						{/if}
					</div>
					<div class="budget-status">
						{#if budgetStatus === 'exceeded'}
							<span class="status-icon">⚠️</span>
							<span class="status-text">Over budget by {formatCurrency(dailyCost - monthlyBudget / 30)}</span>
						{:else}
							<span class="status-icon">✓</span>
							<span class="status-text">{formatCurrency(monthlyBudget / 30 - dailyCost)} remaining</span>
						{/if}
					</div>
				</div>
			{/if}
			
			{#if Object.values(costBreakdown).some(v => v > 0)}
				<div class="breakdown-section">
					<h4 class="breakdown-title">Cost Breakdown</h4>
					<div class="breakdown-items">
						{#each Object.entries(costBreakdown) as [category, amount]}
							{#if amount > 0}
								<div class="breakdown-item">
									<span class="breakdown-icon">{breakdownIcons[category]}</span>
									<span class="breakdown-label">{category}</span>
									<div class="breakdown-bar">
										<div 
											class="breakdown-fill"
											style="width: {breakdownPercentages[category]}%"
										/>
									</div>
									<span class="breakdown-value">{formatCurrency(amount)}</span>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
			
			{#if costRate > 0}
				<div class="rate-section">
					<span class="rate-label">Current rate:</span>
					<span class="rate-value">{formatCurrency(costRate * 60, false)}/hour</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.cost-meter {
		font-family: var(--font-sans);
		color: var(--text-primary);
	}
	
	/* Minimal variant */
	.minimal-display {
		display: inline-flex;
		align-items: center;
	}
	
	.minimal-display .cost-value {
		font-size: var(--text-lg);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--status-color);
	}
	
	/* Compact variant */
	.compact-display {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}
	
	.cost-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	
	.cost-label {
		font-size: var(--text-xs);
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.cost-value {
		font-size: var(--text-base);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--status-color);
	}
	
	.budget-indicator {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.budget-bar {
		height: 4px;
		background: var(--surface-raised);
		border-radius: 2px;
		overflow: hidden;
		position: relative;
	}
	
	.budget-fill {
		height: 100%;
		background: var(--status-color);
		transition: width var(--animation-smooth), background-color var(--animation-smooth);
		border-radius: 2px;
	}
	
	.budget-text {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}
	
	.rate-display {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: var(--text-xs);
		color: var(--text-secondary);
		padding-top: var(--spacing-xs);
		border-top: 1px solid var(--border-subtle);
	}
	
	.rate-icon {
		font-size: 12px;
		opacity: 0.7;
	}
	
	/* Detailed variant */
	.detailed-display {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background: var(--surface-base);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
		box-shadow: var(--shadow-subtle);
	}
	
	.metrics-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md);
	}
	
	.budget-section {
		padding: var(--spacing-sm);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
	}
	
	.budget-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: var(--spacing-xs);
	}
	
	.budget-label {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	
	.budget-amount {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.budget-fill.warning {
		background: var(--color-warning);
	}
	
	.budget-fill.exceeded {
		background: var(--color-error);
	}
	
	.budget-overflow {
		position: absolute;
		left: 100%;
		top: 0;
		height: 100%;
		background: var(--color-error);
		opacity: 0.5;
	}
	
	.budget-status {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin-top: var(--spacing-xs);
		font-size: var(--text-xs);
	}
	
	.status-icon {
		font-size: 12px;
	}
	
	.status-text {
		color: var(--text-secondary);
	}
	
	.breakdown-section {
		padding: var(--spacing-sm);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
	}
	
	.breakdown-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 var(--spacing-sm) 0;
	}
	
	.breakdown-items {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}
	
	.breakdown-item {
		display: grid;
		grid-template-columns: 20px 60px 1fr auto;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: var(--text-xs);
	}
	
	.breakdown-icon {
		font-size: 14px;
		opacity: 0.8;
	}
	
	.breakdown-label {
		color: var(--text-secondary);
		text-transform: capitalize;
	}
	
	.breakdown-bar {
		height: 3px;
		background: var(--surface-raised);
		border-radius: 1.5px;
		overflow: hidden;
	}
	
	.breakdown-fill {
		height: 100%;
		background: var(--color-primary);
		opacity: 0.6;
		transition: width var(--animation-smooth);
	}
	
	.breakdown-value {
		color: var(--text-primary);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
	
	.rate-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--spacing-sm);
		border-top: 1px solid var(--border-subtle);
		font-size: var(--text-sm);
	}
	
	.rate-label {
		color: var(--text-secondary);
	}
	
	.rate-value {
		color: var(--text-primary);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
	
	/* Dark mode */
	:global(.dark) .compact-display {
		background: var(--surface-raised);
	}
	
	:global(.dark) .detailed-display {
		background: var(--surface-raised);
	}
	
	:global(.dark) .budget-section,
	:global(.dark) .breakdown-section {
		background: var(--surface-elevated);
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.metrics-grid {
			grid-template-columns: 1fr;
		}
		
		.breakdown-item {
			grid-template-columns: 20px 50px 1fr auto;
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.budget-fill,
		.breakdown-fill {
			transition: none;
		}
	}
	
	/* High contrast */
	@media (prefers-contrast: high) {
		.budget-bar,
		.breakdown-bar {
			border: 1px solid currentColor;
		}
	}
</style>