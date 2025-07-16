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
	<div class="text-center mb-16 relative">
		<!-- Gradient background -->
		<div class="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 -mx-4 sm:-mx-6 lg:-mx-8 rounded-3xl transform rotate-1"></div>
		<div class="relative z-10 py-12">
			<h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-pulse">
				AI Tools for <span class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Everyone</span>
			</h1>
			<p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
				🚀 Powerful AI assistants to help with writing, math, coding, cooking, and more.<br>
				Clean, fast, and built for 2025.
			</p>
			<div class="flex items-center justify-center space-x-6 text-sm text-gray-500 mb-6">
				<span class="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
					<span class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-ping"></span>
					No login required
				</span>
				<span class="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
					<span class="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-ping"></span>
					Voice support
				</span>
				<span class="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
					<span class="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-ping"></span>
					Always free
				</span>
			</div>
			<div class="text-sm text-gray-400">
				✨ <strong>New:</strong> 10 professional AI tools including Social Media Creator, Email Assistant & Data Analyst
			</div>
		</div>
	</div>

	<!-- Tools Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
		{#each tools as tool}
			<div 
				on:click={() => handleToolClick(tool.id)} 
				on:keydown={(e) => e.key === 'Enter' && handleToolClick(tool.id)} 
				role="button" 
				tabindex="0"
				class="transform transition-all duration-200 hover:scale-105 hover:shadow-xl cursor-pointer group"
			>
				<ToolCard {tool} />
			</div>
		{/each}
	</div>

	<!-- Call to Action Footer -->
	<div class="text-center mt-16 py-12 bg-gradient-to-r from-gray-50 to-white rounded-2xl">
		<h3 class="text-2xl font-bold text-gray-900 mb-4">
			Ready to boost your productivity?
		</h3>
		<p class="text-gray-600 mb-6">
			Choose any AI tool above to get started. No account needed, works instantly.
		</p>
		<div class="flex items-center justify-center space-x-3 text-sm text-gray-500">
			<span>⚡ Powered by OpenAI GPT-4</span>
			<span>•</span>
			<span>🔒 Privacy-first design</span>
			<span>•</span>
			<span>🌍 Works everywhere</span>
		</div>
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