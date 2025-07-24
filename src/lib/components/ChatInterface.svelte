<script>
	import { onMount } from 'svelte';
	import { sendChatMessage, parseStreamingResponse } from '$lib/utils/openai.js';
	import { handleRecallQuery, formatRecallResponse, isRecalling } from '$lib/stores/chat.js';
	import VoiceControls from './VoiceControls.svelte';
	export let tool;

	let messages = [];
	let currentMessage = '';
	let isLoading = false;
	let chatContainer;
	let streamingMessage = '';
	let isStreaming = false;
	let voiceControls;

	// Voice settings
	let voiceEnabled = false;
	let autoSpeak = false;
	let interimTranscript = '';

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

		// Issue 1.1.3: Check for recall query before sending to OpenAI
		const recallResult = await handleRecallQuery(currentMessage);
		if (recallResult) {
			// Add user message
			const userMessage = {
				id: Date.now(),
				content: currentMessage,
				role: 'user',
				timestamp: new Date()
			};
			messages = [...messages, userMessage];
			
			// Add recall response
			const recallResponse = formatRecallResponse(recallResult.summaries, recallResult.error);
			const assistantMessage = {
				id: Date.now() + 1,
				content: recallResponse,
				role: 'assistant',
				timestamp: new Date(),
				isRecall: true
			};
			messages = [...messages, assistantMessage];
			
			currentMessage = '';
			
			// Scroll to bottom
			setTimeout(() => {
				if (chatContainer) {
					chatContainer.scrollTop = chatContainer.scrollHeight;
				}
			}, 100);
			
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

			// Auto-speak the response if enabled
			if (autoSpeak && voiceControls && streamingMessage) {
				voiceControls.speak(streamingMessage);
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

	// Voice event handlers
	function handleTranscript(event) {
		const { text, isFinal } = event.detail;
		
		if (isFinal) {
			// Add the final transcript to the current message
			currentMessage = (currentMessage + ' ' + text).trim();
			interimTranscript = '';
		} else {
			// Show interim results
			interimTranscript = text;
		}
	}

	function handleVoiceError(event) {
		console.error('Voice error:', event.detail.error);
		// You could show a toast notification here
	}

	function handleAutoSend() {
		// Auto-send the message when voice input completes
		if (currentMessage.trim()) {
			sendMessage();
		}
	}

	function toggleVoice() {
		voiceEnabled = !voiceEnabled;
	}

	function toggleAutoSpeak() {
		autoSpeak = !autoSpeak;
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
		<div class="flex items-center space-x-3">
			<!-- Voice Controls -->
			{#if voiceEnabled}
				<VoiceControls 
					bind:this={voiceControls}
					{autoSpeak}
					on:transcript={handleTranscript}
					on:error={handleVoiceError}
					on:autoSend={handleAutoSend}
				/>
			{/if}
			
			<!-- Voice Toggle -->
			<button
				on:click={toggleVoice}
				class="flex items-center space-x-1 px-3 py-1 rounded-md text-sm {
					voiceEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
				} hover:bg-opacity-80"
				title="Toggle voice features"
			>
				<span class="text-xs">🎤</span>
				<span>{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
			</button>

			<!-- Auto-speak Toggle -->
			{#if voiceEnabled}
				<button
					on:click={toggleAutoSpeak}
					class="flex items-center space-x-1 px-3 py-1 rounded-md text-sm {
						autoSpeak ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
					} hover:bg-opacity-80"
					title="Auto-speak AI responses"
				>
					<span class="text-xs">🔊</span>
					<span>{autoSpeak ? 'Auto-speak' : 'Manual'}</span>
				</button>
			{/if}

			{#if !apiKey}
				<button on:click={updateApiKey} class="btn-secondary text-xs">
					Set API Key
				</button>
			{/if}
		</div>
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
						: message.isRecall 
							? 'bg-blue-50 text-blue-900 border border-blue-200'
							: 'bg-white text-gray-900 shadow-sm border'
				}">
					{#if message.isRecall}
						<div class="flex items-center mb-2">
							<span class="text-xs">🔍</span>
							<span class="text-xs font-medium ml-1">Conversation Recall</span>
						</div>
					{/if}
					<p class="text-sm whitespace-pre-wrap">{message.content}</p>
					<div class="flex items-center justify-between mt-1">
						<p class="text-xs {message.role === 'user' ? 'text-primary-100' : message.isRecall ? 'text-blue-600' : 'text-gray-500'}">
							{message.timestamp.toLocaleTimeString()}
						</p>
						{#if message.role === 'assistant' && message.content && voiceEnabled}
							<button
								on:click={() => voiceControls?.speak(message.content)}
								class="text-xs {message.role === 'user' ? 'text-primary-200 hover:text-primary-100' : 'text-gray-400 hover:text-gray-600'}"
								title="Speak this message"
							>
								🔊
							</button>
						{/if}
					</div>
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

		{#if $isRecalling}
			<div class="flex justify-start">
				<div class="bg-blue-50 text-blue-900 border border-blue-200 rounded-lg px-4 py-2">
					<div class="flex items-center space-x-2">
						<div class="flex space-x-1">
							<div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
							<div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
							<div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
						</div>
						<span class="text-sm">🔍 Searching conversation history...</span>
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
		
		<!-- Issue 1.1.3: Hint about recall functionality -->
		<div class="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
			💡 <strong>Tip:</strong> Try saying "recall last chat" or "remember our previous conversation" to see past discussions!
		</div>
		
		<div class="flex space-x-3">
			<div class="flex-1">
				<div class="relative">
					<textarea
						bind:value={currentMessage}
						on:keydown={handleKeydown}
						placeholder={voiceEnabled ? "Type your message or click the microphone to speak... Try 'recall last chat' to see previous conversations!" : "Type your message here... Try 'recall last chat' to see previous conversations!"}
						class="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent {interimTranscript ? 'border-blue-300 bg-blue-50' : ''}"
						rows="2"
						disabled={isLoading || $isRecalling}
					></textarea>
					{#if interimTranscript}
						<div class="absolute inset-x-0 bottom-0 bg-blue-100 border-t border-blue-200 px-3 py-1 text-sm text-blue-700 italic rounded-b-lg">
							🎤 "{interimTranscript}"
						</div>
					{/if}
				</div>
			</div>
			<button
				on:click={sendMessage}
				disabled={!currentMessage.trim() || isLoading || !apiKey || $isRecalling}
				class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? 'Sending...' : $isRecalling ? 'Recalling...' : 'Send'}
			</button>
		</div>
		<div class="mt-2 flex items-center justify-between text-xs text-gray-500">
			<span>Press Enter to send, Shift+Enter for new line</span>
			<span>Model: {tool.model} {isStreaming ? '(streaming...)' : ''}</span>
		</div>
	</div>
</div> 