<script>
	import { onMount } from 'svelte';
	import { getActiveTools } from '$lib/stores/tools.js';
	import { apiFetch } from '$lib/utils/api.js';
	
	let messages = [];
	let input = '';
	let loading = false;
	let phoneNumber = ''; // User's actual phone number for demo
	let chatContainer;
	
	// Element bindings for auto-focus
	let chatInputElement;
	let phoneInputElement;
	let verificationInputElement;
	
	// WhatsApp linking state
	let showLinkingForm = false;
	let verificationCode = '';
	let linkingStep = 'phone'; // 'phone', 'code', 'linked'
	let linkingStatus = '';
	let currentSessionId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	let linkedWhatsAppSession = null;
	let syncInterval;
	
	// Simulate sending a message to the WhatsApp endpoint
	async function sendMessage() {
		if (!input.trim() || loading) return;
		
		// Require phone number before sending
		if (!phoneNumber.trim()) {
			messages = [...messages, {
				id: Date.now(),
				text: "⚠️ Please enter your WhatsApp number above to use the demo.",
				sender: 'system',
				timestamp: new Date()
			}];
			scrollToBottom();
			return;
		}
		
		const userMessage = input.trim();
		input = '';
		loading = true;
		
		// Add user message to chat
		const userMsg = {
			id: Date.now(),
			text: userMessage,
			sender: 'user',
			timestamp: new Date()
		};
		
		// Add sync indicator if linked
		if (linkedWhatsAppSession) {
			userMsg.text += ' 🔄';
			userMsg.syncIndicator = true;
		}
		
		messages = [...messages, userMsg];
		
		try {
			// Call the same endpoint that WhatsApp uses
			const response = await apiFetch('/whatsapp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					'From': `whatsapp:${phoneNumber}`,
					'Body': userMessage
				})
			});
			
			if (response.ok) {
				// Get the actual AI response from the logs or simulate it
				// We'll show a processing message and then try to get the response
				messages = [...messages, {
					id: Date.now() + 1,
					text: "🤖 Processing your message...",
					sender: 'bot',
					timestamp: new Date()
				}];
				scrollToBottom();
				
				// Simulate the AI response (in real demo, you'd show what the AI actually generated)
				setTimeout(() => {
					// Remove the processing message
					messages = messages.filter(m => m.text !== "🤖 Processing your message...");
					
					// Add the actual response (this would be the AI response that gets sent to WhatsApp)
					let aiResponse = "";
					const lowerMsg = userMessage.toLowerCase();
					if (lowerMsg === 'help' || lowerMsg === 'menu' || lowerMsg === 'tools' ||
						lowerMsg.includes('what can you do') || lowerMsg.includes('what do you do') ||
						lowerMsg.includes('capabilities') || lowerMsg === 'hello' || lowerMsg === 'hi') {
						aiResponse = `🤖 *OBT Helper GPT* 🤖

I'm your intelligent AI assistant! I can help you with:

✍️ *1. Creative Writing Assistant*
   Help with stories, scripts, and creative content

📱 *2. Social Media Content Creator*
   Create engaging posts, captions, and social media strategies

📧 *3. Email Assistant*
   Draft professional emails, replies, and communication

📊 *4. Data Analyst*
   Analyze data, create insights, and generate reports

🧮 *5. Math Tutor*
   Step-by-step math problem solving

🍳 *6. Recipe Helper*
   Cooking ideas and recipe modifications

💻 *7. Code Helper*
   Programming assistance and debugging

🌍 *8. Language Learning Buddy*
   Practice conversations and learn new languages

🏢 *9. Business Strategy Advisor*
   Business planning and strategy guidance

✈️ *10. Travel Planner*
   Plan trips, find destinations, and travel advice

💬 *Just start chatting!* I'll automatically switch to the right tool based on what you need.

🔢 Or reply with a number (1-10) to manually select a tool.`;
					} else if (/^[1-9]$/.test(userMessage.trim())) {
						const toolNames = [
							"Creative Writing Assistant",
							"Social Media Content Creator", 
							"Email Assistant",
							"Data Analyst",
							"Math Tutor",
							"Recipe Helper",
							"Code Helper",
							"Language Learning Buddy",
							"Business Strategy Advisor",
							"Travel Planner"
						];
						const toolIndex = parseInt(userMessage.trim()) - 1;
						if (toolIndex >= 0 && toolIndex < toolNames.length) {
							aiResponse = `Switched to *${toolNames[toolIndex]}*! How can I help you?`;
						}
					} else {
						// Simulate intelligent tool detection
						const detectedTool = detectBestTool(userMessage);
						if (detectedTool) {
							const toolNames = {
								'recipe-helper': 'Recipe Helper',
								'math-tutor': 'Math Tutor',
								'code-helper': 'Code Helper',
								'creative-writing': 'Creative Writing Assistant',
								'business-strategy': 'Business Strategy Advisor',
								'travel-planner': 'Travel Planner',
								'email-assistant': 'Email Assistant',
								'social-media': 'Social Media Content Creator',
								'language-buddy': 'Language Learning Buddy',
								'data-analyst': 'Data Analyst'
							};
							aiResponse = `*[Switched to ${toolNames[detectedTool]}]*\n\nGreat! I can help you with that. What specifically would you like to know?`;
						} else {
							aiResponse = "Thanks for your message! I'm ready to help you with whatever you need.";
						}
					}
					
					// Function to detect the best tool (same logic as backend)
					function detectBestTool(message) {
						const msg = message.toLowerCase();
						
						if (msg.includes('hungry') || msg.includes('recipe') || msg.includes('cook') || 
							msg.includes('food') || msg.includes('eat') || msg.includes('meal')) {
							return 'recipe-helper';
						}
						
						if (msg.includes('calculate') || msg.includes('math') || msg.includes('solve') ||
							/\d+\s*[\+\-\*\/]\s*\d+/.test(msg)) {
							return 'math-tutor';
						}
						
						if (msg.includes('code') || msg.includes('program') || msg.includes('debug') ||
							msg.includes('javascript') || msg.includes('python')) {
							return 'code-helper';
						}
						
						if (msg.includes('story') || msg.includes('write') || msg.includes('creative')) {
							return 'creative-writing';
						}
						
						if (msg.includes('business') || msg.includes('strategy') || msg.includes('marketing')) {
							return 'business-strategy';
						}
						
						if (msg.includes('travel') || msg.includes('trip') || msg.includes('vacation')) {
							return 'travel-planner';
						}
						
						return null;
					}
					
					const botMsg = {
						id: Date.now() + 2,
						text: aiResponse,
						sender: 'bot',
						timestamp: new Date()
					};
					
					// Add sync indicator if linked
					if (linkedWhatsAppSession) {
						botMsg.text += ' 🔄';
						botMsg.syncIndicator = true;
					}
					
					messages = [...messages, botMsg];
					scrollToBottom();
				}, 2000);
			} else {
				throw new Error(`HTTP ${response.status}`);
			}
		} catch (error) {
			console.error('Error sending message:', error);
			messages = [...messages, {
				id: Date.now(),
				text: `❌ Error: ${error.message}`,
				sender: 'system',
				timestamp: new Date()
			}];
		}
		
		loading = false;
		
		// Re-focus the chat input after sending
		setTimeout(() => {
			if (chatInputElement) {
				chatInputElement.focus();
			}
		}, 100);
		
		scrollToBottom();
	}
	
	function scrollToBottom() {
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 100);
	}
	
	function handleKeyDown(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
		// Shift+Enter will naturally create a new line in textarea
	}
	
	// WhatsApp linking functions
	async function sendLinkingCode() {
		try {
			// Debug logging
			console.log('=== DEMO SEND LINKING CODE ===');
			console.log('phoneNumber:', phoneNumber);
			console.log('phoneNumber type:', typeof phoneNumber);
			console.log('phoneNumber length:', phoneNumber ? phoneNumber.length : 'no length');
			
			// Debug the request payload
			const requestPayload = { 
				phoneNumber: phoneNumber, // Use the phone number from the main input
				sessionId: currentSessionId,
				toolId: 'general-assistant'
			};
			console.log('=== REQUEST PAYLOAD ===');
			console.log('Full payload object:', requestPayload);
			console.log('Payload phoneNumber:', requestPayload.phoneNumber);
			console.log('JSON stringified:', JSON.stringify(requestPayload));
			
			linkingStatus = 'Sending code...';
			const response = await apiFetch('/send-link-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestPayload)
			});
			
			const data = await response.json();
			
			if (response.ok && data.success) {
				linkingStep = 'code';
				linkingStatus = '✅ Code sent! Check your WhatsApp.';
				
				// If there's a test code, show it in demo mode
				if (data.testCode) {
					linkingStatus += ` Demo code: ${data.testCode}`;
				}
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
			const response = await apiFetch('/verify-link-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					phoneNumber: phoneNumber, // Use the phone number from the main input
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
				
				// Save link state to localStorage for persistence
				const linkState = {
					linkedSessionId: data.linkedSessionId,
					phoneNumber: data.phoneNumber,
					webSessionId: currentSessionId,
					timestamp: Date.now()
				};
							localStorage.setItem('whatsapp-link-state', JSON.stringify(linkState));
				
				// Add system message to demo chat
				const linkMessage = {
					id: Date.now(),
					text: `🔗 **Demo Linked!** Your demo chat is now synced with ${data.phoneNumber}. Messages sent here will appear in WhatsApp and vice versa.`,
					sender: 'system',
					timestamp: new Date()
				};
				messages = [...messages, linkMessage];
				scrollToBottom();
				
				// Start polling for synced messages
				startSyncPolling();
				
				// Reset form
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
		verificationCode = '';
		linkingStatus = '';
	}
	
	// Poll for messages synced from WhatsApp
	function startSyncPolling() {
		syncInterval = setInterval(async () => {
			if (linkedWhatsAppSession) {
				try {
					const response = await apiFetch(`/get-synced-messages?sessionId=${currentSessionId}`);
					if (response.ok) {
						const syncData = await response.json();
						if (syncData.messages.length > 0) {
							
							// Add synced messages to demo chat
							syncData.messages.forEach(msg => {
								// Add user message from WhatsApp
								const userMessage = {
									id: Date.now() + Math.random(),
									text: `📱 [From WhatsApp] ${msg.userMessage}`,
									sender: 'user',
									timestamp: new Date(msg.timestamp),
									source: 'whatsapp'
								};
								
								// Add AI response
								const aiMessage = {
									id: Date.now() + Math.random() + 1,
									text: `[From WhatsApp] ${msg.aiResponse}`,
									sender: 'bot',
									timestamp: new Date(msg.timestamp + 1000),
									source: 'whatsapp'
								};
								
								messages = [...messages, userMessage, aiMessage];
							});
							
							scrollToBottom();
						}
					}
				} catch (error) {
					console.error('Error polling for synced messages:', error);
				}
			}
		}, 5000); // Poll every 5 seconds
	}
	
	onMount(async () => {
		currentSessionId = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
		
		// Load tools
		const availableTools = await getActiveTools();
		
		// Restore WhatsApp link state from localStorage
		try {
			const savedLinkState = localStorage.getItem('whatsapp-link-state');
			if (savedLinkState) {
				const linkData = JSON.parse(savedLinkState);
				
				// Verify the link is still valid (optional)
				const verifyResponse = await apiFetch('/verify-sync?sessionId=' + linkData.webSessionId);
				if (verifyResponse.ok) {
					const verifyData = await verifyResponse.json();
					if (verifyData.isLinked) {
						// Restore the linked state
						linkedWhatsAppSession = linkData.linkedSessionId;
						linkingStep = 'linked';
						phoneNumber = linkData.phoneNumber;
						
						console.log('Restored WhatsApp link:', linkData);
						
						// Start polling for synced messages
						startSyncPolling();
						
						// Add restoration message
						messages = [{
							id: Date.now(),
							text: `🔗 **WhatsApp Link Restored!** Still synced with ${linkData.phoneNumber}`,
							sender: 'system',
							timestamp: new Date()
						}];
						scrollToBottom();
						return; // Skip adding the welcome message
					}
				}
				
				// Link is no longer valid, clear storage
				localStorage.removeItem('whatsapp-link-state');
			}
		} catch (error) {
			console.error('Error restoring WhatsApp link:', error);
			localStorage.removeItem('whatsapp-link-state');
		}
		
		// Add welcome message (only if not linked)
		messages = [{
			id: 0,
			text: "🤖 Welcome to the OBT Helper GPT Demo!\n\n1️⃣ Enter your WhatsApp number above\n2️⃣ Chat and test all the AI tools\n3️⃣ Optionally click 'Link & Sync' for real bidirectional WhatsApp syncing\n\nTry typing 'help' to see available tools!",
			sender: 'system',
			timestamp: new Date()
		}];
		scrollToBottom();
	});
	
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		if (syncInterval) {
			clearInterval(syncInterval);
		}
	});
</script>

<svelte:head>
	<title>WhatsApp Demo Chat - OBT Helper GPT</title>
</svelte:head>

<!-- 2025 WhatsApp Demo with glassmorphic design -->
<div class="min-h-screen py-8">
	<div class="max-w-2xl mx-auto px-4">
		<!-- 2025 Header -->
		<div class="relative group">
			<div class="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-3xl blur opacity-20"></div>
			<div class="relative bg-white/10 backdrop-blur-xl rounded-t-3xl border border-white/20 border-b-0 p-6 shadow-2xl">
				<div class="flex items-center space-x-4">
					<div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center filter drop-shadow-lg">
						<span class="text-white font-bold text-xl">🤖</span>
					</div>
					<div class="flex-1">
						<h1 class="font-bold text-white text-xl">OBT Helper GPT</h1>
						<p class="text-gray-200">WhatsApp Demo Chat</p>
					</div>
					<div class="flex items-center space-x-3">
						<span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-400/30 backdrop-blur-sm">
							✨ Demo Mode
						</span>
					</div>
				</div>
			</div>
		</div>
		
		<!-- 2025 Phone Number Input -->
		<div class="relative">
			<div class="bg-white/10 backdrop-blur-xl border-x border-white/20 p-4">
				<div class="flex items-center space-x-3">
					<div class="flex-1">
						<input 
							type="tel"
							bind:this={phoneInputElement}
							bind:value={phoneNumber}
							placeholder="Enter your WhatsApp number (+1234567890)"
							class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50 transition-all duration-300"
						/>
					</div>
					<button 
						on:click={() => showLinkingForm = true}
						disabled={!phoneNumber.trim()}
						class="inline-flex items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
						title="Link for bidirectional syncing"
					>
						🔗 {linkedWhatsAppSession ? 'Linked' : 'Link & Sync'}
					</button>
				</div>
			</div>
		</div>
			
					<!-- 2025 Status Messages -->
		{#if phoneNumber && !linkedWhatsAppSession}
			<div class="bg-white/10 backdrop-blur-sm border-x border-white/20 px-4 py-3">
				<p class="text-gray-200">
					Demo will simulate WhatsApp messages to <strong class="text-white">{phoneNumber}</strong>. Click "Link & Sync" to enable real bidirectional syncing.
				</p>
			</div>
		{/if}
		
		{#if linkedWhatsAppSession}
			<div class="bg-white/10 backdrop-blur-sm border-x border-white/20 px-4 py-3">
				<div class="flex items-center justify-between">
					<span class="inline-flex items-center px-4 py-2 rounded-full font-medium bg-green-500/20 text-green-300 border border-green-400/30">
						🔗 Synced with {phoneNumber}
					</span>
					<button 
						on:click={() => {
							linkedWhatsAppSession = null;
							linkingStep = 'phone';
							
							// Clear localStorage
							localStorage.removeItem('whatsapp-link-state');
							
							// Stop polling
							if (syncInterval) {
								clearInterval(syncInterval);
								syncInterval = null;
							}
							
							// Add disconnect message
							messages = [...messages, {
								id: Date.now(),
								text: "🔌 **WhatsApp Disconnected** - Link removed. You can re-link anytime!",
								sender: 'system',
								timestamp: new Date()
							}];
							scrollToBottom();
						}}
						class="px-3 py-1 bg-red-500/20 text-red-300 border border-red-400/30 rounded-lg hover:bg-red-500/30 transition-all duration-300"
					>
						Disconnect
					</button>
				</div>
			</div>
		{/if}
		</div>

		<!-- 2025 Chat Messages Container -->
		<div class="relative">
			<div class="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-b-3xl blur opacity-20"></div>
			<div 
				bind:this={chatContainer}
				class="relative bg-white/10 backdrop-blur-xl h-96 overflow-y-auto p-6 space-y-4 border-x border-b border-white/20 rounded-b-3xl shadow-2xl"
			>
			{#each messages as message (message.id)}
				<div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
					<div class="max-w-xs lg:max-w-md group">
						<div class="relative">
							<!-- Glow effect for messages -->
							{#if message.sender === 'user'}
								<div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
							{:else if message.sender === 'system'}
								<div class="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
							{:else}
								<div class="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
							{/if}
							
							<div class="relative px-4 py-3 rounded-2xl backdrop-blur-xl border transition-all duration-300 {
								message.sender === 'user' 
									? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border-blue-400/30' 
									: message.sender === 'system'
									? 'bg-yellow-500/10 text-yellow-200 border-yellow-400/30'
									: 'bg-green-500/10 text-green-200 border-green-400/30'
							}">
								<p class="whitespace-pre-line leading-relaxed">{message.text}</p>
								<p class="text-xs opacity-70 mt-2 pt-1 border-t border-white/10">
									{message.timestamp.toLocaleTimeString()}
								</p>
							</div>
						</div>
					</div>
				</div>
			{/each}
			
			{#if loading}
				<div class="flex justify-start">
					<div class="relative group">
						<div class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20"></div>
						<div class="relative bg-white/10 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/20">
							<div class="flex items-center space-x-3">
								<div class="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent"></div>
								<span class="text-gray-200 font-medium">Processing...</span>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		</div>
		
		<!-- 2025 Input Area -->
		<div class="relative">
			<div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-b-3xl blur opacity-20"></div>
			<div class="relative bg-white/10 backdrop-blur-xl border-x border-b border-white/20 rounded-b-3xl p-6 shadow-2xl">
				<div class="flex space-x-4 items-end">
					<div class="flex-1 relative">
						<textarea
							bind:this={chatInputElement}
							bind:value={input}
							on:keydown={handleKeyDown}
							placeholder="Type your message... (Shift+Enter for new line)"
							disabled={loading}
							rows="1"
							autofocus
							class="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 resize-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 disabled:opacity-50 min-h-[2.5rem] max-h-32 overflow-y-auto transition-all duration-300"
							style="field-sizing: content;"
					></textarea>
				</div>
					<button
						on:click={sendMessage}
						disabled={!input.trim() || loading}
						class="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl px-8 py-3 hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex-shrink-0 font-medium shadow-lg"
					>
						Send
					</button>
				</div>
				
				<!-- 2025 Quick Actions -->
				<div class="mt-4 flex flex-wrap gap-3">
					<button
						on:click={() => { input = 'help'; sendMessage(); }}
						disabled={loading}
						class="px-4 py-2 bg-white/10 backdrop-blur-sm text-gray-200 rounded-xl hover:bg-white/20 hover:text-white disabled:opacity-50 transition-all duration-300 border border-white/20"
					>
						📋 Help
					</button>
					<button
						on:click={() => { input = '1'; sendMessage(); }}
						disabled={loading}
						class="px-4 py-2 bg-white/10 backdrop-blur-sm text-gray-200 rounded-xl hover:bg-white/20 hover:text-white disabled:opacity-50 transition-all duration-300 border border-white/20"
					>
						✍️ Creative Writing
					</button>
					<button
						on:click={() => { input = '5'; sendMessage(); }}
						disabled={loading}
					class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50"
				>
					🧮 Math Tutor
				</button>
				<button
					on:click={() => { input = '7'; sendMessage(); }}
					disabled={loading}
					class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50"
				>
					💻 Code Helper
				</button>
			</div>
		</div>

		<!-- Demo Info -->
		<div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
			<h3 class="font-medium text-blue-900 mb-2">🎯 Demo Information</h3>
			<div class="text-sm text-blue-700 space-y-1">
				<p><strong>Endpoint:</strong> <code>/.netlify/functions/whatsapp</code></p>
				{#if phoneNumber}
					<p><strong>Your Phone:</strong> <code>{phoneNumber}</code></p>
				{/if}
				<p><strong>Method:</strong> Same as real WhatsApp integration</p>
				<p><strong>Features:</strong> All 10 AI tools, conversation memory, tool switching, bidirectional WhatsApp linking</p>
				{#if linkedWhatsAppSession}
					<p><strong>Status:</strong> 🔗 Linked to {phoneNumber} - Messages sync both ways!</p>
				{/if}
			</div>
		</div>
	</div>
	
	<!-- WhatsApp Linking Modal -->
	{#if showLinkingForm}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-lg max-w-md w-full mx-4 p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-gray-900">Link Real WhatsApp</h3>
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
							Ready to link <strong>{phoneNumber}</strong> for bidirectional syncing? You'll receive a verification code via WhatsApp.
						</p>
						<!-- DEBUG: Show current variable state -->
						<div class="text-xs text-red-600 mb-2">
							DEBUG: phoneNumber = "{phoneNumber}" (type: {typeof phoneNumber}) (length: {phoneNumber ? phoneNumber.length : 'undefined'})
						</div>
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
							<p class="text-sm text-blue-700">
								<strong>📱 {phoneNumber}</strong> will receive a 6-digit code to verify the connection.
							</p>
						</div>
						<div class="flex gap-3">
							<!-- DEBUG: Show button state -->
							<div class="text-xs text-red-600 mb-2">
								DEBUG: Button disabled = {!phoneNumber?.trim() || linkingStatus.includes('Sending')} (phoneNumber.trim() = "{phoneNumber?.trim()}")
							</div>
							<button 
								on:click={sendLinkingCode}
								disabled={!phoneNumber?.trim() || linkingStatus.includes('Sending')}
								class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{linkingStatus.includes('Sending') ? 'Sending...' : 'Send Verification Code'}
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
							<label for="verification-code" class="block text-sm font-medium text-gray-700 mb-2">
								Verification Code
							</label>
							<input 
								id="verification-code"
								type="text"
								bind:this={verificationInputElement}
								bind:value={verificationCode}
								placeholder="123456"
								maxlength="6"
								autofocus
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
</div>

<style>
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
</style> 