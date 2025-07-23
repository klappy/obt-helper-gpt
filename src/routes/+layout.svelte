<script>
	import '../app.css';
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
	<nav class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<a href="/" class="flex items-center space-x-2">
						<span class="text-2xl">🤖</span>
						<span class="text-xl font-bold text-gray-900">OBT Helper</span>
					</a>
				</div>
				<div class="flex items-center space-x-4">
					<a href="/admin" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
						Admin
					</a>
					<a href="/demo" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
						WhatsApp Demo
					</a>
				</div>
			</div>
		</div>
	</nav>

	<main>
		<slot />
	</main>

	<footer class="bg-white border-t mt-20">
		<div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div class="text-center text-gray-500">
				<p>&copy; 2025 OBT Helper. Built with SvelteKit and powered by AI.</p>
				<p class="text-xs mt-2">Version 1.1.0</p>
			</div>
		</div>
	</footer>
</div> 