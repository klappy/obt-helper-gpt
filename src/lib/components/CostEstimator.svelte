<script>
	import { onMount } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade, slide } from 'svelte/transition';
	import { FloatingCard } from '$lib/components/ui/index.js';
	import { LiveMetric } from '$lib/components/ui/index.js';
	
	export let config = {
		modules: [],
		personality: {},
		averageMessageLength: 100
	};
	
	export let usageData = {
		dailyMessages: 50,
		averageTokensPerMessage: 150,
		peakHour: 14
	};
	
	export let displayMode = 'detailed'; // 'minimal', 'compact', 'detailed'
	
	// Model pricing (per 1K tokens)
	const modelPricing = {
		'gpt-4': { input: 0.03, output: 0.06 },
		'gpt-4-turbo': { input: 0.01, output: 0.03 },
		'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
		'claude-3-opus': { input: 0.015, output: 0.075 },
		'claude-3-sonnet': { input: 0.003, output: 0.015 }
	};
	
	// Selected model
	let selectedModel = 'gpt-4-turbo';
	let showBreakdown = false;
	
	// Animation springs
	const costSpring = spring(0, { stiffness: 0.1, damping: 0.9 });
	const chartHeight = spring(0, { stiffness: 0.2, damping: 0.8 });
	
	// Calculate base token usage based on config
	function calculateBaseTokens() {
		let baseTokens = 100; // Base tokens
		
		// Add tokens based on personality verbosity
		if (config.personality?.verbosity) {
			baseTokens += (config.personality.verbosity / 100) * 200;
		}
		
		// Add tokens based on modules
		(config.modules || []).forEach(module => {
			switch(module.type) {
				case 'knowledge':
					baseTokens += 50; // Knowledge retrieval adds context
					break;
				case 'code':
					baseTokens += 100; // Code generation needs more tokens
					break;
				case 'web':
					baseTokens += 75; // Web search results add context
					break;
				case 'reasoning':
					baseTokens += 30; // Chain of thought reasoning
					break;
			}
		});
		
		return Math.round(baseTokens);
	}
	
	// Calculate estimated costs
	function calculateCosts() {
		const baseTokens = calculateBaseTokens();
		const inputTokens = baseTokens * 0.7; // 70% input
		const outputTokens = baseTokens * 0.3; // 30% output
		
		const pricing = modelPricing[selectedModel];
		
		// Per message cost
		const perMessageCost = (
			(inputTokens / 1000) * pricing.input +
			(outputTokens / 1000) * pricing.output
		);
		
		// Daily estimates
		const dailyCost = perMessageCost * usageData.dailyMessages;
		const weeklyCost = dailyCost * 7;
		const monthlyCost = dailyCost * 30;
		const yearlyCost = dailyCost * 365;
		
		return {
			perMessage: perMessageCost,
			daily: dailyCost,
			weekly: weeklyCost,
			monthly: monthlyCost,
			yearly: yearlyCost,
			inputTokens,
			outputTokens,
			totalTokens: baseTokens
		};
	}
	
	// Usage patterns
	function generateUsagePattern() {
		const hours = Array.from({ length: 24 }, (_, i) => i);
		const pattern = hours.map(hour => {
			// Simulate usage pattern with peak at specified hour
			const distance = Math.abs(hour - usageData.peakHour);
			const usage = Math.max(
				0,
				100 - (distance * distance * 0.5) + Math.random() * 20
			);
			return { hour, usage: Math.round(usage) };
		});
		
		return pattern;
	}
	
	// Budget recommendations
	function getBudgetRecommendation(monthlyCost) {
		if (monthlyCost < 10) {
			return { level: 'low', message: 'Great for personal projects', color: 'var(--color-success-base)' };
		} else if (monthlyCost < 50) {
			return { level: 'moderate', message: 'Suitable for small teams', color: 'var(--color-warning-base)' };
		} else if (monthlyCost < 200) {
			return { level: 'high', message: 'Consider usage optimization', color: 'var(--color-error-base)' };
		} else {
			return { level: 'enterprise', message: 'Enterprise-level usage', color: 'var(--color-primary-base)' };
		}
	}
	
	// Optimization suggestions
	function getOptimizationTips(costs) {
		const tips = [];
		
		if (config.personality?.verbosity > 70) {
			tips.push({
				icon: '💬',
				tip: 'Reduce verbosity to save ~30% on output tokens'
			});
		}
		
		if (selectedModel === 'gpt-4' || selectedModel === 'claude-3-opus') {
			tips.push({
				icon: '🎯',
				tip: 'Consider using GPT-4-Turbo or Claude Sonnet for 70% cost reduction'
			});
		}
		
		if (costs.totalTokens > 300) {
			tips.push({
				icon: '📊',
				tip: 'Implement conversation summarization to reduce context size'
			});
		}
		
		if (!config.modules?.some(m => m.type === 'memory')) {
			tips.push({
				icon: '💾',
				tip: 'Add memory module to avoid repeated explanations'
			});
		}
		
		return tips;
	}
	
	$: costs = calculateCosts();
	$: usagePattern = generateUsagePattern();
	$: budget = getBudgetRecommendation(costs.monthly);
	$: tips = getOptimizationTips(costs);
	
	$: costSpring.set(costs.monthly);
	
	// Format currency
	function formatCurrency(amount) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: amount < 1 ? 4 : 2,
			maximumFractionDigits: amount < 1 ? 4 : 2
		}).format(amount);
	}
	
	// Toggle breakdown
	function toggleBreakdown() {
		showBreakdown = !showBreakdown;
		chartHeight.set(showBreakdown ? 200 : 0);
	}
</script>

<div class="cost-estimator cost-estimator-{displayMode}">
	{#if displayMode === 'minimal'}
		<!-- Minimal Mode -->
		<div class="minimal-display">
			<span class="cost-label">Est. Monthly:</span>
			<span class="cost-value" style="color: {budget.color}">
				{formatCurrency($costSpring)}
			</span>
		</div>
		
	{:else if displayMode === 'compact'}
		<!-- Compact Mode -->
		<FloatingCard depth={1} padding="sm" animate={true}>
			<div class="compact-display">
				<div class="cost-summary">
					<span class="model-name">{selectedModel}</span>
					<span class="monthly-cost" style="color: {budget.color}">
						{formatCurrency($costSpring)}/mo
					</span>
				</div>
				<div class="cost-breakdown">
					<span>Daily: {formatCurrency(costs.daily)}</span>
					<span>Per msg: {formatCurrency(costs.perMessage)}</span>
				</div>
			</div>
		</FloatingCard>
		
	{:else}
		<!-- Detailed Mode -->
		<div class="detailed-display">
			<!-- Model Selector -->
			<div class="model-selector">
				<label class="selector-label">AI Model:</label>
				<select 
					bind:value={selectedModel}
					class="model-select"
				>
					{#each Object.keys(modelPricing) as model}
						<option value={model}>{model}</option>
					{/each}
				</select>
			</div>
			
			<!-- Cost Overview -->
			<FloatingCard depth={2} padding="lg" animate={true}>
				<div class="cost-overview">
					<h3 class="section-title">Cost Estimation</h3>
					
					<div class="cost-grid">
						<div class="cost-item">
							<span class="cost-period">Per Message</span>
							<span class="cost-amount">{formatCurrency(costs.perMessage)}</span>
							<span class="cost-tokens">{costs.totalTokens} tokens</span>
						</div>
						
						<div class="cost-item">
							<span class="cost-period">Daily</span>
							<span class="cost-amount">{formatCurrency(costs.daily)}</span>
							<span class="cost-messages">{usageData.dailyMessages} messages</span>
						</div>
						
						<div class="cost-item">
							<span class="cost-period">Weekly</span>
							<span class="cost-amount">{formatCurrency(costs.weekly)}</span>
							<span class="cost-messages">{usageData.dailyMessages * 7} messages</span>
						</div>
						
						<div class="cost-item featured">
							<span class="cost-period">Monthly</span>
							<span class="cost-amount" style="color: {budget.color}">
								{formatCurrency($costSpring)}
							</span>
							<span class="cost-messages">{usageData.dailyMessages * 30} messages</span>
						</div>
					</div>
					
					<div class="budget-recommendation" style="border-color: {budget.color}">
						<span class="budget-level">{budget.level} Usage</span>
						<span class="budget-message">{budget.message}</span>
					</div>
				</div>
			</FloatingCard>
			
			<!-- Token Breakdown -->
			<FloatingCard depth={1} padding="md" animate={true}>
				<button
					class="breakdown-toggle"
					on:click={toggleBreakdown}
				>
					<span>Token Breakdown</span>
					<span class="toggle-icon" class:rotated={showBreakdown}>▼</span>
				</button>
				
				{#if showBreakdown}
					<div class="token-breakdown" transition:slide>
						<div class="token-bar">
							<div class="token-segment input" style="width: {(costs.inputTokens / costs.totalTokens) * 100}%">
								<span>Input: {costs.inputTokens}</span>
							</div>
							<div class="token-segment output" style="width: {(costs.outputTokens / costs.totalTokens) * 100}%">
								<span>Output: {costs.outputTokens}</span>
							</div>
						</div>
						
						<div class="token-details">
							<div class="token-detail">
								<span class="detail-label">Base tokens:</span>
								<span class="detail-value">100</span>
							</div>
							{#if config.personality?.verbosity}
								<div class="token-detail">
									<span class="detail-label">Verbosity bonus:</span>
									<span class="detail-value">+{Math.round((config.personality.verbosity / 100) * 200)}</span>
								</div>
							{/if}
							{#each config.modules || [] as module}
								{#if module.type === 'knowledge'}
									<div class="token-detail">
										<span class="detail-label">Knowledge context:</span>
										<span class="detail-value">+50</span>
									</div>
								{:else if module.type === 'code'}
									<div class="token-detail">
										<span class="detail-label">Code generation:</span>
										<span class="detail-value">+100</span>
									</div>
								{:else if module.type === 'web'}
									<div class="token-detail">
										<span class="detail-label">Web search:</span>
										<span class="detail-value">+75</span>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			</FloatingCard>
			
			<!-- Usage Pattern -->
			<FloatingCard depth={1} padding="md" animate={true}>
				<h4 class="subsection-title">Daily Usage Pattern</h4>
				<div class="usage-chart" style="height: {$chartHeight}px">
					<svg viewBox="0 0 480 120" class="pattern-svg">
						{#each usagePattern as point, i}
							{@const x = (i / 23) * 460 + 10}
							{@const height = (point.usage / 100) * 100}
							{@const y = 110 - height}
							
							<rect
								x={x}
								y={y}
								width="15"
								height={height}
								fill={i === usageData.peakHour ? 'var(--color-primary-base)' : 'var(--color-primary-subtle)'}
								rx="2"
								class="usage-bar"
								transition:fade={{ delay: i * 20 }}
							>
								<title>{point.hour}:00 - {point.usage}% activity</title>
							</rect>
							
							{#if i % 3 === 0}
								<text
									x={x + 7.5}
									y="125"
									text-anchor="middle"
									class="hour-label"
								>
									{point.hour}
								</text>
							{/if}
						{/each}
					</svg>
				</div>
			</FloatingCard>
			
			<!-- Optimization Tips -->
			{#if tips.length > 0}
				<FloatingCard depth={1} padding="md" animate={true}>
					<h4 class="subsection-title">Cost Optimization Tips</h4>
					<div class="optimization-tips">
						{#each tips as tip}
							<div class="tip-item" transition:slide>
								<span class="tip-icon">{tip.icon}</span>
								<span class="tip-text">{tip.tip}</span>
							</div>
						{/each}
					</div>
				</FloatingCard>
			{/if}
			
			<!-- Metrics -->
			<div class="metrics-row">
				<LiveMetric
					label="Daily Cost"
					value={costs.daily}
					format="currency"
					trend={costs.daily > 5 ? 'up' : 'neutral'}
					size="sm"
				/>
				<LiveMetric
					label="Tokens/Message"
					value={costs.totalTokens}
					format="number"
					size="sm"
				/>
				<LiveMetric
					label="Efficiency"
					value={Math.round((100 / costs.totalTokens) * 100)}
					format="percent"
					trend="up"
					size="sm"
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.cost-estimator {
		width: 100%;
	}
	
	/* Minimal Mode */
	.minimal-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}
	
	.cost-label {
		color: var(--color-text-tertiary);
		font-weight: 500;
	}
	
	.cost-value {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	
	/* Compact Mode */
	.compact-display {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.cost-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.model-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}
	
	.monthly-cost {
		font-size: 1.125rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	
	.cost-breakdown {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
	}
	
	/* Detailed Mode */
	.detailed-display {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	/* Model Selector */
	.model-selector {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.selector-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}
	
	.model-select {
		flex: 1;
		max-width: 200px;
		padding: 0.5rem 0.75rem;
		background: var(--color-background-primary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.model-select:hover {
		border-color: var(--color-border-primary);
	}
	
	.model-select:focus {
		outline: none;
		border-color: var(--color-primary-base);
		box-shadow: 0 0 0 3px var(--color-primary-subtle);
	}
	
	/* Cost Overview */
	.cost-overview {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}
	
	.cost-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}
	
	.cost-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 1rem;
		background: var(--color-background-secondary);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-tertiary);
		transition: all var(--duration-fast);
	}
	
	.cost-item:hover {
		border-color: var(--color-border-secondary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-subtle);
	}
	
	.cost-item.featured {
		background: var(--color-primary-subtle);
		border-color: var(--color-primary-base);
	}
	
	.cost-period {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.cost-amount {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
		font-variant-numeric: tabular-nums;
	}
	
	.cost-tokens,
	.cost-messages {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
	}
	
	/* Budget Recommendation */
	.budget-recommendation {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem;
		background: var(--color-background-secondary);
		border: 2px solid;
		border-radius: var(--radius-md);
		text-align: center;
	}
	
	.budget-level {
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.budget-message {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}
	
	/* Token Breakdown */
	.breakdown-toggle {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 0.5rem;
		background: none;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: color var(--duration-fast);
	}
	
	.breakdown-toggle:hover {
		color: var(--color-primary-base);
	}
	
	.toggle-icon {
		transition: transform var(--duration-fast);
	}
	
	.toggle-icon.rotated {
		transform: rotate(180deg);
	}
	
	.token-breakdown {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.token-bar {
		display: flex;
		height: 2rem;
		background: var(--color-background-tertiary);
		border-radius: var(--radius-sm);
		overflow: hidden;
		border: 1px solid var(--color-border-secondary);
	}
	
	.token-segment {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 500;
		color: white;
		padding: 0 0.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.token-segment.input {
		background: var(--color-primary-base);
	}
	
	.token-segment.output {
		background: var(--color-warning-base);
	}
	
	.token-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.token-detail {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		padding: 0.25rem 0;
		border-bottom: 1px solid var(--color-border-tertiary);
	}
	
	.detail-label {
		color: var(--color-text-tertiary);
	}
	
	.detail-value {
		font-weight: 500;
		color: var(--color-text-secondary);
		font-variant-numeric: tabular-nums;
	}
	
	/* Usage Pattern */
	.subsection-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 0 0 0.75rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.usage-chart {
		overflow: hidden;
		transition: height var(--duration-medium);
	}
	
	.pattern-svg {
		width: 100%;
		height: auto;
	}
	
	.usage-bar {
		transition: all var(--duration-fast);
		cursor: pointer;
	}
	
	.usage-bar:hover {
		opacity: 0.8;
		transform: scaleY(1.05);
		transform-origin: bottom;
	}
	
	.hour-label {
		font-size: 0.625rem;
		fill: var(--color-text-tertiary);
		user-select: none;
	}
	
	/* Optimization Tips */
	.optimization-tips {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.tip-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-background-secondary);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border-tertiary);
	}
	
	.tip-icon {
		font-size: 1.25rem;
		line-height: 1;
	}
	
	.tip-text {
		flex: 1;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-text-secondary);
	}
	
	/* Metrics Row */
	.metrics-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.cost-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.metrics-row {
			grid-template-columns: 1fr;
		}
		
		.model-select {
			max-width: none;
		}
	}
</style>