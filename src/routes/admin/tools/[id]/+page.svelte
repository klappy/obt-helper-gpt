<script>
	import { page } from '$app/stores';
	import { getToolById, updateTool } from '$lib/stores/tools.js';
	import { goto } from '$app/navigation';
	import { sendChatMessage, parseStreamingResponse } from '$lib/utils/openai.js';
	import { onMount } from 'svelte';

	$: toolId = $page.params.id;
	$: tool = getToolById(toolId);

	// Editable fields
	let editedTool = {};
	let isDirty = false;
	let isSaving = false;
	let saveSuccess = false;
	let isInitialized = false;

	// Preview functionality
	let previewMessage = '';
	let previewResponse = '';
	let isPreviewLoading = false;
	let apiKey = '';

	// Initialize edited tool when tool loads (only once)
	$: if (tool && !isInitialized) {
		editedTool = { ...tool };
		isInitialized = true;
		isDirty = false;
	}

	// Watch for changes to mark as dirty
	function markDirty() {
		if (isInitialized && tool) {
			isDirty = JSON.stringify(editedTool) !== JSON.stringify(tool);
		}
	}

	// Get API key
	onMount(() => {
		apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
	});

	async function handleSave() {
		if (!tool || !isDirty) return;
		
		isSaving = true;
		const success = await updateTool(tool.id, editedTool);
		isSaving = false;
		
		if (success) {
			saveSuccess = true;
			isDirty = false;
			
			setTimeout(() => {
				saveSuccess = false;
			}, 2000);
		} else {
			alert('Error saving tool. Please try again.');
		}
	}

	function handleCancel() {
		if (tool) {
			editedTool = { ...tool };
			isDirty = false;
		}
	}

	async function handlePreview() {
		if (!previewMessage.trim() || !apiKey) return;
		
		isPreviewLoading = true;
		previewResponse = '';
		
		try {
			const testMessages = [{
				role: 'user',
				content: previewMessage
			}];
			
			const response = await sendChatMessage(testMessages, editedTool, apiKey);
			
			for await (const chunk of parseStreamingResponse(response)) {
				previewResponse += chunk;
			}
		} catch (error) {
			previewResponse = `Error: ${error.message}`;
		} finally {
			isPreviewLoading = false;
		}
	}

	// Redirect if tool not found
	$: if (toolId && !tool) {
		goto('/admin');
	}
</script>

<svelte:head>
	<title>{tool ? `Edit ${tool.name}` : 'Edit Tool'} - Admin</title>
</svelte:head>

{#if tool}
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900 flex items-center space-x-3">
					<span class="text-4xl">{editedTool.icon}</span>
					<span>Edit {tool.name}</span>
					{#if isDirty}
						<span class="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Unsaved</span>
					{:else}
						<span class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">💾 Saved</span>
					{/if}
				</h1>
				<p class="text-gray-600">Customize the AI behavior and settings • Changes auto-save to localStorage</p>
			</div>
			<div class="flex space-x-3">
				<button 
					on:click={handleCancel}
					disabled={!isDirty}
					class="btn-secondary disabled:opacity-50"
				>
					Cancel
				</button>
				<button 
					on:click={handleSave}
					disabled={!isDirty || isSaving}
					class="btn-primary disabled:opacity-50"
				>
					{isSaving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</div>

		{#if saveSuccess}
			<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
				✅ Tool updated successfully!
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Editor Panel -->
			<div class="space-y-6">
				<!-- Basic Info -->
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
					
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								Tool Name
							</label>
							<input
								type="text"
								bind:value={editedTool.name}
								on:input={markDirty}
								class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								Description
							</label>
							<input
								type="text"
								bind:value={editedTool.description}
								on:input={markDirty}
								class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
							/>
						</div>
						
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									Icon
								</label>
								<input
									type="text"
									bind:value={editedTool.icon}
									on:input={markDirty}
									class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									Model
								</label>
								<select
									bind:value={editedTool.model}
									on:change={markDirty}
									class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
								>
									<option value="gpt-4o-mini">GPT-4o Mini</option>
									<option value="gpt-4o">GPT-4o</option>
								</select>
							</div>
						</div>
					</div>
				</div>

				<!-- Advanced Settings -->
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">AI Settings</h2>
					
					<div class="space-y-4">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									Temperature ({editedTool.temperature})
								</label>
								<input
									type="range"
									min="0"
									max="1"
									step="0.1"
									bind:value={editedTool.temperature}
									on:input={markDirty}
									class="w-full"
								/>
								<div class="flex justify-between text-xs text-gray-500">
									<span>Focused</span>
									<span>Creative</span>
								</div>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									Max Tokens
								</label>
								<input
									type="number"
									min="100"
									max="4000"
									bind:value={editedTool.maxTokens}
									on:input={markDirty}
									class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
							</div>
						</div>
						
						<div>
							<label class="flex items-center space-x-2">
								<input
									type="checkbox"
									bind:checked={editedTool.isActive}
									on:change={markDirty}
									class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
								/>
								<span class="text-sm font-medium text-gray-700">Tool is active</span>
							</label>
						</div>
					</div>
				</div>

				<!-- System Prompt -->
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">System Prompt</h2>
					<p class="text-sm text-gray-600 mb-4">
						This defines how the AI behaves and responds. Be specific and clear.
					</p>
					
					<textarea
						bind:value={editedTool.systemPrompt}
						on:input={markDirty}
						rows="12"
						class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
						placeholder="You are a helpful assistant..."
					></textarea>
					
					<div class="mt-2 text-xs text-gray-500">
						Character count: {editedTool.systemPrompt?.length || 0}
					</div>
				</div>
			</div>

			<!-- Preview Panel -->
			<div class="space-y-6">
				<div class="card">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Live Preview</h2>
					<p class="text-sm text-gray-600 mb-4">
						Test your prompt changes in real-time
					</p>
					
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								Test Message
							</label>
							<textarea
								bind:value={previewMessage}
								rows="3"
								class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
								placeholder="Enter a test message..."
							></textarea>
						</div>
						
						<button
							on:click={handlePreview}
							disabled={!previewMessage.trim() || isPreviewLoading || !apiKey}
							class="btn-primary disabled:opacity-50"
						>
							{isPreviewLoading ? 'Testing...' : 'Test Prompt'}
						</button>
						
						{#if !apiKey}
							<div class="text-sm text-yellow-600">
								⚠️ API key required for preview
							</div>
						{/if}
						
						{#if previewResponse}
							<div class="border rounded-lg p-4 bg-gray-50">
								<h4 class="font-medium text-gray-900 mb-2">AI Response:</h4>
								<div class="text-sm text-gray-700 whitespace-pre-wrap">
									{previewResponse}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Current Settings Summary -->
				<div class="card">
					<h3 class="text-lg font-semibold text-gray-900 mb-3">Current Settings</h3>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">Model:</span>
							<span class="font-medium">{editedTool.model}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Temperature:</span>
							<span class="font-medium">{editedTool.temperature}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Max Tokens:</span>
							<span class="font-medium">{editedTool.maxTokens}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Status:</span>
							<span class="font-medium {editedTool.isActive ? 'text-green-600' : 'text-gray-600'}">
								{editedTool.isActive ? 'Active' : 'Inactive'}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="text-center py-12">
		<h1 class="text-2xl font-bold text-gray-900 mb-4">Tool Not Found</h1>
		<a href="/admin" class="btn-primary">Back to Dashboard</a>
	</div>
{/if} 