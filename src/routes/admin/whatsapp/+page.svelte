<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let sessions = [];
	let stats = {};
	let loading = true;
	let error = null;
	let selectedSession = null;
	let showCreateModal = false;
	let createForm = {
		phoneNumber: '',
		language: 'en',
		toolId: null
	};

	onMount(() => {
		fetchSessions();
	});

	async function fetchSessions() {
		loading = true;
		error = null;
		try {
			const response = await fetch('/.netlify/functions/whatsapp-sessions');
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			const data = await response.json();
			sessions = data.sessions || [];
			stats = data.stats || {};
		} catch (err) {
			console.error('Error fetching sessions:', err);
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function deleteSession(sessionId) {
		if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
			return;
		}

		try {
			const response = await fetch(`/.netlify/functions/whatsapp-sessions?id=${encodeURIComponent(sessionId)}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			// Refresh the list
			await fetchSessions();
		} catch (err) {
			console.error('Error deleting session:', err);
			alert('Error deleting session: ' + err.message);
		}
	}

	async function createTestSession() {
		if (!createForm.phoneNumber) {
			alert('Please enter a phone number');
			return;
		}

		try {
			const response = await fetch('/.netlify/functions/whatsapp-sessions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(createForm)
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			// Reset form and close modal
			createForm = { phoneNumber: '', language: 'en', toolId: null };
			showCreateModal = false;

			// Refresh the list
			await fetchSessions();
		} catch (err) {
			console.error('Error creating test session:', err);
			alert('Error creating test session: ' + err.message);
		}
	}

	function formatPhoneNumber(phoneNumber) {
		return phoneNumber.replace('whatsapp:', '');
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleString();
	}

	function formatCurrency(amount) {
		return '$' + amount.toFixed(4);
	}

	function getStatusBadge(session) {
		if (session.isExpired) {
			return { class: 'bg-gray-100 text-gray-800', text: 'Expired' };
		}
		return { class: 'bg-green-100 text-green-800', text: 'Active' };
	}
</script>

<svelte:head>
	<title>WhatsApp Sessions - Admin Panel</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">WhatsApp Sessions</h1>
					<p class="text-gray-600 mt-1">Manage active WhatsApp conversations and sessions</p>
				</div>
				<div class="flex gap-3">
					<button
						class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
						on:click={fetchSessions}
						disabled={loading}
					>
						{loading ? 'Refreshing...' : 'Refresh'}
					</button>
					<button
						class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
						on:click={() => showCreateModal = true}
					>
						Create Test Session
					</button>
				</div>
			</div>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-600">Total Sessions</p>
						<p class="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
					</div>
				</div>
			</div>
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-600">Active Sessions</p>
						<p class="text-2xl font-bold text-green-600">{stats.active || 0}</p>
					</div>
				</div>
			</div>
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-600">Total Messages</p>
						<p class="text-2xl font-bold text-blue-600">{stats.totalMessages || 0}</p>
					</div>
				</div>
			</div>
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center">
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-600">Total Cost</p>
						<p class="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalCost || 0)}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Error State -->
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
				<div class="flex items-center">
					<div class="text-red-600 mr-3">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
						</svg>
					</div>
					<div>
						<h3 class="text-sm font-medium text-red-800">Error loading sessions</h3>
						<p class="text-sm text-red-700 mt-1">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Sessions Table -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900">Active Sessions</h3>
			</div>

			{#if loading}
				<div class="p-8 text-center">
					<div class="inline-flex items-center">
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
						</svg>
						Loading sessions...
					</div>
				</div>
			{:else if sessions.length === 0}
				<div class="p-8 text-center text-gray-500">
					<p>No WhatsApp sessions found.</p>
					<button
						class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
						on:click={() => showCreateModal = true}
					>
						Create Test Session
					</button>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each sessions as session (session.sessionId)}
								{@const status = getStatusBadge(session)}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-gray-900">
											{formatPhoneNumber(session.phoneNumber)}
										</div>
										{#if session.currentTool}
											<div class="text-sm text-gray-500">Tool: {session.currentTool}</div>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {status.class}">
											{status.text}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{session.metadata.messageCount || 0}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{session.duration}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatCurrency(session.usage.cost || 0)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{formatDate(session.metadata.lastActivity)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
										<div class="flex gap-2">
											<button
												class="text-blue-600 hover:text-blue-900"
												on:click={() => selectedSession = session}
											>
												View
											</button>
											<button
												class="text-red-600 hover:text-red-900"
												on:click={() => deleteSession(session.sessionId)}
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Create Test Session Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Create Test Session</h3>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
						<input
							type="tel"
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="+1234567890"
							bind:value={createForm.phoneNumber}
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Language</label>
						<select
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							bind:value={createForm.language}
						>
							<option value="en">English</option>
							<option value="es">Spanish</option>
							<option value="fr">French</option>
						</select>
					</div>
				</div>
				<div class="flex justify-end gap-3 mt-6">
					<button
						class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
						on:click={() => showCreateModal = false}
					>
						Cancel
					</button>
					<button
						class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
						on:click={createTestSession}
					>
						Create Session
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Session Detail Modal -->
{#if selectedSession}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
			<div class="flex justify-between items-center mb-4">
				<h3 class="text-lg font-medium text-gray-900">Session Details</h3>
				<button
					class="text-gray-400 hover:text-gray-600"
					on:click={() => selectedSession = null}
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>
			
			<div class="grid grid-cols-2 gap-4 mb-6">
				<div>
					<label class="block text-sm font-medium text-gray-700">Phone Number</label>
					<p class="text-sm text-gray-900">{formatPhoneNumber(selectedSession.phoneNumber)}</p>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700">Session ID</label>
					<p class="text-sm text-gray-900 font-mono">{selectedSession.sessionId}</p>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700">Language</label>
					<p class="text-sm text-gray-900">{selectedSession.language || 'en'}</p>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700">Current Tool</label>
					<p class="text-sm text-gray-900">{selectedSession.currentTool || 'None'}</p>
				</div>
			</div>

			<div class="mb-6">
				<h4 class="text-sm font-medium text-gray-700 mb-2">Conversation History</h4>
				<div class="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
					{#if selectedSession.conversationHistory && selectedSession.conversationHistory.length > 0}
						{#each selectedSession.conversationHistory as message}
							<div class="mb-3 p-3 rounded {message.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-white mr-8'}">
								<div class="text-xs text-gray-500 mb-1">
									{message.role} • {formatDate(message.timestamp)}
								</div>
								<div class="text-sm text-gray-900">{message.content}</div>
							</div>
						{/each}
					{:else}
						<p class="text-sm text-gray-500">No conversation history</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}