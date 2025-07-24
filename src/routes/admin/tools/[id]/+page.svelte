<script>
	import { page } from '$app/stores';
	import { getToolById, updateTool } from '$lib/stores/tools.js';
	import { goto } from '$app/navigation';

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
	
	// Issue 1.2.4: Human override functionality
	let previewMessages = [];
	let overrideResponse = '';
	let showOverrideModal = false;
	let lastMessageIndex = -1;
	
	// Issue 2.2.1: Tool export/import functionality
	let showImportModal = false;

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
	
	// Issue 2.2.1: Export tool as JSON
	async function exportTool() {
		// Clean tool data for export
		const exportData = {
			name: editedTool.name,
			description: editedTool.description,
			icon: editedTool.icon,
			systemPrompt: editedTool.systemPrompt,
			model: editedTool.model,
			temperature: editedTool.temperature,
			maxTokens: editedTool.maxTokens,
			costCeiling: editedTool.costCeiling,
			fallbackModel: editedTool.fallbackModel,
			// Metadata
			exportedAt: new Date().toISOString(),
			exportedBy: 'OBT Helper GPT',
			version: '1.0',
			// Don't export: id, createdAt, updatedAt, usage stats
		};
		
		// Create downloadable file
		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: 'application/json'
		});
		
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${editedTool.name.toLowerCase().replace(/\s+/g, '-')}-tool.json`;
		a.click();
		
		URL.revokeObjectURL(url);
		
		// Log export action
		try {
			await fetch('/.netlify/functions/log-action', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'export_tool',
					toolId: tool.id,
					toolName: editedTool.name
				})
			});
		} catch (error) {
			console.log('Could not log export action:', error);
		}
	}

	async function handlePreview() {
		if (!previewMessage.trim()) return;
		
		isPreviewLoading = true;
		previewResponse = '';
		
		// Issue 1.2.4: Add user message to chat history
		const userMessage = {
			id: Date.now(),
			role: 'user',
			content: previewMessage.trim(),
			timestamp: new Date()
		};
		previewMessages = [...previewMessages, userMessage];
		
		try {
			const response = await fetch('/.netlify/functions/tool-preview', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					tool: editedTool,
					message: previewMessage
				})
			});
			
			const data = await response.json();
			
			if (data.success) {
				previewResponse = data.response;
				
				// Issue 1.2.4: Add AI response to chat history
				const aiMessage = {
					id: Date.now() + 1,
					role: 'assistant',
					content: data.response,
					timestamp: new Date(),
					isOverridden: false
				};
				previewMessages = [...previewMessages, aiMessage];
				lastMessageIndex = previewMessages.length - 1;
			} else {
				previewResponse = `Error: ${data.error}`;
			}
		} catch (error) {
			previewResponse = `Error: ${error.message}`;
		} finally {
			isPreviewLoading = false;
			previewMessage = ''; // Clear input after sending
		}
	}
	
	// Issue 1.2.4: Handle human override
	function handleOverride() {
		showOverrideModal = true;
	}
	
	function applyOverride() {
		if (!overrideResponse.trim() || lastMessageIndex === -1) return;
		
		// Replace the last AI message with human override
		previewMessages = previewMessages.map((msg, index) => {
			if (index === lastMessageIndex && msg.role === 'assistant') {
				return {
					...msg,
					content: overrideResponse.trim(),
					isOverridden: true,
					originalContent: msg.content
				};
			}
			return msg;
		});
		
		previewResponse = overrideResponse.trim();
		overrideResponse = '';
		showOverrideModal = false;
	}
	
	function cancelOverride() {
		overrideResponse = '';
		showOverrideModal = false;
	}
	
	// Issue 1.2.4: Clear chat history
	function clearPreviewHistory() {
		previewMessages = [];
		previewResponse = '';
		lastMessageIndex = -1;
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
		
		<!-- Issue 2.2.1: Tool Export/Import Section -->
		<div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900 mb-3">Tool Sharing</h2>
			<p class="text-sm text-gray-600 mb-4">Export this tool as a JSON template to share with others, or import a tool from a JSON file.</p>
			<div class="flex gap-4">
				<button 
					on:click={exportTool}
					class="btn-secondary flex items-center gap-2"
				>
					📄 Export Tool
				</button>
				
				<button 
					on:click={() => showImportModal = true}
					class="btn-secondary flex items-center gap-2"
				>
					📂 Import Tool
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
						
						<!-- Issue 1.2.3: Cost Ceiling Controls -->
						<div class="border-t pt-4">
							<h3 class="text-lg font-medium text-gray-900 mb-3">Cost Control</h3>
							<div class="space-y-4">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">
											Daily Cost Ceiling ($)
										</label>
										<input
											type="number"
											min="0"
											max="10"
											step="0.01"
											bind:value={editedTool.costCeiling}
											on:input={markDirty}
											placeholder="e.g., 0.50"
											class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
										/>
										<p class="text-xs text-gray-500 mt-1">
											Auto-downgrade to cheaper model when exceeded
										</p>
									</div>
									
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">
											Fallback Model
										</label>
										<select
											bind:value={editedTool.fallbackModel}
											on:change={markDirty}
											class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
										>
											<option value="">No fallback (disable tool)</option>
											<option value="gpt-4o-mini">GPT-4o Mini (Cheaper)</option>
											<option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cheapest)</option>
										</select>
										<p class="text-xs text-gray-500 mt-1">
											Model to use when cost ceiling is hit
										</p>
									</div>
								</div>
								
								{#if editedTool.costCeiling && editedTool.costCeiling > 0}
									<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
										<div class="flex items-start space-x-2">
											<div class="text-blue-600">💡</div>
											<div class="text-sm text-blue-800">
												<p class="font-medium">Cost Ceiling Active</p>
												<p>When daily usage exceeds ${editedTool.costCeiling}, this tool will {editedTool.fallbackModel ? `switch to ${editedTool.fallbackModel}` : 'be disabled'} until the next day.</p>
												<p class="mt-1 text-blue-600">Current model pricing: 
													{#if editedTool.model === 'gpt-4o'}
														~$0.06/1K tokens
													{:else if editedTool.model === 'gpt-4o-mini'}
														~$0.0006/1K tokens
													{:else}
														~$0.002/1K tokens
													{/if}
												</p>
											</div>
										</div>
									</div>
								{/if}
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
								<span class="text-sm text-gray-700">Tool is active and available to users</span>
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
				<!-- Issue 1.2.4: Enhanced Live Preview with Human Override -->
				<div class="card">
					<div class="flex justify-between items-center mb-4">
						<h2 class="text-xl font-semibold text-gray-900">Live Preview & Testing</h2>
						<div class="flex space-x-2">
							{#if previewMessages.length > 0}
								<button
									on:click={clearPreviewHistory}
									class="text-sm px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
								>
									Clear History
								</button>
							{/if}
							{#if lastMessageIndex >= 0}
								<button
									on:click={handleOverride}
									class="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md hover:bg-yellow-200"
								>
									Override Last Response
								</button>
							{/if}
						</div>
					</div>
					<p class="text-sm text-gray-600 mb-4">
						Test your prompt changes and override AI responses for quality assurance
					</p>
					
					<!-- Chat History Display -->
					{#if previewMessages.length > 0}
						<div class="border rounded-lg p-4 bg-gray-50 mb-4 max-h-64 overflow-y-auto">
							<h4 class="font-medium text-gray-900 mb-3">Conversation History:</h4>
							<div class="space-y-3">
								{#each previewMessages as message, index}
									<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
										<div class="max-w-xs px-3 py-2 rounded-lg {
											message.role === 'user' 
												? 'bg-blue-500 text-white' 
												: message.isOverridden
													? 'bg-yellow-100 border border-yellow-300 text-yellow-900'
													: 'bg-white border text-gray-900'
										}">
											{#if message.isOverridden}
												<div class="flex items-center mb-1">
													<span class="text-xs">👤</span>
													<span class="text-xs font-medium ml-1">Human Override</span>
												</div>
											{/if}
											<p class="text-sm whitespace-pre-wrap">{message.content}</p>
											<div class="text-xs mt-1 {message.role === 'user' ? 'text-blue-100' : message.isOverridden ? 'text-yellow-600' : 'text-gray-500'}">
												{message.timestamp.toLocaleTimeString()}
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
					
					<!-- Test Message Input -->
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								Test Message
							</label>
							<div class="flex space-x-2">
								<textarea
									bind:value={previewMessage}
									rows="2"
									class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
									placeholder="Enter a test message..."
									on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handlePreview())}
								></textarea>
								<button
									on:click={handlePreview}
									disabled={!previewMessage.trim() || isPreviewLoading}
									class="btn-primary disabled:opacity-50 whitespace-nowrap"
								>
									{isPreviewLoading ? 'Testing...' : 'Send'}
								</button>
							</div>
							<p class="text-xs text-gray-500 mt-1">Press Enter to send, Shift+Enter for new line</p>
						</div>
						
						{#if isPreviewLoading}
							<div class="flex items-center space-x-2 text-gray-600">
								<div class="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
								<span class="text-sm">AI is thinking...</span>
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
						{#if editedTool.costCeiling && editedTool.costCeiling > 0}
							<div class="flex justify-between">
								<span class="text-gray-600">Cost Ceiling:</span>
								<span class="font-medium text-blue-600">${editedTool.costCeiling}/day</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Fallback Model:</span>
								<span class="font-medium">{editedTool.fallbackModel || 'Disable Tool'}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Issue 1.2.4: Human Override Modal -->
	{#if showOverrideModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
				<h3 class="text-lg font-semibold text-gray-900 mb-3">Override AI Response</h3>
				<p class="text-gray-600 mb-4">
					Replace the AI's response with your own text for testing purposes.
				</p>
				{#if lastMessageIndex >= 0 && previewMessages[lastMessageIndex]}
					<div class="mb-4 p-3 bg-gray-50 rounded-lg">
						<p class="text-sm font-medium text-gray-700 mb-1">Original AI Response:</p>
						<p class="text-sm text-gray-600 italic">"{previewMessages[lastMessageIndex].content}"</p>
					</div>
				{/if}
				<textarea 
					bind:value={overrideResponse}
					placeholder="Type your custom response here..."
					class="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
				></textarea>
				<div class="flex space-x-3 mt-4">
					<button 
						on:click={applyOverride}
						disabled={!overrideResponse.trim()}
						class="btn-primary disabled:opacity-50"
					>
						Apply Override
					</button>
					<button 
						on:click={cancelOverride}
						class="btn-secondary"
					>
						Cancel
					</button>
				</div>
				<p class="text-xs text-gray-500 mt-2">
					Override will be clearly marked in the conversation history.
				</p>
			</div>
		</div>
	{/if}
{:else}
	<div class="text-center py-12">
		<h1 class="text-2xl font-bold text-gray-900 mb-4">Tool Not Found</h1>
		<a href="/admin" class="btn-primary">Back to Dashboard</a>
	</div>
{/if} 