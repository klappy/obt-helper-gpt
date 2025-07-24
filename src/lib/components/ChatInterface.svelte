<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { messages, isRecalling } from '$lib/stores/chat.js';
	import VoiceControls from './VoiceControls.svelte';

	export let tool;

	let currentMessage = '';
	let isLoading = false;
	let messagesContainer: HTMLElement;
	let apiKey = '';
	let voiceEnabled = false;
	let interimTranscript = '';

	// WhatsApp linking variables
	let showLinkingForm = false;
	let phoneNumber = '';
	let verificationCode = '';
	let linkingStep = 'phone'; // 'phone', 'code', 'linked'
	let linkingStatus = '';
	let currentSessionId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	let linkedWhatsAppSession = null;

	// Voice controls
	let voiceControls;
	let autoSpeak = false;

	// Issue 3.1.1: Media upload variables
	let showMediaUpload = false;
	let uploadedFiles: Array<{id: number, name: string, type: string, size: number, data: string, placeholder: boolean}> = [];

	onMount(() => {
		// No need for client-side API key - using serverless functions
		
		// Add welcome message
		messages.update(msgs => [...msgs, {
			id: 0,
			content: `Hello! I'm your ${tool.name}. ${tool.description} How can I help you today?`,
			role: 'assistant',
			timestamp: new Date()
		}]);
		
		// Start polling for synced messages if session is linked
		startSyncPolling();
		
		// Issue 3.1.2: Sync chat sessions with service worker for offline access
		function saveChatSession() {
			if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
				navigator.serviceWorker.controller.postMessage({
					type: "SAVE_CHAT_SESSION",
					payload: {
						sessionId: currentSessionId,
						messages: $messages,
					},
				});
			}
		}
		
		// Save on message changes
		const unsubscribe = messages.subscribe(saveChatSession);
		
		// Check online status and show indicators
		let isOnline = navigator.onLine;
		
		function updateOnlineStatus() {
			isOnline = navigator.onLine;
			if (isOnline) {
				// Sync offline messages when back online
				syncOfflineMessages();
			}
		}
		
		function syncOfflineMessages() {
			// TODO: Implement sync logic when back online
			console.log("🔄 Syncing offline messages...");
		}
		
		window.addEventListener("online", updateOnlineStatus);
		window.addEventListener("offline", updateOnlineStatus);
		
		return () => {
			unsubscribe();
			window.removeEventListener("online", updateOnlineStatus);
			window.removeEventListener("offline", updateOnlineStatus);
		};
	});
	
	// Issue 2.1.3: Poll for messages synced from WhatsApp
	let syncInterval;
	
	function startSyncPolling() {
		// Poll every 5 seconds for synced messages
		syncInterval = setInterval(async () => {
			if (linkedWhatsAppSession) {
				try {
					const response = await fetch(`/.netlify/functions/get-synced-messages?sessionId=${currentSessionId}`);
					if (response.ok) {
						const syncData = await response.json();
						if (syncData.messages.length > 0) {
							console.log(`Received ${syncData.messages.length} synced messages from WhatsApp`);
							
							// Add synced messages to chat
							syncData.messages.forEach(msg => {
								// Add user message from WhatsApp
								const userMessage = {
									id: Date.now() + Math.random(),
									content: `📱 ${msg.userMessage}`,
									role: 'user',
									timestamp: new Date(msg.timestamp),
									source: 'whatsapp'
								};
								
								// Add AI response
								const aiMessage = {
									id: Date.now() + Math.random() + 1,
									content: msg.aiResponse,
									role: 'assistant',
									timestamp: new Date(msg.timestamp + 1000),
									source: 'whatsapp'
								};
								
								messages.update(msgs => [...msgs, userMessage, aiMessage]);
							});
							
							// Scroll to bottom
							setTimeout(() => {
								if (messagesContainer) {
									messagesContainer.scrollTop = messagesContainer.scrollHeight;
								}
							}, 100);
						}
					}
				} catch (error) {
					console.error('Error polling for synced messages:', error);
				}
			}
		}, 5000); // Poll every 5 seconds
	}
	
	// Stop polling when component is destroyed
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (syncInterval) {
			clearInterval(syncInterval);
		}
	});

	// WhatsApp linking functions
	async function sendLinkingCode() {
		try {
			linkingStatus = 'Sending code...';
			const response = await fetch('/.netlify/functions/send-link-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					phoneNumber,
					sessionId: currentSessionId,
					toolId: tool.id
				})
			});
			
			const data = await response.json();
			
			if (response.ok && data.success) {
				linkingStep = 'code';
				linkingStatus = '✅ Code sent! Check your WhatsApp.';
			} else {
				linkingStatus = `❌ ${data.error || 'Failed to send code. Try again.'}`;
			}
		} catch (error) {
			console.error('Send code error:', error);
			linkingStatus = '❌ Error sending code. Please try again.';
		}
	}
	
	async function verifyLinkingCode() {
		try {
			linkingStatus = 'Verifying code...';
			const response = await fetch('/.netlify/functions/verify-link-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					phoneNumber,
					code: verificationCode,
					sessionId: currentSessionId
				})
			});
			
			const data = await response.json();
			
			if (response.ok && data.success) {
				linkingStep = 'linked';
				linkingStatus = '🎉 Sessions linked! Messages will sync with WhatsApp.';
				linkedWhatsAppSession = data.linkedSessionId;
				showLinkingForm = false;
				
				// Add system message to chat
				const linkMessage = {
					id: Date.now(),
					content: `🔗 **WhatsApp Linked!** Your conversation is now synced with ${data.phoneNumber}. Messages sent here will appear in WhatsApp and vice versa.`,
					role: 'system',
					timestamp: new Date()
				};
				messages.update(msgs => [...msgs, linkMessage]);
				
				// Reset form
				phoneNumber = '';
				verificationCode = '';
				setTimeout(() => {
					linkingStatus = '';
				}, 3000);
			} else {
				linkingStatus = `❌ ${data.error || 'Invalid code. Try again.'}`;
			}
		} catch (error) {
			console.error('Verify code error:', error);
			linkingStatus = '❌ Verification failed. Please try again.';
		}
	}

	function resetLinkingForm() {
		showLinkingForm = false;
		linkingStep = 'phone';
		phoneNumber = '';
		verificationCode = '';
		linkingStatus = '';
	}

	// Real AI response using serverless function
	async function sendMessage() {
		if (!currentMessage.trim() || isLoading) return;

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
			messages.update(msgs => [...msgs, userMessage]);
			
			// Add recall response
			const recallResponse = formatRecallResponse(recallResult.summaries, recallResult.error);
			const assistantMessage = {
				id: Date.now() + 1,
				content: recallResponse,
				role: 'assistant',
				timestamp: new Date(),
				isRecall: true
			};
			messages.update(msgs => [...msgs, assistantMessage]);
			
			currentMessage = '';
			
			// Scroll to bottom
			setTimeout(() => {
				if (messagesContainer) {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
		messages.update(msgs => [...msgs, userMessage]);
		
		const messageToSend = currentMessage;
		currentMessage = '';
		isLoading = true;

		// Scroll to bottom
		setTimeout(() => {
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}
		}, 100);

		try {
			// Use chat function for bidirectional mirroring
			const response = await fetch('/.netlify/functions/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages,
					tool,
					sessionId: currentSessionId
					// No API key needed - server has it
				})
			});
			
			// Parse the response (non-streaming)
			const data = await response.json();
			const aiContent = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
			
			// Add AI response message
			const aiMessage = {
				id: Date.now() + 1,
				content: aiContent,
				role: 'assistant',
				timestamp: new Date()
			};
			messages.update(msgs => [...msgs, aiMessage]);

			// Auto-speak the response if enabled
			if (autoSpeak && voiceControls && aiContent) {
				voiceControls.speak(aiContent);
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
			messages.update(msgs => [...msgs, errorMessage]);
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	// No longer needed - using serverless functions

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

	// Issue 3.1.1: Handle file upload for multimodal stubs
	function handleFileUpload(event) {
		const files = Array.from(event.target.files);
		
		files.forEach(file => {
			if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
				const reader = new FileReader();
				reader.onload = (e) => {
					uploadedFiles = [...uploadedFiles, {
						id: Date.now() + Math.random(),
						name: file.name,
						type: file.type,
						size: file.size,
						data: e.target.result,
						placeholder: true // Mark as stub
					}];
				};
				reader.readAsDataURL(file);
			}
		});
		
		// Clear the input for future uploads
		event.target.value = '';
	}

	// Issue 3.1.1: Remove uploaded file
	function removeUploadedFile(fileId) {
		uploadedFiles = uploadedFiles.filter(file => file.id !== fileId);
	}

	// Issue 3.1.1: Send message with media (stub implementation)
	async function sendMessageWithMedia() {
		if (uploadedFiles.length > 0) {
			// Add user message showing uploaded files
			const fileList = uploadedFiles.map(f => `• ${f.name} (${f.type})`).join('\n');
			const userMessage = {
				role: 'user',
				content: currentMessage.trim() || '[Media files attached]',
				files: uploadedFiles,
				timestamp: new Date()
			};
			
			messages.update(msgs => [...msgs, userMessage]);
			
			// Stub: Show placeholder response for multimodal
			const stubResponse = {
				role: 'assistant',
				content: `🚧 **Multimodal feature coming soon!**\n\nI can see you uploaded:\n${fileList}\n\nThis will work with future vision/audio models like:\n• **GPT-4 Vision** for image analysis\n• **Whisper** for audio transcription\n• **DALL-E** for image generation\n\nFor now, please describe what you'd like me to help you with regarding these files!`,
				isStub: true,
				timestamp: new Date()
			};
			
			// Add response after a brief delay
			setTimeout(() => {
				messages.update(msgs => [...msgs, stubResponse]);
			}, 500);
			
			// Clear input and files
			currentMessage = '';
			uploadedFiles = [];
			showMediaUpload = false;
			return;
		}
		
		// Continue with normal text flow
		await sendMessage();
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
			<!-- WhatsApp Link Button -->
			<button 
				on:click={() => showLinkingForm = true}
				class="flex items-center space-x-1 px-3 py-1 rounded-md text-sm {
					linkedWhatsAppSession ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
				} hover:bg-opacity-80"
				title="Link with WhatsApp"
			>
				<span class="text-xs">📱</span>
				<span>{linkedWhatsAppSession ? 'WhatsApp Linked' : 'Link WhatsApp'}</span>
			</button>

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

			<!-- API key no longer needed - using serverless functions -->
		</div>
	</div>

	<!-- Messages Container -->
	<div 
		bind:this={messagesContainer}
		class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
	>
		{#each messages as message}
			<div class="flex {message.role === 'user' ? 'justify-end' : message.role === 'system' ? 'justify-center' : 'justify-start'}">
				<div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg {
					message.role === 'user' 
						? 'bg-primary-500 text-white' 
						: message.role === 'system'
							? 'bg-yellow-50 text-yellow-800 border border-yellow-200 text-center'
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

		{#if isLoading}
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
		<!-- No API key warning needed - using serverless functions -->
		
		<!-- Issue 1.1.3: Hint about recall functionality -->
		<div class="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
			💡 <strong>Tip:</strong> Try saying "recall last chat" or "remember our previous conversation" to see past discussions!
		</div>
		
		<!-- Issue 3.1.1: Media upload panel -->
		{#if showMediaUpload}
			<div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
				<div class="flex items-center justify-between mb-3">
					<h4 class="font-medium text-yellow-800">📎 Upload Media (Preview)</h4>
					<button 
						on:click={() => showMediaUpload = false}
						class="text-yellow-600 hover:text-yellow-800"
					>
						✕
					</button>
				</div>
				<p class="text-sm text-yellow-700 mb-3">
					Upload images or audio files. This is a preview - full multimodal support coming in future releases.
				</p>
				
				<input 
					type="file"
					accept="image/*,audio/*"
					multiple
					on:change={handleFileUpload}
					class="mb-3 text-sm"
				/>
				
				{#if uploadedFiles.length > 0}
					<div class="space-y-2">
						<h5 class="text-sm font-medium text-yellow-800">Ready to send:</h5>
						{#each uploadedFiles as file}
							<div class="flex items-center justify-between p-2 bg-white rounded border border-yellow-200">
								<span class="text-sm flex items-center gap-2">
									<span class="text-lg">
										{file.type.startsWith('image/') ? '🖼️' : '🎵'}
									</span>
									<span>{file.name}</span>
									<span class="text-xs text-gray-500">({(file.size / 1024).toFixed(1)}KB)</span>
								</span>
								<button 
									on:click={() => removeUploadedFile(file.id)}
									class="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded"
								>
									Remove
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
		
		<div class="flex space-x-3">
			<!-- Issue 3.1.1: Media upload button -->
			<button 
				on:click={() => showMediaUpload = !showMediaUpload}
				class="btn-secondary text-sm whitespace-nowrap"
				title="Upload image or audio (coming soon)"
			>
				📎 Media
			</button>
			
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
				on:click={sendMessageWithMedia}
				disabled={(!currentMessage.trim() && uploadedFiles.length === 0) || isLoading || $isRecalling}
				class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? 'Sending...' : $isRecalling ? 'Recalling...' : 'Send'}
			</button>
		</div>
		<div class="mt-2 flex items-center justify-between text-xs text-gray-500">
			<span>Press Enter to send, Shift+Enter for new line{uploadedFiles.length > 0 ? ` • ${uploadedFiles.length} file(s) ready` : ''}</span>
			<span>Model: {tool.model}</span>
		</div>
	</div>
</div>

<!-- WhatsApp Linking Modal -->
{#if showLinkingForm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg max-w-md w-full mx-4 p-6">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-gray-900">Link WhatsApp Session</h3>
				<button 
					on:click={resetLinkingForm}
					class="text-gray-400 hover:text-gray-600 text-xl"
				>
					×
				</button>
			</div>
			
			{#if linkingStep === 'phone'}
				<div class="space-y-4">
					<p class="text-sm text-gray-600">
						Enter your WhatsApp number to sync this conversation. You'll receive a verification code via WhatsApp.
					</p>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							WhatsApp Phone Number
						</label>
						<!-- DEBUG: Show current variable state -->
						<div class="text-xs text-red-600 mb-2">
							DEBUG: phoneNumber = "{phoneNumber}" (type: {typeof phoneNumber}) (length: {phoneNumber ? phoneNumber.length : 'undefined'})
						</div>
						<input 
							type="tel"
							bind:value={phoneNumber}
							on:input={(e) => {
								console.log('Phone input changed:', e.target.value);
								console.log('phoneNumber variable:', phoneNumber);
							}}
							placeholder="+1234567890"
							class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						<p class="text-xs text-gray-500 mt-1">
							Include country code (e.g., +1 for US, +44 for UK)
						</p>
					</div>
					<div class="flex gap-3">
						<!-- DEBUG: Show button state -->
						<div class="text-xs text-red-600 mb-2">
							DEBUG: Button disabled = {!phoneNumber?.trim() || linkingStatus.includes('Sending')} (phoneNumber.trim() = "{phoneNumber?.trim()}")
						</div>
						<button 
							on:click={(e) => {
								console.log('=== MODAL BUTTON CLICKED ===');
								console.log('Event:', e);
								console.log('phoneNumber at button click:', phoneNumber);
								console.log('phoneNumber type:', typeof phoneNumber);
								console.log('phoneNumber length:', phoneNumber ? phoneNumber.length : 'no length');
								e.preventDefault();
								e.stopPropagation();
								sendLinkingCode();
							}}
							disabled={!phoneNumber?.trim() || linkingStatus.includes('Sending')}
							class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{linkingStatus.includes('Sending') ? 'Sending...' : 'Send Code'}
						</button>
						<button 
							on:click={resetLinkingForm}
							class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
						>
							Cancel
						</button>
					</div>
				</div>
			{/if}
			
			{#if linkingStep === 'code'}
				<div class="space-y-4">
					<p class="text-sm text-gray-600">
						Enter the 6-digit verification code sent to your WhatsApp.
					</p>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Verification Code
						</label>
						<input 
							type="text"
							bind:value={verificationCode}
							placeholder="123456"
							maxlength="6"
							class="w-full p-3 border border-gray-300 rounded-lg text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div class="flex gap-3">
						<button 
							on:click={verifyLinkingCode}
							disabled={verificationCode.length !== 6 || linkingStatus.includes('Verifying')}
							class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{linkingStatus.includes('Verifying') ? 'Verifying...' : 'Verify Code'}
						</button>
						<button 
							on:click={() => linkingStep = 'phone'}
							class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
						>
							Back
						</button>
					</div>
				</div>
			{/if}
			
			{#if linkingStatus}
				<div class="mt-4 p-3 rounded-lg {
					linkingStatus.includes('❌') || linkingStatus.includes('Failed') || linkingStatus.includes('Error') 
						? 'bg-red-50 text-red-700 border border-red-200' 
						: linkingStatus.includes('✅') || linkingStatus.includes('🎉')
							? 'bg-green-50 text-green-700 border border-green-200'
							: 'bg-blue-50 text-blue-700 border border-blue-200'
				}">
					<p class="text-sm">{linkingStatus}</p>
				</div>
			{/if}
		</div>
	</div>
{/if} 