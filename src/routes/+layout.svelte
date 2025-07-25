<script>
	import '../app.css';
</script>

<!-- 2025 Global Layout with glassmorphic design -->
<div class="min-h-screen relative overflow-hidden">
	<!-- Multi-layer animated background -->
	<div class="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 -z-10"></div>
	<div class="fixed inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-blue-900/20 animate-pulse -z-10"></div>
	<div class="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.2),transparent_50%)] -z-10"></div>
	<div class="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.1),transparent_50%)] -z-10"></div>
	
	<!-- Modern Navigation -->
	<nav class="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-20">
				<div class="flex items-center">
					<a href="/" class="flex items-center space-x-3 group">
						<span class="text-4xl group-hover:scale-110 transition-transform duration-300">🤖</span>
						<span class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">OBT Helper</span>
					</a>
				</div>
				<div class="flex items-center space-x-6">
					<a href="/admin" class="px-4 py-2 text-gray-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 font-medium border border-white/20">
						⚙️ Admin
					</a>
					<a href="/demo" class="px-4 py-2 text-gray-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 font-medium border border-white/20">
						📱 WhatsApp Demo
					</a>
				</div>
			</div>
		</div>
	</nav>

	<main class="relative z-10">
		<slot />
	</main>

	<!-- Modern Footer -->
	<footer class="relative z-10 bg-white/5 backdrop-blur-xl border-t border-white/10 mt-20">
		<div class="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
			<div class="text-center text-gray-300">
				<p class="text-lg">&copy; 2025 OBT Helper. Built with SvelteKit and powered by AI.</p>
				<p class="text-sm mt-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full inline-block border border-white/20">
					✨ Version 1.1.0 - 2025 Edition
				</p>
				<div class="mt-6 flex justify-center space-x-6">
					<span class="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-400/30">
						🚀 Always Free
					</span>
					<span class="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-400/30">
						🔒 Privacy First
					</span>
					<span class="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-400/30">
						⚡ Lightning Fast
					</span>
				</div>
			</div>
		</div>
	</footer>
</div> 