<script>
	import ToolCard from '$lib/components/ToolCard.svelte';
	import { getActiveTools } from '$lib/stores/tools.js';
	import { goto } from '$app/navigation';

	const tools = getActiveTools();

	function handleToolClick(toolId) {
		goto(`/chat/${toolId}`);
	}
</script>

<svelte:head>
	<title>OBT Helper - AI Tools for Everyone</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
	<!-- Hero Section -->
	<div class="text-center mb-16">
		<h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
			AI Tools for <span class="text-primary-600">Everyone</span>
		</h1>
		<p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
			Powerful AI assistants to help with writing, math, coding, cooking, and more. 
			Clean, fast, and built for 2025.
		</p>
		<div class="flex items-center justify-center space-x-4 text-sm text-gray-500">
			<span class="flex items-center">
				<span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
				No login required
			</span>
			<span class="flex items-center">
				<span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
				Voice support
			</span>
			<span class="flex items-center">
				<span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
				Always free
			</span>
		</div>
	</div>

	<!-- Tools Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each tools as tool}
			<div on:click={() => handleToolClick(tool.id)} on:keydown={(e) => e.key === 'Enter' && handleToolClick(tool.id)} role="button" tabindex="0">
				<ToolCard {tool} />
			</div>
		{/each}
	</div>

	<!-- Features Section -->
	<div class="mt-20">
		<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
			Why Choose OBT Helper?
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<div class="text-center">
				<div class="text-4xl mb-4">⚡</div>
				<h3 class="text-xl font-semibold mb-2">Lightning Fast</h3>
				<p class="text-gray-600">Get responses in seconds, not minutes. Our optimized infrastructure ensures quick AI interactions.</p>
			</div>
			<div class="text-center">
				<div class="text-4xl mb-4">🎯</div>
				<h3 class="text-xl font-semibold mb-2">Purpose-Built</h3>
				<p class="text-gray-600">Each tool is specifically designed for its task, with custom prompts and optimized settings.</p>
			</div>
			<div class="text-center">
				<div class="text-4xl mb-4">🔒</div>
				<h3 class="text-xl font-semibold mb-2">Privacy First</h3>
				<p class="text-gray-600">Your conversations stay private. No data collection, no tracking, just helpful AI assistance.</p>
			</div>
		</div>
	</div>
</div> 