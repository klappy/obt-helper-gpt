<script>
	import { getAllTools, resetToolsToDefaults, exportTools, importTools, refreshTools, isLoading } from '$lib/stores/tools.js';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	
	// Issue 1.2.2: Import Chart.js for visualizations
	import Chart from 'chart.js/auto';
	
	let tools = getAllTools();
	let showResetConfirm = false;
	let showBackupModal = false;
	let backupData = '';
	let importData = '';
	let showImportModal = false;
	let lastSaved = '';
	let isResetting = false;
	let isImporting = false;

	// WhatsApp stats
	let whatsappStats = {};
	let whatsappLoading = true;

	// Issue 1.2.2: Enhanced AI usage stats with Chart.js support
	let aiUsageStats = {};
	let aiUsageLoading = true;
	
	// Issue 1.2.2: Chart variables
	let dailyCostChart = null;
	let toolUsageChart = null;
	let modelBreakdownChart = null;
	let dailyCostCanvas;
	let toolUsageCanvas; 
	let modelBreakdownCanvas;
	
	// Demo enhancement flags
	let showDetailedStats = false;

	// Update last saved time
	function updateLastSaved() {
		if (browser) {
			lastSaved = new Date().toLocaleString();
		}
	}

	// Initialize and refresh tools
	onMount(async () => {
		updateLastSaved();
		await refreshTools();
		tools = getAllTools();
		await fetchWhatsAppStats();
		await fetchAIUsageStats();
	});
	
	async function fetchWhatsAppStats() {
		try {
			const response = await fetch('/.netlify/functions/whatsapp-sessions');
			const data = await response.json();
			
			if (response.ok) {
				whatsappStats = data.stats || {};
			}
		} catch (err) {
			console.error('Error fetching WhatsApp stats:', err);
		} finally {
			whatsappLoading = false;
		}
	}

	// Issue 1.2.2: Enhanced AI usage stats fetching with Chart.js integration
	async function fetchAIUsageStats() {
		try {
			const response = await fetch('/.netlify/functions/ai-usage-stats?days=7');
			const data = await response.json();
			
			if (response.ok) {
				aiUsageStats = data;
				console.log('AI Usage Stats:', aiUsageStats);
				
				// Create charts after data is loaded
				if (browser) {
					setTimeout(() => createCharts(), 100);
				}
			}
		} catch (err) {
			console.error('Error fetching AI usage stats:', err);
		} finally {
			aiUsageLoading = false;
		}
	}

	// Issue 1.2.2: Create Chart.js visualizations
	function createCharts() {
		try {
			createDailyCostChart();
			createToolUsageChart();
			createModelBreakdownChart();
		} catch (error) {
			console.error('Error creating charts:', error);
		}
	}

	// Issue 1.2.2: Daily cost trend chart
	function createDailyCostChart() {
		if (!dailyCostCanvas || !aiUsageStats.dailyBreakdown) return;
		
		// Destroy existing chart
		if (dailyCostChart) {
			dailyCostChart.destroy();
		}
		
		const dailyData = aiUsageStats.dailyBreakdown || [];
		const labels = dailyData.map(day => {
			const date = new Date(day.date);
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		});
		const costs = dailyData.map(day => day.cost || 0);
		
		dailyCostChart = new Chart(dailyCostCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [{
					label: 'Daily Cost ($)',
					data: costs,
					borderColor: 'rgb(75, 192, 192)',
					backgroundColor: 'rgba(75, 192, 192, 0.1)',
					tension: 0.3,
					fill: true
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: 'AI Costs - Last 7 Days'
					},
					legend: {
						display: false
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: value => '$' + value.toFixed(4)
						}
					}
				}
			}
		});
	}

	// Issue 1.2.2: Tool usage breakdown chart
	function createToolUsageChart() {
		if (!toolUsageCanvas || !aiUsageStats.byTool) return;
		
		// Destroy existing chart
		if (toolUsageChart) {
			toolUsageChart.destroy();
		}
		
		const toolData = Object.entries(aiUsageStats.byTool || {});
		if (toolData.length === 0) return;
		
		const labels = toolData.map(([toolId]) => 
			toolId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
		);
		const costs = toolData.map(([, stats]) => stats.cost || 0);
		const requests = toolData.map(([, stats]) => stats.requests || 0);
		
		toolUsageChart = new Chart(toolUsageCanvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [{
					label: 'Cost ($)',
					data: costs,
					backgroundColor: 'rgba(54, 162, 235, 0.6)',
					borderColor: 'rgba(54, 162, 235, 1)',
					borderWidth: 1,
					yAxisID: 'y'
				}, {
					label: 'Requests',
					data: requests,
					backgroundColor: 'rgba(255, 99, 132, 0.6)',
					borderColor: 'rgba(255, 99, 132, 1)',
					borderWidth: 1,
					type: 'line',
					yAxisID: 'y1'
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: 'Usage by Tool'
					}
				},
				scales: {
					y: {
						type: 'linear',
						display: true,
						position: 'left',
						ticks: {
							callback: value => '$' + value.toFixed(4)
						}
					},
					y1: {
						type: 'linear',
						display: true,
						position: 'right',
						grid: {
							drawOnChartArea: false,
						},
						ticks: {
							callback: value => value + ' req'
						}
					}
				}
			}
		});
	}

	// Issue 1.2.2: Model breakdown pie chart
	function createModelBreakdownChart() {
		if (!modelBreakdownCanvas || !aiUsageStats.byModel) return;
		
		// Destroy existing chart
		if (modelBreakdownChart) {
			modelBreakdownChart.destroy();
		}
		
		const modelData = Object.entries(aiUsageStats.byModel || {});
		if (modelData.length === 0) return;
		
		const labels = modelData.map(([model]) => model);
		const costs = modelData.map(([, stats]) => stats.cost || 0);
		const colors = [
			'rgba(255, 99, 132, 0.8)',
			'rgba(54, 162, 235, 0.8)',
			'rgba(255, 205, 86, 0.8)',
			'rgba(75, 192, 192, 0.8)',
			'rgba(153, 102, 255, 0.8)'
		];
		
		modelBreakdownChart = new Chart(modelBreakdownCanvas, {
			type: 'doughnut',
			data: {
				labels,
				datasets: [{
					data: costs,
					backgroundColor: colors,
					borderColor: colors.map(color => color.replace('0.8', '1')),
					borderWidth: 2
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: 'Cost by Model'
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								const label = context.label || '';
								const value = context.parsed;
								const total = context.dataset.data.reduce((a, b) => a + b, 0);
								const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
								return `${label}: $${value.toFixed(4)} (${percentage}%)`;
							}
						}
					}
				}
			}
		});
	}

	// Issue 1.2.2: Helper functions for chart data processing
	function getLast7Days() {
		const days = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
		}
		return days;
	}

	function getTotalCost() {
		return aiUsageStats.total?.cost || 0;
	}

	function getAvgCost() {
		const total = aiUsageStats.total;
		return total?.requests > 0 ? total.cost / total.requests : 0;
	}

	async function handleReset() {
		isResetting = true;
		const success = await resetToolsToDefaults();
		isResetting = false;
		showResetConfirm = false;
		
		if (success) {
			tools = getAllTools();
			updateLastSaved();
			alert('Tools reset to defaults successfully!');
		} else {
			alert('Error resetting tools. Please try again.');
		}
	}

	function handleBackup() {
		backupData = exportTools();
		showBackupModal = true;
	}

	function copyBackupData() {
		if (browser && navigator.clipboard) {
			navigator.clipboard.writeText(backupData);
			alert('Backup data copied to clipboard!');
		}
	}

	function downloadBackup() {
		if (browser) {
			const blob = new Blob([backupData], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `obt-helper-backup-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	}

	async function handleImport() {
		if (importData.trim()) {
			isImporting = true;
			const success = await importTools(importData);
			isImporting = false;
			
			if (success) {
				showImportModal = false;
				importData = '';
				tools = getAllTools();
				updateLastSaved();
				alert('Tools imported successfully!');
			} else {
				alert('Error importing tools. Please check the JSON format.');
			}
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard - OBT Helper</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex justify-between items-start">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
			<p class="text-gray-600">Manage your AI tools and system prompts</p>
		</div>
		<div class="text-right text-sm text-gray-500">
			<p>💾 Saved to {browser && window.location.hostname === 'localhost' ? 'Local File Storage' : 'Netlify Blobs'}</p>
			<p>Last updated: {lastSaved}</p>
			<p>Version: 1.1.0</p>
			{#if $isLoading}
				<p class="text-blue-600">🔄 Syncing...</p>
			{/if}
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
		<div class="card">
			<div class="flex items-center">
				<div class="text-2xl mr-3">🤖</div>
				<div>
					<p class="text-2xl font-bold text-gray-900">{tools.length}</p>
					<p class="text-sm text-gray-600">Total Tools</p>
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center">
				<div class="text-2xl mr-3">✅</div>
				<div>
					<p class="text-2xl font-bold text-green-600">{tools.filter(t => t.isActive).length}</p>
					<p class="text-sm text-gray-600">Active Tools</p>
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center">
				<div class="text-2xl mr-3">🔧</div>
				<div>
					<p class="text-2xl font-bold text-blue-600">{tools.filter(t => t.model === 'gpt-4o').length}</p>
					<p class="text-sm text-gray-600">GPT-4o Tools</p>
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center">
				<div class="text-2xl mr-3">📱</div>
				<div>
					<p class="text-2xl font-bold text-purple-600">
						{whatsappLoading ? '...' : (whatsappStats.active || 0)}
					</p>
					<p class="text-sm text-gray-600">WhatsApp Sessions</p>
				</div>
			</div>
		</div>
		
		<div class="card">
			<div class="flex items-center">
				<div class="text-2xl mr-3">💰</div>
				<div>
					<p class="text-2xl font-bold text-green-600">
						{aiUsageLoading ? '...' : ('$' + getTotalCost().toFixed(4))}
					</p>
					<p class="text-sm text-gray-600">Total Cost (7d)</p>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-center">
				<div class="text-2xl mr-3">⚡</div>
				<div>
					<p class="text-2xl font-bold text-orange-600">
						{aiUsageLoading ? '...' : ((aiUsageStats.total?.requests || 0) + ' req')}
					</p>
					<p class="text-sm text-gray-600">Total Requests (7d)</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Issue 1.2.2: Chart.js Visualizations -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Daily Cost Chart -->
		<div class="bg-white p-6 rounded-lg shadow-sm border">
			<div class="flex justify-between items-center mb-4">
				<h3 class="text-lg font-semibold text-gray-900">Daily AI Costs</h3>
				<div class="text-sm text-gray-500">
					Avg: ${getAvgCost().toFixed(4)}/req
				</div>
			</div>
			<div class="h-64">
				<canvas bind:this={dailyCostCanvas}></canvas>
			</div>
		</div>
		
		<!-- Tool Usage Chart -->
		<div class="bg-white p-6 rounded-lg shadow-sm border">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Usage by Tool</h3>
			<div class="h-64">
				<canvas bind:this={toolUsageCanvas}></canvas>
			</div>
		</div>
	</div>

	<!-- Issue 1.2.2: Additional charts and usage summary -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Model Breakdown Chart -->
		<div class="bg-white p-6 rounded-lg shadow-sm border">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Cost by Model</h3>
			<div class="h-64">
				<canvas bind:this={modelBreakdownCanvas}></canvas>
			</div>
		</div>
		
		<!-- Usage Summary Stats -->
		<div class="bg-white p-6 rounded-lg shadow-sm border">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Usage Summary (7 days)</h3>
			<div class="space-y-3">
				<div class="flex justify-between">
					<span class="text-gray-600">Total Conversations:</span>
					<span class="font-medium">{aiUsageLoading ? '...' : (aiUsageStats.total?.requests || 0)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Total Cost:</span>
					<span class="font-medium text-green-600">${getTotalCost().toFixed(4)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Avg Cost/Chat:</span>
					<span class="font-medium">${getAvgCost().toFixed(4)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Total Tokens:</span>
					<span class="font-medium">{aiUsageLoading ? '...' : ((aiUsageStats.total?.tokens || 0).toLocaleString())}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Avg Tokens/Chat:</span>
					<span class="font-medium">{aiUsageLoading ? '...' : (aiUsageStats.total?.avgTokensPerRequest || 0)}</span>
				</div>
			</div>
		</div>

		<!-- Cost Trends -->
		<div class="bg-white p-6 rounded-lg shadow-sm border">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Cost Insights</h3>
			<div class="space-y-3">
				{#if !aiUsageLoading && aiUsageStats.byTool}
					{@const topTool = Object.entries(aiUsageStats.byTool).sort(([,a], [,b]) => b.cost - a.cost)[0]}
					{#if topTool}
						<div class="bg-blue-50 p-3 rounded-lg">
							<p class="text-sm text-blue-800 font-medium">Most Expensive Tool</p>
							<p class="text-lg text-blue-900">{topTool[0].replace(/-/g, ' ')}</p>
							<p class="text-sm text-blue-700">${topTool[1].cost.toFixed(4)} total</p>
						</div>
					{/if}
				{/if}
				
				{#if !aiUsageLoading && aiUsageStats.byModel}
					{@const topModel = Object.entries(aiUsageStats.byModel).sort(([,a], [,b]) => b.requests - a.requests)[0]}
					{#if topModel}
						<div class="bg-green-50 p-3 rounded-lg">
							<p class="text-sm text-green-800 font-medium">Most Used Model</p>
							<p class="text-lg text-green-900">{topModel[0]}</p>
							<p class="text-sm text-green-700">{topModel[1].requests} requests</p>
						</div>
					{/if}
				{/if}
				
				<div class="bg-gray-50 p-3 rounded-lg">
					<p class="text-sm text-gray-600 font-medium">Daily Average</p>
					<p class="text-lg text-gray-900">${(getTotalCost() / 7).toFixed(4)}</p>
					<p class="text-sm text-gray-600">per day</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Tools Management -->
	<div class="card">
		<h2 class="text-xl font-semibold text-gray-900 mb-4">AI Tools Management</h2>
		
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="text-left py-3 px-4 font-medium text-gray-700">Tool</th>
						<th class="text-left py-3 px-4 font-medium text-gray-700">Model</th>
						<th class="text-left py-3 px-4 font-medium text-gray-700">Status</th>
						<th class="text-left py-3 px-4 font-medium text-gray-700">Usage (7d)</th>
						<th class="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each tools as tool}
						{@const toolStats = aiUsageStats.byTool?.[tool.id]}
						<tr class="border-b border-gray-100 hover:bg-gray-50">
							<td class="py-3 px-4">
								<div class="flex items-center space-x-3">
									<span class="text-xl">{tool.icon}</span>
									<div>
										<p class="font-medium text-gray-900">{tool.name}</p>
										<p class="text-sm text-gray-600">{tool.description}</p>
									</div>
								</div>
							</td>
							<td class="py-3 px-4">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
									{tool.model}
								</span>
							</td>
							<td class="py-3 px-4">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
									tool.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
								}">
									{tool.isActive ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td class="py-3 px-4">
								{#if toolStats}
									<div class="text-sm">
										<div class="text-gray-900 font-medium">${toolStats.cost.toFixed(4)}</div>
										<div class="text-gray-600">{toolStats.requests} requests</div>
									</div>
								{:else}
									<span class="text-sm text-gray-400">No usage</span>
								{/if}
							</td>
							<td class="py-3 px-4">
								<a 
									href="/admin/tools/{tool.id}" 
									class="text-primary-600 hover:text-primary-700 text-sm font-medium"
								>
									Edit →
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="card">
			<h3 class="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
			<div class="space-y-2">
				<button 
					on:click={handleBackup}
					disabled={$isLoading}
					class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm flex items-center disabled:opacity-50"
				>
					📝 Backup All Prompts
				</button>
				<button 
					on:click={() => showImportModal = true}
					disabled={$isLoading}
					class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm flex items-center disabled:opacity-50"
				>
					📥 Import Configuration
				</button>
				<button 
					on:click={() => showResetConfirm = true}
					disabled={$isLoading}
					class="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 hover:text-red-700 text-sm flex items-center text-red-600 disabled:opacity-50"
				>
					🔄 Reset All Tools
				</button>
				<button 
					on:click={fetchAIUsageStats}
					disabled={aiUsageLoading}
					class="w-full text-left px-3 py-2 rounded-md hover:bg-blue-50 hover:text-blue-700 text-sm flex items-center text-blue-600 disabled:opacity-50"
				>
					📊 Refresh Analytics
				</button>
			</div>
		</div>
		
		<div class="card">
			<h3 class="text-lg font-semibold text-gray-900 mb-3">System Info</h3>
			<div class="space-y-2 text-sm text-gray-600">
				<p>Environment: {browser && window.location.hostname === 'localhost' ? 'Development' : 'Production'}</p>
				<p>Storage: {browser && window.location.hostname === 'localhost' ? 'Local File (.netlify/blobs-local/)' : 'Netlify Blobs'} (persistent)</p>
				<p>API Status: {$isLoading ? 'Syncing...' : 'Connected'}</p>
				<p>Last Updated: {lastSaved}</p>
			</div>
		</div>
		
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-3">WhatsApp Status</h3>
			
			<div class="space-y-3">
				<button 
					class="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
					type="button"
					on:click={() => window.open('/admin/whatsapp', '_blank')}
				>
					<div class="flex justify-between items-center">
						<span class="font-medium">Sessions Management</span>
						<span class="text-blue-600">→</span>
					</div>
				</button>
				
				<div class="space-y-2 bg-gray-50 rounded-lg p-3">
					<div class="flex justify-between">
						<span>Active Sessions:</span>
						<span>{whatsappLoading ? '...' : (whatsappStats.active || 0)}</span>
					</div>
					<div class="flex justify-between">
						<span>Total Messages:</span>
						<span>{whatsappLoading ? '...' : (whatsappStats.totalMessages || 0)}</span>
					</div>
					<div class="flex justify-between">
						<span>Total Cost:</span>
						<span>{whatsappLoading ? '...' : ('$' + (whatsappStats.totalCost || 0).toFixed(4))}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Reset Confirmation Modal -->
{#if showResetConfirm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<h3 class="text-lg font-semibold text-gray-900 mb-3">Reset All Tools?</h3>
			<p class="text-gray-600 mb-4">
				This will reset all tools to their default settings. All your custom prompts and configurations will be lost.
			</p>
			<div class="flex space-x-3">
				<button 
					on:click={handleReset}
					disabled={isResetting}
					class="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
				>
					{isResetting ? 'Resetting...' : 'Yes, Reset All'}
				</button>
				<button 
					on:click={() => showResetConfirm = false}
					disabled={isResetting}
					class="btn-secondary disabled:opacity-50"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Backup Modal -->
{#if showBackupModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
			<h3 class="text-lg font-semibold text-gray-900 mb-3">Backup Configuration</h3>
			<p class="text-gray-600 mb-4">
				Copy this JSON data to backup your tool configurations:
			</p>
			<textarea 
				bind:value={backupData}
				readonly
				class="w-full h-40 p-3 border border-gray-300 rounded-lg text-xs font-mono resize-none"
			></textarea>
			<div class="flex space-x-3 mt-4">
				<button 
					on:click={copyBackupData}
					class="btn-primary"
				>
					📋 Copy to Clipboard
				</button>
				<button 
					on:click={downloadBackup}
					class="btn-secondary"
				>
					💾 Download File
				</button>
				<button 
					on:click={() => showBackupModal = false}
					class="btn-secondary"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Import Modal -->
{#if showImportModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
			<h3 class="text-lg font-semibold text-gray-900 mb-3">Import Configuration</h3>
			<p class="text-gray-600 mb-4">
				Paste your backup JSON data to restore tool configurations:
			</p>
			<textarea 
				bind:value={importData}
				placeholder="Paste your backup JSON here..."
				disabled={isImporting}
				class="w-full h-40 p-3 border border-gray-300 rounded-lg text-xs font-mono resize-none disabled:opacity-50"
			></textarea>
			<div class="flex space-x-3 mt-4">
				<button 
					on:click={handleImport}
					class="btn-primary"
					disabled={!importData.trim() || isImporting}
				>
					{isImporting ? '📥 Importing...' : '📥 Import Tools'}
				</button>
				<button 
					on:click={() => { showImportModal = false; importData = ''; }}
					disabled={isImporting}
					class="btn-secondary disabled:opacity-50"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if} 