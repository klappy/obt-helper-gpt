<script>
	import { getAllTools } from '$lib/stores/tools.js';
	
	const tools = getAllTools();
</script>

<svelte:head>
	<title>Admin Dashboard - OBT Helper</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
		<p class="text-gray-600">Manage your AI tools and system prompts</p>
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
				<button class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm">
					📝 Backup All Prompts
				</button>
				<button class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm">
					📊 View Usage Analytics
				</button>
				<button class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm">
					🔄 Reset All Tools
				</button>
			</div>
		</div>
		
		<div class="card">
			<h3 class="text-lg font-semibold text-gray-900 mb-3">System Info</h3>
			<div class="space-y-2 text-sm text-gray-600">
				<p>Environment: Development</p>
				<p>API Status: Connected</p>
				<p>Last Updated: Just now</p>
			</div>
		</div>
	</div>
</div> 