<script>
	import { isAdmin, adminEmail, login, logout } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	
	let email = '';
	let password = '';
	let loginError = false;

	function handleLogin() {
		if (login(email, password)) {
			loginError = false;
			email = '';
			password = '';
		} else {
			loginError = true;
		}
	}

	function handleLogout() {
		logout();
		goto('/');
	}
</script>

{#if $isAdmin}
	<!-- Admin Interface -->
	<div class="min-h-screen bg-gray-100">
		<nav class="bg-white shadow-sm border-b">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between h-16">
					<div class="flex items-center space-x-4">
						<a href="/" class="text-gray-600 hover:text-gray-900">← Back to Site</a>
						<span class="text-xl font-bold text-gray-900">🛠️ Admin Panel</span>
					</div>
					<div class="flex items-center space-x-4">
						<span class="text-sm text-gray-600">Welcome, {$adminEmail}</span>
						<button on:click={handleLogout} class="btn-secondary">
							Logout
						</button>
					</div>
				</div>
			</div>
		</nav>

		<main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<slot />
		</main>
	</div>
{:else}
	<!-- Login Form -->
	<div class="min-h-screen bg-gray-100 flex items-center justify-center">
		<div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
			<h2 class="text-2xl font-bold text-center text-gray-900 mb-6">
				🔐 Admin Login
			</h2>
			
			<form on:submit|preventDefault={handleLogin} class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">
						Email
					</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						placeholder="your.email@example.com"
						required
					/>
				</div>
				
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						Password
					</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						placeholder="Enter password"
						required
					/>
				</div>
				
				{#if loginError}
					<div class="text-red-600 text-sm">
						Invalid email or password. Make sure your email is authorized.
					</div>
				{/if}
				
				<button type="submit" class="w-full btn-primary">
					Login
				</button>
			</form>
			
			<div class="mt-4 text-center">
				<a href="/" class="text-sm text-gray-600 hover:text-gray-900">
					← Back to homepage
				</a>
			</div>
		</div>
	</div>
{/if} 