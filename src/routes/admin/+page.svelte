<script>
	import { getAllTools, resetToolsToDefaults, exportTools, importTools, refreshTools, isLoading } from '$lib/stores/tools.js';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	
	let tools = getAllTools();
	let showResetConfirm = false;
	let showBackupModal = false;
	let backupData = '';
	let importData = '';
	let showImportModal = false;
	let lastSaved = '';
	let isResetting = false;
	let isImporting = false;

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
	});

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
			<p>Version: 1.0.0-beta.1</p>
			{#if $isLoading}
				<p class="text-blue-600">🔄 Syncing...</p>
			{/if}
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
						<th class="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each tools as tool}
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
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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