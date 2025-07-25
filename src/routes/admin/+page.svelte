<script>
	import { getAllTools, resetToolsToDefaults, exportTools, importTools, refreshTools, isLoading } from '$lib/stores/tools.js';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/utils/api.js';
	
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
	
	// Issue 2.2.2: Enhanced import with file upload and validation
	let importPreview = null;
	let importError = null;

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
			const response = await apiFetch('/whatsapp-sessions');
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
			const response = await apiFetch('/ai-usage-stats?days=7');
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

	// Issue 2.2.2: Enhanced file upload handling
	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (!file) return;
		
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target.result);
				const validation = validateImportData(data);
				
				if (validation.valid) {
					importPreview = data;
					importError = null;
					importData = e.target.result; // Set the text data for the existing function
				} else {
					importPreview = null;
					importError = validation.error;
					importData = '';
				}
			} catch (error) {
				importPreview = null;
				importError = 'Invalid JSON file';
				importData = '';
			}
		};
		reader.readAsText(file);
	}
	
	// Issue 2.2.2: Import validation
	function validateImportData(data) {
		// Handle both single tool and multiple tools import
		const toolsToValidate = Array.isArray(data) ? data : [data];
		
		for (const tool of toolsToValidate) {
			const required = ['name', 'description', 'systemPrompt', 'model'];
			const missing = required.filter(field => !tool[field]);
			
			if (missing.length > 0) {
				return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
			}
			
			if (tool.model && !['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'].includes(tool.model)) {
				return { valid: false, error: `Unsupported model type: ${tool.model}` };
			}
		}
		
		return { valid: true };
	}
	
	// Issue 2.2.2: Clear import data
	function clearImportData() {
		importData = '';
		importPreview = null;
		importError = null;
	}

	async function handleImport() {
		if (importData.trim()) {
			isImporting = true;
			const success = await importTools(importData);
			isImporting = false;
			
			if (success) {
				showImportModal = false;
				clearImportData();
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

<!-- 2025 Admin Dashboard with glassmorphic design -->
<div class="space-y-8">
	<div class="flex justify-between items-start">
		<div>
			<h1 class="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
			<p class="text-gray-200 text-lg">Manage your AI tools and system prompts</p>
		</div>
		<div class="text-right text-sm">
			<div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
				<p class="text-gray-200">💾 Saved to {browser && window.location.hostname === 'localhost' ? 'Local File Storage' : 'Netlify Blobs'}</p>
				<p class="text-gray-300">Last updated: {lastSaved}</p>
				<p class="text-purple-300 font-medium">Version: 1.1.0</p>
				{#if $isLoading}
					<p class="text-blue-300 animate-pulse">🔄 Syncing...</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- 2025 Stats Cards with glassmorphic design -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
		<div class="relative group">
			<div class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
			<div class="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
				<div class="flex items-center">
					<div class="text-3xl mr-4 filter drop-shadow-lg">🤖</div>
					<div>
						<p class="text-3xl font-bold text-white">{tools.length}</p>
						<p class="text-gray-200">Total Tools</p>
					</div>
				</div>
			</div>
		</div>
		
		<div class="relative group">
			<div class="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
			<div class="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
				<div class="flex items-center">
					<div class="text-3xl mr-4 filter drop-shadow-lg">✅</div>
					<div>
						<p class="text-3xl font-bold text-green-300">{tools.filter(t => t.isActive).length}</p>
						<p class="text-gray-200">Active Tools</p>
					</div>
				</div>
			</div>
		</div>
		
		<div class="relative group">
			<div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
			<div class="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
				<div class="flex items-center">
					<div class="text-3xl mr-4 filter drop-shadow-lg">🔧</div>
					<div>
						<p class="text-3xl font-bold text-blue-300">{tools.filter(t => t.model === 'gpt-4o').length}</p>
						<p class="text-gray-200">GPT-4o Tools</p>
					</div>
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

	<!-- 2025 Chart.js Visualizations -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Daily Cost Chart -->
		<div class="relative group">
			<div class="absolute -inset-1 bg-gradient-to-r from-green-600 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
			<div class="relative bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl">
				<div class="flex justify-between items-center mb-6">
					<h3 class="text-xl font-bold text-white">Daily AI Costs</h3>
					<div class="text-sm text-gray-300 bg-white/10 px-3 py-1 rounded-full">
						Avg: ${getAvgCost().toFixed(4)}/req
					</div>
				</div>
				<div class="h-64 bg-white/5 rounded-xl p-4">
					<canvas bind:this={dailyCostCanvas}></canvas>
				</div>
			</div>
		</div>
		
		<!-- Tool Usage Chart -->
		<div class="relative group">
			<div class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
			<div class="relative bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl">
				<h3 class="text-xl font-bold text-white mb-6">Usage by Tool</h3>
				<div class="h-64 bg-white/5 rounded-xl p-4">
					<canvas bind:this={toolUsageCanvas}></canvas>
				</div>
			</div>
		</div>
	</div>

	<!-- 2025 Additional charts and usage summary -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Model Breakdown Chart -->
		<div class="relative group">
			<div class="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
			<div class="relative bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl">
				<h3 class="text-xl font-bold text-white mb-6">Cost by Model</h3>
				<div class="h-64 bg-white/5 rounded-xl p-4">
					<canvas bind:this={modelBreakdownCanvas}></canvas>
				</div>
			</div>
		</div>
		
		<!-- Usage Summary Stats -->
		<div class="relative group lg:col-span-2">
			<div class="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
			<div class="relative bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl">
				<h3 class="text-xl font-bold text-white mb-6">Usage Summary (7 days)</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="bg-white/5 rounded-xl p-4 border border-white/10">
						<div class="flex justify-between items-center">
							<span class="text-gray-300">Total Conversations:</span>
							<span class="font-bold text-white text-lg">{aiUsageLoading ? '...' : (aiUsageStats.total?.requests || 0)}</span>
						</div>
					</div>
					<div class="bg-white/5 rounded-xl p-4 border border-white/10">
						<div class="flex justify-between items-center">
							<span class="text-gray-300">Total Cost:</span>
							<span class="font-bold text-green-400 text-lg">${getTotalCost().toFixed(4)}</span>
						</div>
					</div>
					<div class="bg-white/5 rounded-xl p-4 border border-white/10">
						<div class="flex justify-between items-center">
							<span class="text-gray-300">Avg Cost/Chat:</span>
							<span class="font-bold text-white text-lg">${getAvgCost().toFixed(4)}</span>
						</div>
					</div>
					<div class="bg-white/5 rounded-xl p-4 border border-white/10">
						<div class="flex justify-between items-center">
							<span class="text-gray-300">Total Tokens:</span>
							<span class="font-bold text-white text-lg">{aiUsageLoading ? '...' : ((aiUsageStats.total?.tokens || 0).toLocaleString())}</span>
						</div>
					</div>
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

<!-- Issue 2.2.2: Enhanced Import Modal with File Upload -->
{#if showImportModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
			<h3 class="text-lg font-semibold text-gray-900 mb-3">Import Tool Configuration</h3>
			
			<!-- File Upload Section -->
			<div class="mb-4">
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Upload JSON File
				</label>
				<input 
					type="file"
					accept=".json"
					on:change={handleFileSelect}
					disabled={isImporting}
					class="w-full p-2 border border-gray-300 rounded-lg disabled:opacity-50"
				/>
				<p class="text-xs text-gray-500 mt-1">
					Select a tool JSON file exported from this or another OBT Helper instance
				</p>
			</div>
			
			<!-- Preview Section -->
			{#if importPreview}
				<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
					<h4 class="font-medium text-green-800 mb-2">Import Preview</h4>
					{#if Array.isArray(importPreview)}
						<p class="text-sm text-green-700">
							<strong>Multiple Tools:</strong> {importPreview.length} tools found
						</p>
						<div class="mt-2 space-y-1">
							{#each importPreview.slice(0, 3) as tool}
								<p class="text-xs text-green-600">• {tool.name} ({tool.model})</p>
							{/each}
							{#if importPreview.length > 3}
								<p class="text-xs text-green-600">... and {importPreview.length - 3} more</p>
							{/if}
						</div>
					{:else}
						<p class="text-sm text-green-700">
							<strong>Tool:</strong> {importPreview.name}
						</p>
						<p class="text-sm text-green-700">
							<strong>Model:</strong> {importPreview.model}
						</p>
						<p class="text-sm text-green-700">
							<strong>Description:</strong> {importPreview.description}
						</p>
					{/if}
				</div>
			{/if}
			
			<!-- Error Section -->
			{#if importError}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<h4 class="font-medium text-red-800 mb-1">Validation Error</h4>
					<p class="text-sm text-red-700">{importError}</p>
				</div>
			{/if}
			
			<!-- Manual JSON Input -->
			<div class="mb-4">
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Or Paste JSON Directly
				</label>
				<textarea 
					bind:value={importData}
					placeholder="Paste your backup JSON here..."
					disabled={isImporting}
					class="w-full h-32 p-3 border border-gray-300 rounded-lg text-xs font-mono resize-none disabled:opacity-50"
				></textarea>
			</div>
			
			<div class="flex space-x-3 mt-4">
				<button 
					on:click={handleImport}
					class="btn-primary"
					disabled={!importData.trim() || isImporting || importError}
				>
					{isImporting ? '📥 Importing...' : '📥 Import Tools'}
				</button>
				<button 
					on:click={() => { showImportModal = false; clearImportData(); }}
					disabled={isImporting}
					class="btn-secondary disabled:opacity-50"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if} 