<script>
	import { onMount } from 'svelte';
	
	let messages = [];
	let input = '';
	let loading = false;
	let phoneNumber = ''; // User's actual phone number for demo
	let chatContainer;
	
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
			const response = await fetch('/.netlify/functions/whatsapp', {
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
		scrollToBottom();
	}
	
	function scrollToBottom() {
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 100);
	}
	
	function handleKeyPress(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}
	
	// WhatsApp linking functions
	async function sendLinkingCode() {
		try {
			linkingStatus = 'Sending code...';
			const response = await fetch('/.netlify/functions/send-link-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					phoneNumber: phoneNumber, // Use the phone number from the main input
					sessionId: currentSessionId,
					toolId: 'general-assistant'
				})
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
			const response = await fetch('/.netlify/functions/verify-link-code', {
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
					const response = await fetch(`/.netlify/functions/get-synced-messages?sessionId=${currentSessionId}`);
					if (response.ok) {
						const syncData = await response.json();
						if (syncData.messages.length > 0) {
							console.log(`Received ${syncData.messages.length} synced messages from WhatsApp`);
							
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
	
	onMount(() => {
		// Add welcome message
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

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-2xl mx-auto px-4">
		<!-- Header -->
		<div class="bg-white rounded-t-lg shadow-sm border-b p-4">
			<div class="flex items-center space-x-3">
				<div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
					<span class="text-white font-bold text-lg">🤖</span>
				</div>
				<div class="flex-1">
					<h1 class="font-semibold text-gray-900">OBT Helper GPT</h1>
					<p class="text-sm text-gray-500">WhatsApp Demo Chat</p>
				</div>
				<div class="flex items-center space-x-2">
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
						Demo Mode
					</span>
				</div>
			</div>
			
			<!-- Phone Number Input -->
			<div class="mt-3 flex items-center space-x-2">
				<div class="flex-1">
					<input 
						type="tel"
						bind:value={phoneNumber}
						placeholder="Enter your WhatsApp number (+1234567890)"
						class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
				<button 
					on:click={() => showLinkingForm = true}
					disabled={!phoneNumber.trim()}
					class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					title="Link for bidirectional syncing"
				>
					🔗 {linkedWhatsAppSession ? 'Linked' : 'Link & Sync'}
				</button>
			</div>
			
			{#if phoneNumber && !linkedWhatsAppSession}
				<p class="text-xs text-gray-500 mt-1">
					Demo will simulate WhatsApp messages to <strong>{phoneNumber}</strong>. Click "Link & Sync" to enable real bidirectional syncing.
				</p>
			{/if}
			
			{#if linkedWhatsAppSession}
				<div class="mt-1 flex items-center space-x-2">
					<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
						🔗 Synced with {phoneNumber}
					</span>
					<button 
						on:click={() => {
							linkedWhatsAppSession = null;
							// Add disconnect message
							messages = [...messages, {
								id: Date.now(),
								text: "🔗 WhatsApp sync disconnected. Demo will continue in simulation mode.",
								sender: 'system',
								timestamp: new Date()
							}];
							scrollToBottom();
						}}
						class="text-xs text-red-600 hover:text-red-800"
					>
						Disconnect
					</button>
				</div>
			{/if}
		</div>

		<!-- Chat Messages -->
		<div 
			bind:this={chatContainer}
			class="bg-white h-96 overflow-y-auto p-4 space-y-4"
		>
			{#each messages as message (message.id)}
				<div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
					<div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg {
						message.sender === 'user' 
							? 'bg-blue-500 text-white' 
							: message.sender === 'system'
							? 'bg-gray-100 text-gray-700 border'
							: 'bg-green-100 text-gray-900'
					}">
						<p class="text-sm whitespace-pre-line">{message.text}</p>
						<p class="text-xs opacity-70 mt-1">
							{message.timestamp.toLocaleTimeString()}
						</p>
					</div>
				</div>
			{/each}
			
			{#if loading}
				<div class="flex justify-start">
					<div class="bg-gray-100 px-4 py-2 rounded-lg border">
						<div class="flex items-center space-x-2">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
							<span class="text-sm text-gray-600">Processing...</span>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Input Area -->
		<div class="bg-white rounded-b-lg shadow-sm border-t p-4">
			<div class="flex space-x-2">
				<input
					bind:value={input}
					on:keypress={handleKeyPress}
					placeholder="Type your message..."
					disabled={loading}
					class="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
				/>
				<button
					on:click={sendMessage}
					disabled={!input.trim() || loading}
					class="bg-blue-500 text-white rounded-full px-6 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Send
				</button>
			</div>
			
			<!-- Quick Actions -->
			<div class="mt-3 flex flex-wrap gap-2">
				<button
					on:click={() => { input = 'help'; sendMessage(); }}
					disabled={loading}
					class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50"
				>
					📋 Help
				</button>
				<button
					on:click={() => { input = '1'; sendMessage(); }}
					disabled={loading}
					class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50"
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
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
							<p class="text-sm text-blue-700">
								<strong>📱 {phoneNumber}</strong> will receive a 6-digit code to verify the connection.
							</p>
						</div>
						<div class="flex gap-3">
							<button 
								on:click={sendLinkingCode}
								disabled={linkingStatus.includes('Sending')}
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
</div>

<style>
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
</style> 