<script>
	import { onMount } from 'svelte';
	import { sendChatMessage, parseStreamingResponse } from '$lib/utils/openai.js';
	export let tool;

	let messages = [];
	let currentMessage = '';
	let isLoading = false;
	let chatContainer;
	let streamingMessage = '';
	let isStreaming = false;

	// Get API key from environment or prompt user
	let apiKey = '';
	
	onMount(() => {
		// Check if API key is available
		apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
		
		// Add welcome message
		messages = [{
			id: 0,
			content: `Hello! I'm your ${tool.name}. ${tool.description} How can I help you today?`,
			role: 'assistant',
			timestamp: new Date()
		}];
	});

	// Real AI response using OpenAI API
	async function sendMessage() {
		if (!currentMessage.trim() || isLoading) return;
		
		if (!apiKey) {
			alert('Please set your OpenAI API key in the environment variables or enter it below.');
			return;
		}

		// Add user message
		const userMessage = {
			id: Date.now(),
			content: currentMessage,
			role: 'user',
			timestamp: new Date()
		};
		messages = [...messages, userMessage];
		
		const messageToSend = currentMessage;
		currentMessage = '';
		isLoading = true;
		isStreaming = true;
		streamingMessage = '';

		// Scroll to bottom
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 100);

		try {
			// Send to OpenAI API
			const response = await sendChatMessage(messages, tool, apiKey);
			
			// Create a placeholder message for streaming
			const aiMessageId = Date.now() + 1;
			const aiMessage = {
				id: aiMessageId,
				content: '',
				role: 'assistant',
				timestamp: new Date()
			};
			messages = [...messages, aiMessage];

			// Stream the response
			for await (const chunk of parseStreamingResponse(response)) {
				streamingMessage += chunk;
				
				// Update the last message with streaming content
				messages = messages.map(msg => 
					msg.id === aiMessageId 
						? { ...msg, content: streamingMessage }
						: msg
				);

				// Scroll to bottom
				setTimeout(() => {
					if (chatContainer) {
						chatContainer.scrollTop = chatContainer.scrollHeight;
					}
				}, 10);
			}

		} catch (error) {
			console.error('Error sending message:', error);
			
			// Add error message
			const errorMessage = {
				id: Date.now() + 1,
				content: `Sorry, I encountered an error: ${error.message}. Please check your API key and try again.`,
				role: 'assistant',
				timestamp: new Date()
			};
			messages = [...messages, errorMessage];
		} finally {
			isLoading = false;
			isStreaming = false;
			streamingMessage = '';
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function updateApiKey() {
		const newKey = prompt('Enter your OpenAI API key:');
		if (newKey) {
			apiKey = newKey;
		}
	}
</script>

<div class="flex flex-col h-full">
	<!-- Chat Header -->
	<div class="bg-white border-b px-6 py-4 flex items-center justify-between">
		<div class="flex items-center space-x-3">
			<span class="text-2xl">{tool.icon}</span>
			<div>
				<h2 class="text-lg font-semibold text-gray-900">{tool.name}</h2>
				<p class="text-sm text-gray-500">{tool.description}</p>
			</div>
		</div>
		{#if !apiKey}
			<button on:click={updateApiKey} class="btn-secondary text-xs">
				Set API Key
			</button>
		{/if}
	</div>

	<!-- Messages Container -->
	<div 
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
	>
		{#each messages as message}
			<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
				<div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg {
					message.role === 'user' 
						? 'bg-primary-500 text-white' 
						: 'bg-white text-gray-900 shadow-sm border'
				}">
					<p class="text-sm whitespace-pre-wrap">{message.content}</p>
					<p class="text-xs mt-1 {message.role === 'user' ? 'text-primary-100' : 'text-gray-500'}">
						{message.timestamp.toLocaleTimeString()}
					</p>
				</div>
			</div>
		{/each}

		{#if isLoading && !isStreaming}
			<div class="flex justify-start">
				<div class="bg-white text-gray-900 shadow-sm border rounded-lg px-4 py-2">
					<div class="flex space-x-1">
						<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
						<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
						<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Input Area -->
	<div class="bg-white border-t p-4">
		{#if !apiKey}
			<div class="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
				⚠️ OpenAI API key required. Click "Set API Key" above or add VITE_OPENAI_API_KEY to your environment.
			</div>
		{/if}
		
		<div class="flex space-x-3">
			<textarea
				bind:value={currentMessage}
				on:keydown={handleKeydown}
				placeholder="Type your message here..."
				class="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
				rows="1"
				disabled={isLoading}
			></textarea>
			<button
				on:click={sendMessage}
				disabled={!currentMessage.trim() || isLoading || !apiKey}
				class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? 'Sending...' : 'Send'}
			</button>
		</div>
		<div class="mt-2 flex items-center justify-between text-xs text-gray-500">
			<span>Press Enter to send, Shift+Enter for new line</span>
			<span>Model: {tool.model} {isStreaming ? '(streaming...)' : ''}</span>
		</div>
	</div>
</div> 