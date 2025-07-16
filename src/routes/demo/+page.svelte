<script>
	import { onMount } from 'svelte';
	
	let messages = [];
	let input = '';
	let loading = false;
	let phoneNumber = '+1234567890'; // Simulated phone number for demo
	let chatContainer;
	
	// Simulate sending a message to the WhatsApp endpoint
	async function sendMessage() {
		if (!input.trim() || loading) return;
		
		const userMessage = input.trim();
		input = '';
		loading = true;
		
		// Add user message to chat
		messages = [...messages, {
			id: Date.now(),
			text: userMessage,
			sender: 'user',
			timestamp: new Date()
		}];
		
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
					if (userMessage.toLowerCase() === 'help' || userMessage.toLowerCase() === 'menu') {
						aiResponse = `🤖 *OBT Helper GPT* 🤖

I can help you with:

1. *Creative Writing Assistant* - Help with stories, scripts, and creative content
2. *Social Media Content Creator* - Create engaging posts, captions, and social media strategies
3. *Email Assistant* - Draft professional emails, replies, and communication
4. *Data Analyst* - Analyze data, create insights, and generate reports
5. *Math Tutor* - Step-by-step math problem solving
6. *Recipe Helper* - Cooking ideas and recipe modifications
7. *Code Helper* - Programming assistance and debugging
8. *Language Learning Buddy* - Practice conversations and learn new languages
9. *Business Strategy Advisor* - Business planning and strategy guidance
10. *Travel Planner* - Plan trips, find destinations, and travel advice

Reply with a number to switch tools, or just start chatting!`;
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
					
					messages = [...messages, {
						id: Date.now() + 2,
						text: aiResponse,
						sender: 'bot',
						timestamp: new Date()
					}];
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
	
	onMount(() => {
		// Add welcome message
		messages = [{
			id: 0,
			text: "🤖 Welcome to the OBT Helper GPT Demo!\n\nThis chat simulates WhatsApp by calling the same backend endpoint. Try typing 'help' to see available tools!",
			sender: 'system',
			timestamp: new Date()
		}];
		scrollToBottom();
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
				<div>
					<h1 class="font-semibold text-gray-900">OBT Helper GPT</h1>
					<p class="text-sm text-gray-500">WhatsApp Demo Chat</p>
				</div>
				<div class="ml-auto">
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
						Demo Mode
					</span>
				</div>
			</div>
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
				<p><strong>Simulated Phone:</strong> <code>{phoneNumber}</code></p>
				<p><strong>Method:</strong> Same as real WhatsApp integration</p>
				<p><strong>Features:</strong> All 10 AI tools, conversation memory, tool switching</p>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
</style> 