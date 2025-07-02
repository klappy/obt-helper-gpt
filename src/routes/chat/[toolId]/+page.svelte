<script>
	import { page } from '$app/stores';
	import { getToolById } from '$lib/stores/tools.js';
	import ChatInterface from '$lib/components/ChatInterface.svelte';
	import { goto } from '$app/navigation';

	$: toolId = $page.params.toolId;
	$: tool = getToolById(toolId);

	// Redirect to home if tool not found
	$: if (toolId && !tool) {
		goto('/');
	}
</script>

<svelte:head>
	<title>{tool ? `${tool.name} - OBT Helper` : 'Chat - OBT Helper'}</title>
</svelte:head>

{#if tool}
	<div class="h-screen flex flex-col">
		<!-- Back button -->
		<div class="bg-white border-b px-4 py-2">
			<button 
				on:click={() => goto('/')}
				class="text-gray-600 hover:text-gray-900 flex items-center space-x-2 text-sm"
			>
				<span>←</span>
				<span>Back to Tools</span>
			</button>
		</div>
		
		<!-- Chat Interface -->
		<div class="flex-1">
			<ChatInterface {tool} />
		</div>
	</div>
{:else}
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
		<h1 class="text-2xl font-bold text-gray-900 mb-4">Tool Not Found</h1>
		<p class="text-gray-600 mb-6">The AI tool you're looking for doesn't exist.</p>
		<button on:click={() => goto('/')} class="btn-primary">
			Back to Tools
		</button>
	</div>
{/if} 