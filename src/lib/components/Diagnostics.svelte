<script>
	import { onMount, onDestroy } from 'svelte';
	import { spring, tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale, slide, fly } from 'svelte/transition';
	import { FloatingCard } from './ui/index.js';
	import { AdaptiveButton } from './ui/index.js';
	import { createEventDispatcher } from 'svelte';
	
	export let autoRun = true;
	export let runInterval = 30000; // 30 seconds
	export let enableNotifications = true;
	export let variant = 'detailed'; // 'minimal', 'compact', 'detailed'
	
	const dispatch = createEventDispatcher();
	
	// Diagnostic categories
	const categories = {
		performance: {
			name: 'Performance',
			icon: '⚡',
			color: 'var(--color-primary-base)',
			tests: [
				{ id: 'response-time', name: 'API Response Time', threshold: 500 },
				{ id: 'page-load', name: 'Page Load Speed', threshold: 3000 },
				{ id: 'db-query', name: 'Database Query Time', threshold: 100 },
				{ id: 'cache-hit', name: 'Cache Hit Rate', threshold: 80, unit: '%', inverse: true }
			]
		},
		availability: {
			name: 'Availability',
			icon: '🌐',
			color: 'var(--color-success-base)',
			tests: [
				{ id: 'uptime', name: 'Service Uptime', threshold: 99.9, unit: '%', inverse: true },
				{ id: 'endpoints', name: 'Healthy Endpoints', threshold: 95, unit: '%', inverse: true },
				{ id: 'dependencies', name: 'External Dependencies', threshold: 100, unit: '%', inverse: true },
				{ id: 'ssl-cert', name: 'SSL Certificate', threshold: 30, unit: 'days', inverse: true }
			]
		},
		resources: {
			name: 'Resources',
			icon: '💾',
			color: 'var(--color-warning-base)',
			tests: [
				{ id: 'cpu-usage', name: 'CPU Usage', threshold: 80, unit: '%' },
				{ id: 'memory-usage', name: 'Memory Usage', threshold: 85, unit: '%' },
				{ id: 'disk-space', name: 'Disk Space Used', threshold: 90, unit: '%' },
				{ id: 'connection-pool', name: 'Connection Pool', threshold: 80, unit: '%' }
			]
		},
		security: {
			name: 'Security',
			icon: '🔒',
			color: 'var(--color-error-base)',
			tests: [
				{ id: 'auth-failures', name: 'Auth Failure Rate', threshold: 5, unit: '%' },
				{ id: 'suspicious-requests', name: 'Suspicious Requests', threshold: 10 },
				{ id: 'rate-limit', name: 'Rate Limit Violations', threshold: 50 },
				{ id: 'security-headers', name: 'Security Headers', threshold: 8, unit: '/10', inverse: true }
			]
		}
	};
	
	// State management
	let isRunning = false;
	let lastRunTime = null;
	let runTimer = null;
	let results = new Map();
	let issues = [];
	let selectedCategory = null;
	let expandedTests = new Set();
	
	// Animation values
	const overallScore = tweened(0, { duration: 1000, easing: cubicOut });
	const categoryScores = new Map();
	
	// Initialize category scores
	Object.keys(categories).forEach(cat => {
		categoryScores.set(cat, tweened(0, { duration: 800, easing: cubicOut }));
	});
	
	// Run diagnostics
	async function runDiagnostics() {
		if (isRunning) return;
		
		isRunning = true;
		issues = [];
		dispatch('diagnosticsStarted');
		
		// Run tests for each category
		for (const [categoryId, category] of Object.entries(categories)) {
			for (const test of category.tests) {
				await runTest(categoryId, test);
				// Small delay between tests for visual effect
				await new Promise(resolve => setTimeout(resolve, 100));
			}
		}
		
		lastRunTime = new Date();
		isRunning = false;
		
		// Calculate overall score
		updateScores();
		
		// Check for issues
		detectIssues();
		
		dispatch('diagnosticsCompleted', { results, issues });
		
		// Schedule next run if autoRun is enabled
		if (autoRun) {
			scheduleNextRun();
		}
	}
	
	// Run individual test
	async function runTest(categoryId, test) {
		// Simulate test execution
		const value = generateTestValue(test);
		const status = evaluateTestResult(test, value);
		
		const result = {
			categoryId,
			testId: test.id,
			name: test.name,
			value,
			unit: test.unit || 'ms',
			status,
			timestamp: Date.now(),
			details: generateTestDetails(test, value, status)
		};
		
		if (!results.has(categoryId)) {
			results.set(categoryId, new Map());
		}
		results.get(categoryId).set(test.id, result);
		
		// Trigger reactivity
		results = results;
	}
	
	// Generate realistic test values
	function generateTestValue(test) {
		const base = test.inverse ? test.threshold + 10 : test.threshold - 20;
		const variance = test.threshold * 0.3;
		const value = base + (Math.random() - 0.5) * variance;
		
		// Special cases
		if (test.id === 'uptime') {
			return Math.max(95, Math.min(100, 99.9 + (Math.random() - 0.5) * 0.5));
		}
		if (test.id === 'ssl-cert') {
			return Math.floor(Math.random() * 60) + 10;
		}
		
		return Math.max(0, Math.round(value * 10) / 10);
	}
	
	// Evaluate test result
	function evaluateTestResult(test, value) {
		if (test.inverse) {
			// For inverse tests, higher is better
			if (value >= test.threshold) return 'pass';
			if (value >= test.threshold * 0.9) return 'warning';
			return 'fail';
		} else {
			// For normal tests, lower is better
			if (value <= test.threshold) return 'pass';
			if (value <= test.threshold * 1.1) return 'warning';
			return 'fail';
		}
	}
	
	// Generate test details
	function generateTestDetails(test, value, status) {
		const details = [];
		
		if (status === 'fail') {
			details.push({
				type: 'error',
				message: `${test.name} exceeded threshold (${value}${test.unit || 'ms'} > ${test.threshold}${test.unit || 'ms'})`
			});
		} else if (status === 'warning') {
			details.push({
				type: 'warning',
				message: `${test.name} approaching threshold`
			});
		}
		
		// Add recommendations
		if (status !== 'pass') {
			details.push({
				type: 'recommendation',
				message: getRecommendation(test.id)
			});
		}
		
		return details;
	}
	
	// Get recommendations for failed tests
	function getRecommendation(testId) {
		const recommendations = {
			'response-time': 'Consider optimizing API endpoints or implementing caching',
			'page-load': 'Minimize bundle size and optimize asset loading',
			'db-query': 'Add database indexes or optimize query patterns',
			'cache-hit': 'Review cache invalidation strategy',
			'cpu-usage': 'Scale horizontally or optimize compute-intensive operations',
			'memory-usage': 'Check for memory leaks or increase available memory',
			'disk-space': 'Clean up old logs or increase storage capacity',
			'auth-failures': 'Review authentication logs for suspicious activity',
			'rate-limit': 'Consider increasing rate limits or implementing queueing'
		};
		
		return recommendations[testId] || 'Review system configuration';
	}
	
	// Update scores
	function updateScores() {
		let totalScore = 0;
		let totalTests = 0;
		
		for (const [categoryId, categoryResults] of results) {
			let categoryScore = 0;
			let categoryTests = 0;
			
			for (const [testId, result] of categoryResults) {
				if (result.status === 'pass') categoryScore += 100;
				else if (result.status === 'warning') categoryScore += 50;
				categoryTests++;
			}
			
			if (categoryTests > 0) {
				const score = categoryScore / categoryTests;
				categoryScores.get(categoryId).set(score);
				totalScore += score;
				totalTests++;
			}
		}
		
		if (totalTests > 0) {
			overallScore.set(totalScore / totalTests);
		}
	}
	
	// Detect issues
	function detectIssues() {
		issues = [];
		
		for (const [categoryId, categoryResults] of results) {
			for (const [testId, result] of categoryResults) {
				if (result.status === 'fail') {
					issues.push({
						id: `${categoryId}-${testId}`,
						severity: 'critical',
						category: categories[categoryId].name,
						test: result.name,
						message: `${result.name} failed: ${result.value}${result.unit}`,
						timestamp: result.timestamp,
						details: result.details
					});
				} else if (result.status === 'warning') {
					issues.push({
						id: `${categoryId}-${testId}`,
						severity: 'warning',
						category: categories[categoryId].name,
						test: result.name,
						message: `${result.name} warning: ${result.value}${result.unit}`,
						timestamp: result.timestamp,
						details: result.details
					});
				}
			}
		}
		
		// Sort by severity
		issues.sort((a, b) => {
			const severityOrder = { critical: 0, warning: 1, info: 2 };
			return severityOrder[a.severity] - severityOrder[b.severity];
		});
	}
	
	// Schedule next run
	function scheduleNextRun() {
		if (runTimer) clearTimeout(runTimer);
		runTimer = setTimeout(runDiagnostics, runInterval);
	}
	
	// Export diagnostics report
	export function exportReport(format = 'json') {
		const report = {
			timestamp: new Date().toISOString(),
			overallScore: $overallScore,
			categories: {},
			issues
		};
		
		for (const [categoryId, categoryResults] of results) {
			report.categories[categoryId] = {
				name: categories[categoryId].name,
				score: $categoryScores.get(categoryId),
				tests: Array.from(categoryResults.values())
			};
		}
		
		if (format === 'json') {
			const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
			downloadBlob(blob, `diagnostics-${Date.now()}.json`);
		} else {
			const text = generateTextReport(report);
			const blob = new Blob([text], { type: 'text/plain' });
			downloadBlob(blob, `diagnostics-${Date.now()}.txt`);
		}
		
		dispatch('reportExported', { format });
	}
	
	// Generate text report
	function generateTextReport(report) {
		let text = `System Diagnostics Report\n`;
		text += `Generated: ${report.timestamp}\n`;
		text += `Overall Score: ${Math.round(report.overallScore)}%\n\n`;
		
		for (const [categoryId, category] of Object.entries(report.categories)) {
			text += `${category.name} (${Math.round(category.score)}%)\n`;
			text += '─'.repeat(40) + '\n';
			
			for (const test of category.tests) {
				const icon = test.status === 'pass' ? '✓' : test.status === 'warning' ? '⚠' : '✗';
				text += `${icon} ${test.name}: ${test.value}${test.unit}\n`;
			}
			text += '\n';
		}
		
		if (report.issues.length > 0) {
			text += `Issues Found (${report.issues.length})\n`;
			text += '─'.repeat(40) + '\n';
			
			for (const issue of report.issues) {
				text += `[${issue.severity.toUpperCase()}] ${issue.message}\n`;
			}
		}
		
		return text;
	}
	
	// Download blob
	function downloadBlob(blob, filename) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}
	
	// Toggle test expansion
	function toggleTestExpansion(categoryId, testId) {
		const key = `${categoryId}-${testId}`;
		if (expandedTests.has(key)) {
			expandedTests.delete(key);
		} else {
			expandedTests.add(key);
		}
		expandedTests = expandedTests;
	}
	
	// Lifecycle
	onMount(() => {
		if (autoRun) {
			runDiagnostics();
		}
	});
	
	onDestroy(() => {
		if (runTimer) {
			clearTimeout(runTimer);
		}
	});
	
	// Get status color
	function getStatusColor(status) {
		return {
			pass: 'var(--color-success-base)',
			warning: 'var(--color-warning-base)',
			fail: 'var(--color-error-base)'
		}[status] || 'var(--color-text-tertiary)';
	}
	
	// Get status icon
	function getStatusIcon(status) {
		return {
			pass: '✅',
			warning: '⚠️',
			fail: '❌'
		}[status] || '❓';
	}
	
	// Format time ago
	function formatTimeAgo(timestamp) {
		if (!timestamp) return 'Never';
		
		const seconds = Math.floor((Date.now() - timestamp) / 1000);
		if (seconds < 60) return 'Just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return `${Math.floor(seconds / 86400)}d ago`;
	}
</script>

<div class="diagnostics diagnostics-{variant}">
	{#if variant === 'minimal'}
		<!-- Minimal variant - just overall status -->
		<div class="diagnostics-minimal">
			<button
				class="minimal-trigger"
				class:running={isRunning}
				on:click={runDiagnostics}
				disabled={isRunning}
			>
				<span class="minimal-icon">🔍</span>
				<span class="minimal-label">
					{#if isRunning}
						Running...
					{:else if $overallScore > 0}
						Health: {Math.round($overallScore)}%
					{:else}
						Run Diagnostics
					{/if}
				</span>
				{#if issues.length > 0 && !isRunning}
					<span class="minimal-badge">{issues.length}</span>
				{/if}
			</button>
		</div>
		
	{:else if variant === 'compact'}
		<!-- Compact variant - summary view -->
		<FloatingCard depth={2} padding="md">
			<div class="diagnostics-compact">
				<div class="compact-header">
					<h3 class="compact-title">System Diagnostics</h3>
					<AdaptiveButton
						size="small"
						variant={isRunning ? 'secondary' : 'primary'}
						disabled={isRunning}
						on:click={runDiagnostics}
					>
						{isRunning ? 'Running...' : 'Run Tests'}
					</AdaptiveButton>
				</div>
				
				{#if $overallScore > 0}
					<div class="compact-score">
						<div class="score-circle" style="--score: {$overallScore}">
							<svg viewBox="0 0 100 100">
								<circle
									cx="50"
									cy="50"
									r="45"
									fill="none"
									stroke="var(--color-border-tertiary)"
									stroke-width="8"
								/>
								<circle
									cx="50"
									cy="50"
									r="45"
									fill="none"
									stroke={$overallScore > 80 ? 'var(--color-success-base)' : $overallScore > 60 ? 'var(--color-warning-base)' : 'var(--color-error-base)'}
									stroke-width="8"
									stroke-dasharray={`${$overallScore * 2.83} 283`}
									transform="rotate(-90 50 50)"
								/>
							</svg>
							<span class="score-value">{Math.round($overallScore)}%</span>
						</div>
						
						{#if issues.length > 0}
							<div class="compact-issues">
								<h4 class="issues-title">Issues ({issues.length})</h4>
								{#each issues.slice(0, 3) as issue}
									<div class="issue-item">
										<span class="issue-icon" style="color: {getStatusColor(issue.severity === 'critical' ? 'fail' : 'warning')}">
											{getStatusIcon(issue.severity === 'critical' ? 'fail' : 'warning')}
										</span>
										<span class="issue-text">{issue.test}</span>
									</div>
								{/each}
								{#if issues.length > 3}
									<p class="more-issues">+{issues.length - 3} more</p>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
				
				{#if lastRunTime}
					<p class="last-run">Last run: {formatTimeAgo(lastRunTime)}</p>
				{/if}
			</div>
		</FloatingCard>
		
	{:else}
		<!-- Detailed variant - full diagnostics -->
		<div class="diagnostics-detailed">
			<!-- Header -->
			<FloatingCard depth={2} padding="lg">
				<div class="detailed-header">
					<div class="header-left">
						<h2 class="detailed-title">System Diagnostics</h2>
						<p class="detailed-subtitle">
							Comprehensive system health check and issue detection
						</p>
					</div>
					<div class="header-right">
						<div class="header-actions">
							<AdaptiveButton
								size="small"
								variant="secondary"
								on:click={() => exportReport('json')}
								disabled={results.size === 0}
							>
								📥 Export JSON
							</AdaptiveButton>
							<AdaptiveButton
								size="small"
								variant="secondary"
								on:click={() => exportReport('text')}
								disabled={results.size === 0}
							>
								📄 Export Text
							</AdaptiveButton>
							<AdaptiveButton
								variant={isRunning ? 'secondary' : 'primary'}
								disabled={isRunning}
								on:click={runDiagnostics}
							>
								{#if isRunning}
									<span class="running-indicator">⏳</span>
									Running Tests...
								{:else}
									🔍 Run Diagnostics
								{/if}
							</AdaptiveButton>
						</div>
					</div>
				</div>
			</FloatingCard>
			
			<!-- Overall Score -->
			{#if $overallScore > 0}
				<FloatingCard depth={1} padding="lg">
					<div class="overall-score">
						<div class="score-display">
							<div class="score-circle-large" style="--score: {$overallScore}">
								<svg viewBox="0 0 200 200">
									<circle
										cx="100"
										cy="100"
										r="90"
										fill="none"
										stroke="var(--color-border-tertiary)"
										stroke-width="12"
									/>
									<circle
										cx="100"
										cy="100"
										r="90"
										fill="none"
										stroke={$overallScore > 80 ? 'var(--color-success-base)' : $overallScore > 60 ? 'var(--color-warning-base)' : 'var(--color-error-base)'}
										stroke-width="12"
										stroke-dasharray={`${$overallScore * 5.65} 565`}
										transform="rotate(-90 100 100)"
										stroke-linecap="round"
									/>
								</svg>
								<div class="score-content">
									<span class="score-number">{Math.round($overallScore)}</span>
									<span class="score-label">Overall Health</span>
								</div>
							</div>
						</div>
						
						<div class="score-summary">
							<div class="summary-stats">
								<div class="stat">
									<span class="stat-value">{results.size}</span>
									<span class="stat-label">Categories</span>
								</div>
								<div class="stat">
									<span class="stat-value">
										{Array.from(results.values()).reduce((sum, cat) => sum + cat.size, 0)}
									</span>
									<span class="stat-label">Tests Run</span>
								</div>
								<div class="stat">
									<span class="stat-value" style="color: {issues.length > 0 ? 'var(--color-error-base)' : 'var(--color-success-base)'}">
										{issues.length}
									</span>
									<span class="stat-label">Issues Found</span>
								</div>
							</div>
							
							{#if lastRunTime}
								<p class="last-run-detailed">
									Last diagnostic run: {lastRunTime.toLocaleString()}
								</p>
							{/if}
						</div>
					</div>
				</FloatingCard>
			{/if}
			
			<!-- Category Results -->
			<div class="categories-grid">
				{#each Object.entries(categories) as [categoryId, category]}
					{@const categoryResults = results.get(categoryId)}
					{@const categoryScore = categoryScores.get(categoryId)}
					
					<FloatingCard 
						depth={selectedCategory === categoryId ? 3 : 2}
						hover={true}
						on:click={() => selectedCategory = selectedCategory === categoryId ? null : categoryId}
					>
						<div class="category-card">
							<div class="category-header">
								<div class="category-title">
									<span class="category-icon" style="color: {category.color}">
										{category.icon}
									</span>
									<h3 class="category-name">{category.name}</h3>
								</div>
								{#if categoryScore && $categoryScore > 0}
									<div class="category-score">
										<span class="score-text">{Math.round($categoryScore)}%</span>
									</div>
								{/if}
							</div>
							
							{#if categoryResults}
								<div class="test-results">
									{#each category.tests as test}
										{@const result = categoryResults.get(test.id)}
										{@const isExpanded = expandedTests.has(`${categoryId}-${test.id}`)}
										
										{#if result}
											<div 
												class="test-item"
												class:expanded={isExpanded}
												on:click|stopPropagation={() => toggleTestExpansion(categoryId, test.id)}
											>
												<div class="test-main">
													<span 
														class="test-status"
														style="color: {getStatusColor(result.status)}"
													>
														{getStatusIcon(result.status)}
													</span>
													<span class="test-name">{test.name}</span>
													<span class="test-value">
														{result.value}{result.unit}
													</span>
												</div>
												
												{#if isExpanded && result.details.length > 0}
													<div class="test-details" transition:slide={{ duration: 200 }}>
														{#each result.details as detail}
															<div class="detail-item detail-{detail.type}">
																<span class="detail-icon">
																	{detail.type === 'error' ? '❌' : detail.type === 'warning' ? '⚠️' : '💡'}
																</span>
																<span class="detail-message">{detail.message}</span>
															</div>
														{/each}
													</div>
												{/if}
											</div>
										{:else if isRunning}
											<div class="test-item running">
												<span class="test-status">⏳</span>
												<span class="test-name">{test.name}</span>
												<span class="test-value">Testing...</span>
											</div>
										{/if}
									{/each}
								</div>
							{:else if !isRunning}
								<p class="no-results">No test results yet</p>
							{/if}
						</div>
					</FloatingCard>
				{/each}
			</div>
			
			<!-- Issues Panel -->
			{#if issues.length > 0}
				<FloatingCard depth={2} padding="lg">
					<div class="issues-panel">
						<h3 class="issues-header">
							Detected Issues ({issues.length})
						</h3>
						
						<div class="issues-list">
							{#each issues as issue (issue.id)}
								<div 
									class="issue-card"
									class:critical={issue.severity === 'critical'}
									transition:fly={{ x: -20, duration: 300 }}
								>
									<div class="issue-header">
										<span 
											class="issue-severity"
											style="color: {getStatusColor(issue.severity === 'critical' ? 'fail' : 'warning')}"
										>
											{getStatusIcon(issue.severity === 'critical' ? 'fail' : 'warning')}
										</span>
										<span class="issue-category">{issue.category}</span>
										<span class="issue-time">{formatTimeAgo(issue.timestamp)}</span>
									</div>
									
									<p class="issue-message">{issue.message}</p>
									
									{#if issue.details && issue.details.length > 0}
										{#each issue.details.filter(d => d.type === 'recommendation') as detail}
											<p class="issue-recommendation">
												💡 {detail.message}
											</p>
										{/each}
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</FloatingCard>
			{/if}
			
			<!-- Auto-run Settings -->
			<FloatingCard depth={1} padding="md">
				<div class="settings-panel">
					<label class="setting-item">
						<input
							type="checkbox"
							bind:checked={autoRun}
							on:change={autoRun ? scheduleNextRun() : clearTimeout(runTimer)}
						/>
						<span class="setting-label">Auto-run diagnostics</span>
						{#if autoRun}
							<span class="setting-info">
								(every {runInterval / 1000}s)
							</span>
						{/if}
					</label>
				</div>
			</FloatingCard>
		</div>
	{/if}
</div>

<style>
	.diagnostics {
		width: 100%;
	}
	
	/* Minimal Variant */
	.diagnostics-minimal {
		display: inline-block;
	}
	
	.minimal-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-background-secondary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--duration-fast);
		position: relative;
	}
	
	.minimal-trigger:hover:not(:disabled) {
		background: var(--color-background-tertiary);
		border-color: var(--color-border-primary);
		transform: translateY(-1px);
	}
	
	.minimal-trigger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.minimal-trigger.running {
		background: var(--color-primary-subtle);
		border-color: var(--color-primary-base);
	}
	
	.minimal-icon {
		font-size: 1rem;
	}
	
	.minimal-label {
		font-weight: 500;
		color: var(--color-text-primary);
	}
	
	.minimal-badge {
		position: absolute;
		top: -0.5rem;
		right: -0.5rem;
		min-width: 1.25rem;
		height: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-error-base);
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: var(--radius-full);
		padding: 0 0.25rem;
	}
	
	/* Compact Variant */
	.diagnostics-compact {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.compact-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.compact-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}
	
	.compact-score {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}
	
	.score-circle {
		width: 100px;
		height: 100px;
		position: relative;
		flex-shrink: 0;
	}
	
	.score-circle svg {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}
	
	.score-circle circle {
		transition: stroke-dasharray var(--duration-medium);
	}
	
	.score-value {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}
	
	.compact-issues {
		flex: 1;
	}
	
	.issues-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 0 0 0.5rem 0;
	}
	
	.issue-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0;
		font-size: 0.8125rem;
	}
	
	.issue-icon {
		font-size: 0.875rem;
	}
	
	.issue-text {
		color: var(--color-text-secondary);
	}
	
	.more-issues {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
		font-style: italic;
		margin: 0.25rem 0 0 0;
	}
	
	.last-run {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
		margin: 0;
		text-align: right;
	}
	
	/* Detailed Variant */
	.diagnostics-detailed {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.detailed-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}
	
	.header-left {
		flex: 1;
	}
	
	.detailed-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin: 0;
	}
	
	.detailed-subtitle {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0.25rem 0 0 0;
	}
	
	.header-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	
	.running-indicator {
		display: inline-block;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	
	/* Overall Score */
	.overall-score {
		display: flex;
		gap: 3rem;
		align-items: center;
	}
	
	.score-display {
		flex-shrink: 0;
	}
	
	.score-circle-large {
		width: 200px;
		height: 200px;
		position: relative;
	}
	
	.score-circle-large svg {
		width: 100%;
		height: 100%;
	}
	
	.score-circle-large circle {
		transition: stroke-dasharray var(--duration-smooth);
	}
	
	.score-content {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
	}
	
	.score-number {
		display: block;
		font-size: 3rem;
		font-weight: 700;
		color: var(--color-text-primary);
		line-height: 1;
	}
	
	.score-label {
		display: block;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin-top: 0.5rem;
	}
	
	.score-summary {
		flex: 1;
	}
	
	.summary-stats {
		display: flex;
		gap: 3rem;
		margin-bottom: 1.5rem;
	}
	
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text-primary);
		line-height: 1;
	}
	
	.stat-label {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}
	
	.last-run-detailed {
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
		margin: 0;
	}
	
	/* Categories Grid */
	.categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}
	
	.category-card {
		cursor: pointer;
	}
	
	.category-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border-secondary);
	}
	
	.category-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.category-icon {
		font-size: 1.5rem;
	}
	
	.category-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}
	
	.category-score {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}
	
	.test-results {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.test-item {
		padding: 0.5rem;
		background: var(--color-background-secondary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.test-item:hover {
		background: var(--color-background-tertiary);
	}
	
	.test-item.expanded {
		background: var(--color-background-tertiary);
		box-shadow: inset 0 0 0 1px var(--color-border-primary);
	}
	
	.test-item.running {
		opacity: 0.6;
		cursor: default;
	}
	
	.test-main {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.test-status {
		font-size: 1rem;
		flex-shrink: 0;
	}
	
	.test-name {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}
	
	.test-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		font-variant-numeric: tabular-nums;
	}
	
	.test-details {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border-tertiary);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.detail-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.8125rem;
		line-height: 1.4;
	}
	
	.detail-icon {
		font-size: 0.875rem;
		flex-shrink: 0;
		margin-top: 0.1rem;
	}
	
	.detail-message {
		color: var(--color-text-secondary);
	}
	
	.detail-recommendation .detail-message {
		color: var(--color-primary-base);
	}
	
	.no-results {
		text-align: center;
		color: var(--color-text-tertiary);
		font-style: italic;
		padding: 2rem 0;
		margin: 0;
	}
	
	/* Issues Panel */
	.issues-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.issues-header {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}
	
	.issues-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.issue-card {
		padding: 1rem;
		background: var(--color-background-secondary);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--color-warning-base);
		transition: all var(--duration-fast);
	}
	
	.issue-card.critical {
		border-left-color: var(--color-error-base);
		background: var(--color-error-subtle);
	}
	
	.issue-card:hover {
		transform: translateX(2px);
		box-shadow: var(--shadow-subtle);
	}
	
	.issue-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	
	.issue-severity {
		font-size: 1rem;
	}
	
	.issue-category {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		background: var(--color-background-tertiary);
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-sm);
	}
	
	.issue-time {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
	}
	
	.issue-message {
		font-size: 0.875rem;
		color: var(--color-text-primary);
		margin: 0 0 0.5rem 0;
		font-weight: 500;
	}
	
	.issue-recommendation {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		margin: 0;
		padding-left: 1.5rem;
	}
	
	/* Settings Panel */
	.settings-panel {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}
	
	.setting-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}
	
	.setting-item input[type="checkbox"] {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
	}
	
	.setting-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}
	
	.setting-info {
		font-size: 0.8125rem;
		color: var(--color-text-tertiary);
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.detailed-header {
			flex-direction: column;
			align-items: flex-start;
		}
		
		.header-actions {
			width: 100%;
			justify-content: stretch;
		}
		
		.overall-score {
			flex-direction: column;
			gap: 2rem;
		}
		
		.summary-stats {
			gap: 1.5rem;
		}
		
		.categories-grid {
			grid-template-columns: 1fr;
		}
		
		.compact-score {
			flex-direction: column;
			gap: 1rem;
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		* {
			transition: none !important;
			animation: none !important;
		}
	}
	
	/* High contrast */
	@media (prefers-contrast: high) {
		.test-item.expanded {
			outline: 2px solid currentColor;
		}
		
		.issue-card {
			border-left-width: 5px;
		}
	}
</style>