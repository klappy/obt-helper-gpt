<script lang="ts">
	import ToolCard from '$lib/components/ToolCard.svelte';
	import { GlassCard, LiquidButton } from '$lib/components/ui/index.js';
	import { getActiveTools } from '$lib/stores/tools.js';
	import { goto } from '$app/navigation';

	const tools = getActiveTools();

	function handleToolClick(event: CustomEvent<{ toolId: string }>) {
		const { toolId } = event.detail;
		goto(`/chat/${toolId}`);
	}
</script>

<svelte:head>
	<title>OBT Helper - AI Tools for Everyone</title>
</svelte:head>

<!-- 2025 Background with animated mesh -->
<div class="min-h-screen relative overflow-hidden">
	<!-- Multi-layer animated background -->
	<div class="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900"></div>
	<div class="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-transparent to-blue-900/30 animate-pulse"></div>
	<div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
	<div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.2),transparent_50%)]"></div>
	
	<!-- Floating particles background -->
	<div class="absolute inset-0 overflow-hidden">
		{#each Array(20) as _, i}
			<div 
				class="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
				style="
					left: {Math.random() * 100}%; 
					top: {Math.random() * 100}%; 
					animation-delay: {Math.random() * 3}s;
					animation-duration: {2 + Math.random() * 3}s;
				"
			></div>
		{/each}
	</div>
	
	<div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<!-- Hero Section with enhanced glassmorphism -->
		<div class="text-center mb-24 relative">
			<div class="relative group">
				<!-- Glow effect behind the card -->
				<div class="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
				
				<div class="relative bg-white/5 backdrop-blur-xl rounded-3xl p-16 border border-white/10 hover:border-white/20 transition-all duration-500 shadow-2xl">
					<h1 class="text-6xl md:text-8xl font-bold mb-8 text-white leading-tight">
						AI Tools for <br>
						<span class="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">Everyone</span>
					</h1>
					<p class="text-2xl text-gray-200 max-w-4xl mx-auto mb-12 leading-relaxed font-light">
						🚀 Powerful AI assistants to help with writing, math, coding, cooking, and more.<br>
						<span class="text-purple-300">Clean, fast, and built for 2025.</span>
					</p>
					
					<!-- Enhanced feature badges -->
					<div class="flex items-center justify-center space-x-8 text-lg mb-12 flex-wrap gap-6">
						<div class="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full flex items-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
							<span class="w-3 h-3 bg-green-400 rounded-full mr-3 animate-ping"></span>
							<span class="text-white font-medium">No login required</span>
						</div>
						<div class="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full flex items-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
							<span class="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-ping"></span>
							<span class="text-white font-medium">Voice support</span>
						</div>
						<div class="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full flex items-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
							<span class="w-3 h-3 bg-purple-400 rounded-full mr-3 animate-ping"></span>
							<span class="text-white font-medium">Always free</span>
						</div>
					</div>

					<div class="relative group">
						<div class="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
						<div class="relative bg-white/10 backdrop-blur-sm px-8 py-4 rounded-2xl inline-block border border-white/20">
							<span class="text-lg text-white">
								✨ <strong class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">New:</strong> 10 professional AI tools including Social Media Creator, Email Assistant & Data Analyst
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Enhanced Tools Grid -->
		<div class="mb-32">
			<h2 class="text-5xl font-bold text-center mb-16 text-white">
				Choose Your <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI Assistant</span>
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
				{#each tools as tool, index}
					<div class="transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 group"
						style="animation-delay: {index * 0.1}s">
						
						<!-- Glow effect -->
						<div class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
						
						<button 
							class="relative w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:bg-white/20 hover:border-purple-400/50 transition-all duration-500 text-left group shadow-2xl"
							on:click={() => goto(`/chat/${tool.id}`)}
							aria-label="Open {tool.name} chat">
							
							<div class="text-center">
								<div class="text-5xl mb-6 group-hover:scale-125 transition-transform duration-500 filter drop-shadow-lg">{tool.icon}</div>
								<h3 class="text-2xl font-bold mb-4 text-white group-hover:text-purple-300 transition-colors duration-300">{tool.name}</h3>
								<p class="text-gray-300 text-base mb-6 group-hover:text-gray-100 transition-colors leading-relaxed">{tool.description}</p>
								<div class="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 px-4 py-2 rounded-full text-sm inline-flex items-center border border-purple-400/30">
									<span class="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
									{tool.model}
								</div>
							</div>
						</button>
					</div>
				{/each}
			</div>
		</div>

		<!-- Enhanced Call to Action Section -->
		<div class="text-center mb-32">
			<div class="relative group">
				<div class="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
				<div class="relative bg-white/5 backdrop-blur-xl rounded-3xl p-16 border border-white/10 hover:border-white/20 transition-all duration-500 shadow-2xl">
					<h3 class="text-5xl font-bold mb-8 text-white">
						Ready to boost your <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">productivity</span>?
					</h3>
					<p class="text-gray-200 mb-12 text-xl max-w-3xl mx-auto leading-relaxed">
						Choose any AI tool above to get started. No account needed, works instantly.
					</p>
					
					<!-- Enhanced tech stack badges -->
					<div class="flex items-center justify-center space-x-8 text-lg text-white flex-wrap gap-6">
						<div class="flex items-center bg-white/10 backdrop-blur-sm px-6 py-4 rounded-full border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
							<span class="mr-3 text-2xl">⚡</span>
							<span class="font-medium">Powered by OpenAI GPT-4</span>
						</div>
						<div class="flex items-center bg-white/10 backdrop-blur-sm px-6 py-4 rounded-full border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
							<span class="mr-3 text-2xl">🔒</span>
							<span class="font-medium">Privacy-first design</span>
						</div>
						<div class="flex items-center bg-white/10 backdrop-blur-sm px-6 py-4 rounded-full border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300">
							<span class="mr-3 text-2xl">🌍</span>
							<span class="font-medium">Works everywhere</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Enhanced Features Section -->
		<div class="mb-24">
			<h2 class="text-5xl font-bold text-center mb-20 text-white">
				Why Choose <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">OBT Helper</span>?
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-10">
				<div class="relative group">
					<div class="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
					<div class="relative bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20 text-center hover:bg-white/20 hover:scale-105 hover:-translate-y-2 transition-all duration-500 shadow-2xl">
						<div class="text-6xl mb-8 animate-bounce">⚡</div>
						<h3 class="text-2xl font-bold mb-6 text-white">Lightning Fast</h3>
						<p class="text-gray-200 leading-relaxed text-lg">Get responses in seconds, not minutes. Our optimized infrastructure ensures quick AI interactions.</p>
					</div>
				</div>
				
				<div class="relative group">
					<div class="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
					<div class="relative bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20 text-center hover:bg-white/20 hover:scale-105 hover:-translate-y-2 transition-all duration-500 shadow-2xl">
						<div class="text-6xl mb-8 animate-bounce" style="animation-delay: 0.2s">🎯</div>
						<h3 class="text-2xl font-bold mb-6 text-white">Purpose-Built</h3>
						<p class="text-gray-200 leading-relaxed text-lg">Each tool is specifically designed for its task, with custom prompts and optimized settings.</p>
					</div>
				</div>
				
				<div class="relative group">
					<div class="absolute -inset-2 bg-gradient-to-r from-pink-600 to-blue-600 rounded-3xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
					<div class="relative bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20 text-center hover:bg-white/20 hover:scale-105 hover:-translate-y-2 transition-all duration-500 shadow-2xl">
						<div class="text-6xl mb-8 animate-bounce" style="animation-delay: 0.4s">🔒</div>
						<h3 class="text-2xl font-bold mb-6 text-white">Privacy First</h3>
						<p class="text-gray-200 leading-relaxed text-lg">Your conversations stay private. No data collection, no tracking, just helpful AI assistance.</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div> 