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

	// Issue 3.2.3: Real-time cost tracking variables
	let sessionCost = 0;
	let totalCost = 0;
	let costVisible = true;
	let costBreakdown = {
		messages: 0,
		tokens: 0,
		avgCostPerMessage: 0
	};
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
			
			// Issue 3.2.3: Update cost tracking with usage data
			if (data.usage) {
				await updateCostDisplay(data.usage);
			}
			
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

	// Issue 3.2.3: Cost tracking functions
	async function updateCostDisplay(usage: any) {
		if (usage && usage.cost) {
			sessionCost += usage.cost;
			costBreakdown.messages += 1;
			costBreakdown.tokens += (usage.promptTokens || 0) + (usage.responseTokens || 0);
			costBreakdown.avgCostPerMessage = sessionCost / costBreakdown.messages;

			// Fetch total cost for this tool today
			try {
				const response = await fetch(`/.netlify/functions/cost-summary?toolId=${tool.id}`);
				const data = await response.json();
				totalCost = data.todayCost || 0;
			} catch (error) {
				console.log('Could not fetch total cost');
			}
		}
	}

	// Format cost for display
	function formatCost(cost: number) {
		if (cost < 0.01) {
			return `$${(cost * 1000).toFixed(2)}m`; // Show in millicents
		}
		return `$${cost.toFixed(4)}`;
	}

	function getCostColor(cost: number) {
		if (cost < 0.01) return 'text-green-600';
		if (cost < 0.05) return 'text-yellow-600';
		return 'text-red-600';
	}

	// Load initial cost data on mount
	onMount(async () => {
		try {
			const response = await fetch(`/.netlify/functions/cost-summary?toolId=${tool.id}`);
			const data = await response.json();
			totalCost = data.todayCost || 0;
		} catch (error) {
			console.log('Could not load initial cost data');
		}
	});
</script>

<!-- 2025 Chat Interface with glassmorphic design -->
<div class="flex flex-col h-full relative overflow-hidden">
	<!-- Animated background -->
	<div class="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900"></div>
	<div class="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-blue-900/20 animate-pulse"></div>
	<div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.2),transparent_50%)]"></div>
	
	<!-- Chat Header -->
	<div class="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20 px-6 py-4 flex items-center justify-between shadow-lg">
		<div class="flex items-center space-x-4">
			<div class="text-4xl filter drop-shadow-lg">{tool.icon}</div>
			<div>
				<h2 class="text-2xl font-bold text-white">{tool.name}</h2>
				<p class="text-gray-200">{tool.description}</p>
			</div>
		</div>
		<div class="flex items-center space-x-3">
			<!-- WhatsApp Link Button -->
			<button 
				on:click={() => showLinkingForm = true}
				class="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm backdrop-blur-sm transition-all duration-300 {
					linkedWhatsAppSession 
						? 'bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30' 
						: 'bg-white/10 text-gray-200 border border-white/20 hover:bg-white/20'
				}"
				title="Link with WhatsApp"
			>
				<span class="text-lg">📱</span>
				<span class="font-medium">{linkedWhatsAppSession ? 'WhatsApp Linked' : 'Link WhatsApp'}</span>
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
				class="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm backdrop-blur-sm transition-all duration-300 {
					voiceEnabled 
						? 'bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30' 
						: 'bg-white/10 text-gray-200 border border-white/20 hover:bg-white/20'
				}"
				title="Toggle voice features"
			>
				<span class="text-lg">🎤</span>
				<span class="font-medium">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
			</button>

			<!-- Auto-speak Toggle -->
			{#if voiceEnabled}
				<button
					on:click={toggleAutoSpeak}
					class="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm backdrop-blur-sm transition-all duration-300 {
						autoSpeak 
							? 'bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30' 
							: 'bg-white/10 text-gray-200 border border-white/20 hover:bg-white/20'
					}"
					title="Auto-speak AI responses"
				>
					<span class="text-lg">🔊</span>
					<span class="font-medium">{autoSpeak ? 'Auto-speak' : 'Manual'}</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Messages Container -->
	<div 
		bind:this={messagesContainer}
		class="relative z-10 flex-1 overflow-y-auto p-6 space-y-6"
	>
		{#each $messages || [] as message}
			<div class="flex {message.role === 'user' ? 'justify-end' : message.role === 'system' ? 'justify-center' : 'justify-start'}">
				<div class="max-w-xs lg:max-w-2xl group">
					<!-- Message bubble with glassmorphic design -->
					<div class="relative">
						<!-- Glow effect -->
						{#if message.role === 'user'}
							<div class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
						{:else if message.role === 'assistant'}
							<div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
						{/if}
						
						<div class="relative px-6 py-4 rounded-2xl backdrop-blur-xl transition-all duration-300 shadow-lg {
							message.role === 'user' 
								? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-400/30' 
								: message.role === 'system'
									? 'bg-yellow-500/10 text-yellow-200 border border-yellow-400/30 text-center'
								: message.isRecall 
									? 'bg-blue-500/10 text-blue-200 border border-blue-400/30'
									: 'bg-white/10 text-gray-100 border border-white/20'
						}">
							{#if message.isRecall}
								<div class="flex items-center mb-3">
									<span class="text-sm">🔍</span>
									<span class="text-sm font-medium ml-2 text-blue-300">Conversation Recall</span>
								</div>
							{/if}
							<p class="whitespace-pre-wrap leading-relaxed">{message.content}</p>
							<div class="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
								<p class="text-xs {message.role === 'user' ? 'text-purple-200' : message.isRecall ? 'text-blue-300' : 'text-gray-300'}">
									{message.timestamp.toLocaleTimeString()}
								</p>
								{#if message.role === 'assistant' && message.content && voiceEnabled}
									<button
										on:click={() => voiceControls?.speak(message.content)}
										class="text-sm {message.role === 'user' ? 'text-purple-200 hover:text-purple-100' : 'text-gray-300 hover:text-white'} transition-colors duration-200"
										title="Speak this message"
									>
										🔊
									</button>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/each}

		{#if isLoading}
			<div class="flex justify-start">
				<div class="relative group">
					<div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20"></div>
					<div class="relative bg-white/10 backdrop-blur-xl text-gray-200 border border-white/20 rounded-2xl px-6 py-4">
						<div class="flex space-x-2">
							<div class="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
							<div class="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
							<div class="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if $isRecalling}
			<div class="flex justify-start">
				<div class="relative group">
					<div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
					<div class="relative bg-blue-500/10 backdrop-blur-xl text-blue-200 border border-blue-400/30 rounded-2xl px-6 py-4">
						<div class="flex items-center space-x-3">
							<div class="flex space-x-1">
								<div class="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
								<div class="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
								<div class="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
							</div>
							<span class="text-sm font-medium">🔍 Searching conversation history...</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Input Area -->
	<div class="relative z-10 bg-white/10 backdrop-blur-xl border-t border-white/20 p-6 shadow-lg">
		<!-- Hint about recall functionality -->
		<div class="mb-4 p-4 bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-xl text-blue-200">
			<span class="text-lg mr-2">💡</span>
			<strong>Tip:</strong> Try saying "recall last chat" or "remember our previous conversation" to see past discussions!
		</div>
		
		<!-- Media upload panel -->
		{#if showMediaUpload}
			<div class="mb-6 p-6 bg-yellow-500/10 backdrop-blur-sm border border-yellow-400/30 rounded-xl">
				<div class="flex items-center justify-between mb-4">
					<h4 class="font-semibold text-yellow-200 text-lg">📎 Upload Media (Preview)</h4>
					<button 
						on:click={() => showMediaUpload = false}
						class="text-yellow-300 hover:text-yellow-100 text-xl transition-colors"
					>
						✕
					</button>
				</div>
				<p class="text-yellow-200 mb-4">
					Upload images or audio files. This is a preview - full multimodal support coming in future releases.
				</p>
				
				<input 
					type="file"
					accept="image/*,audio/*"
					multiple
					on:change={handleFileUpload}
					class="mb-4 text-yellow-200 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2"
				/>
				
				{#if uploadedFiles.length > 0}
					<div class="space-y-3">
						<h5 class="font-medium text-yellow-200">Ready to send:</h5>
						{#each uploadedFiles || [] as file}
							<div class="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
								<span class="text-gray-200 flex items-center gap-3">
									<span class="text-2xl">
										{file.type.startsWith('image/') ? '🖼️' : '🎵'}
									</span>
									<span class="font-medium">{file.name}</span>
									<span class="text-xs text-gray-400">({(file.size / 1024).toFixed(1)}KB)</span>
								</span>
								<button 
									on:click={() => removeUploadedFile(file.id)}
									class="text-red-400 hover:text-red-300 px-3 py-1 rounded-lg bg-red-500/20 transition-colors"
								>
									Remove
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
		
		<div class="flex space-x-4">
			<!-- Media upload button -->
			<button 
				on:click={() => showMediaUpload = !showMediaUpload}
				class="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-gray-200 hover:bg-white/20 hover:text-white transition-all duration-300 flex items-center space-x-2"
				title="Upload image or audio (coming soon)"
			>
				<span class="text-lg">📎</span>
				<span class="font-medium">Media</span>
			</button>
			
			<div class="flex-1">
				<div class="relative">
					<textarea
						bind:value={currentMessage}
						on:keydown={handleKeydown}
						placeholder={voiceEnabled ? "Type your message or click the microphone to speak... Try 'recall last chat' to see previous conversations!" : "Type your message here... Try 'recall last chat' to see previous conversations!"}
						class="w-full resize-none bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300 {interimTranscript ? 'border-blue-400 bg-blue-500/10' : ''}"
						rows="2"
						disabled={isLoading || $isRecalling}
					></textarea>
					{#if interimTranscript}
						<div class="absolute inset-x-0 bottom-0 bg-blue-500/10 backdrop-blur-sm border-t border-blue-400/30 px-4 py-2 text-blue-200 italic rounded-b-xl">
							<span class="text-lg mr-2">🎤</span>"{interimTranscript}"
						</div>
					{/if}
				</div>
			</div>
			<button
				on:click={sendMessageWithMedia}
				disabled={(!currentMessage.trim() && uploadedFiles.length === 0) || isLoading || $isRecalling}
				class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
			>
				{isLoading ? 'Sending...' : $isRecalling ? 'Recalling...' : 'Send'}
			</button>
		</div>
		<div class="mt-4 flex items-center justify-between text-sm text-gray-300">
			<span>Press Enter to send, Shift+Enter for new line{uploadedFiles.length > 0 ? ` • ${uploadedFiles.length} file(s) ready` : ''}</span>
			<span class="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">Model: {tool.model}</span>
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

<!-- Issue 3.2.3: Real-time cost display widget -->
{#if costVisible}
	<div class="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-3 border text-xs z-10">
		<div class="flex items-center justify-between mb-2">
			<span class="font-medium">💰 Session Cost</span>
			<button
				on:click={() => costVisible = false}
				class="text-gray-400 hover:text-gray-600"
			>
				✕
			</button>
		</div>

		<div class="space-y-1">
			<div class="flex justify-between">
				<span>This chat:</span>
				<span class={getCostColor(sessionCost)}>
					{formatCost(sessionCost)}
				</span>
			</div>

			<div class="flex justify-between">
				<span>Today total:</span>
				<span class={getCostColor(totalCost)}>
					{formatCost(totalCost)}
				</span>
			</div>

			<div class="border-t pt-1 text-gray-500">
				<div>{costBreakdown.messages} msgs • {costBreakdown.tokens} tokens</div>
				<div>Avg: {formatCost(costBreakdown.avgCostPerMessage)}/msg</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Minimized cost indicator -->
	<button
		on:click={() => costVisible = true}
		class="fixed top-4 right-4 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center border z-10"
		title="Show cost breakdown"
	>
		<span class="text-xs {getCostColor(sessionCost)}">
			💰
		</span>
	</button>
{/if}

<!-- High usage alert -->
{#if sessionCost > 0.10}
	<div class="fixed bottom-20 right-4 bg-orange-100 border border-orange-300 rounded-lg p-3 text-sm z-10">
		<div class="flex items-center gap-2">
			<span>⚠️</span>
			<div>
				<div class="font-medium">High usage alert</div>
				<div class="text-orange-700">
					Session cost: {formatCost(sessionCost)}
				</div>
			</div>
		</div>
	</div>
{/if} 