<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Voice recognition
	let recognition: any = null;
	let isListening = false;
	let isSupported = false;
	let transcript = '';
	let confidence = 0;
	let silenceTimer: any = null;

	// Text-to-speech
	let speechSynthesis: any = null;
	let voices: any[] = [];
	let selectedVoice: any = null;
	let isSpeaking = false;

	// Issue 3.1.3: Enhanced audio capabilities (stubs)
	let audioPlaybackEnabled = false;
	let voiceSelection = 'default';
	let audioQueue: any[] = [];
	let isPlaying = false;
	let audioContext: any = null;

	// Settings
	export let continuous = false;
	export let language = 'en-US';
	export let autoSpeak = false;
	export let autoSend = true;
	export let silenceDelay = 2000;

	// Issue 3.1.3: Enhanced voice options (including future capabilities)
	const voiceOptions = [
		{ id: 'default', name: 'Default TTS', available: true, description: 'System text-to-speech' },
		{ id: 'neural-casual', name: 'Neural Casual', available: false, description: 'AI-powered casual voice (Coming Soon)' },
		{ id: 'neural-professional', name: 'Neural Professional', available: false, description: 'AI-powered professional voice (Coming Soon)' },
		{ id: 'neural-expressive', name: 'Neural Expressive', available: false, description: 'Emotion-aware voice synthesis (Coming Soon)' },
		{ id: 'cloned-voice', name: 'Custom Voice Clone', available: false, description: 'Your personal voice clone (Coming Soon)' },
		{ id: 'multilingual', name: 'Multilingual Neural', available: false, description: 'Real-time language switching (Coming Soon)' }
	];

	onMount(() => {
		// Check for speech recognition support
		if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
			const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
			recognition = new SpeechRecognition();
			
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.lang = language;
			
			recognition.onstart = () => {
				isListening = true;
				dispatch('listening', { isListening: true });
			};
			
			recognition.onend = () => {
				isListening = false;
				dispatch('listening', { isListening: false });
			};
			
			recognition.onresult = (event: any) => {
				let finalTranscript = '';
				let interimTranscript = '';
				
				if (silenceTimer) {
					clearTimeout(silenceTimer);
					silenceTimer = null;
				}
				
				for (let i = event.resultIndex; i < event.results.length; i++) {
					const result = event.results[i];
					if (result.isFinal) {
						finalTranscript += result[0].transcript;
						confidence = result[0].confidence;
					} else {
						interimTranscript += result[0].transcript;
					}
				}
				
				if (finalTranscript) {
					transcript = finalTranscript;
					dispatch('transcript', { 
						text: finalTranscript, 
						confidence: confidence,
						isFinal: true 
					});
					
					if (autoSend && finalTranscript.trim()) {
						silenceTimer = setTimeout(() => {
							dispatch('autoSend');
							stopListening();
						}, silenceDelay);
					}
				} else if (interimTranscript) {
					dispatch('transcript', { 
						text: interimTranscript, 
						confidence: 0,
						isFinal: false 
					});
				}
			};
			
			recognition.onerror = (event: any) => {
				console.error('Speech recognition error:', event.error);
				isListening = false;
				dispatch('error', { error: event.error });
			};
			
			isSupported = true;
		}

		// Check for speech synthesis support
		if ('speechSynthesis' in window) {
			speechSynthesis = window.speechSynthesis;
			
			// Load voices
			const loadVoices = () => {
				voices = speechSynthesis.getVoices();
				// Try to find a good default voice
				selectedVoice = voices.find(voice => voice.lang.startsWith(language.split('-')[0])) || voices[0];
			};
			
			loadVoices();
			speechSynthesis.onvoiceschanged = loadVoices;
		}

		// Issue 3.1.3: Initialize Web Audio API for advanced features
		if (window.AudioContext || window.webkitAudioContext) {
			try {
				audioContext = new (window.AudioContext || window.webkitAudioContext)();
				console.log('🎵 Audio context ready for advanced voice features');
			} catch (error) {
				console.log('Audio context not available:', error);
			}
		}
	});

	// Issue 3.1.3: Enhanced audio response with visual feedback
	export async function playAudioResponse(text, options = {}) {
		if (!audioPlaybackEnabled) return;
		
		// Check if Web Audio API available
		if (!audioContext) {
			console.log('🚧 Web Audio API not supported - using fallback TTS');
			speak(text);
			return;
		}
		
		// Stub: Simulate advanced audio generation
		audioQueue.push({
			text,
			voice: options.voice || voiceSelection,
			timestamp: Date.now(),
			isStub: true
		});
		
		processAudioQueue();
	}

	// Issue 3.1.3: Process audio queue with visual feedback
	async function processAudioQueue() {
		if (isPlaying || audioQueue.length === 0) return;
		
		isPlaying = true;
		const audioItem = audioQueue.shift();
		
		if (audioItem.isStub) {
			// Simulate audio playback with visual feedback
			console.log(`🎵 Playing audio: "${audioItem.text}" (${audioItem.voice})`);
			
			// Show visual indicator
			const indicator = document.createElement('div');
			indicator.innerHTML = `🔊 Playing: ${getVoiceDescription(audioItem.voice)}`;
			indicator.style.cssText = `
				position: fixed; top: 20px; right: 20px; 
				background: #4ade80; color: white; 
				padding: 8px 12px; border-radius: 6px; 
				z-index: 1000; font-size: 14px;
				box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
				animation: slideIn 0.3s ease-out;
			`;
			document.body.appendChild(indicator);
			
			// Simulate playback duration (based on text length)
			const duration = Math.max(1000, audioItem.text.length * 80);
			
			setTimeout(() => {
				if (document.body.contains(indicator)) {
					document.body.removeChild(indicator);
				}
				isPlaying = false;
				processAudioQueue(); // Process next in queue
			}, duration);
		} else {
			// Use existing TTS for now
			speak(audioItem.text);
			isPlaying = false;
		}
	}

	// Issue 3.1.3: Audio input stub (for future voice cloning)
	async function processAudioInput(audioBlob) {
		// Stub: Simulate audio-to-text conversion with advanced features
		const placeholderTranscription = "Audio input received - advanced transcription coming soon";
		
		// Show processing feedback
		dispatch('audioProcessing', {
			type: 'input',
			size: audioBlob.size,
			message: `🎙️ Processing audio input (${Math.round(audioBlob.size / 1024)}KB)...`
		});
		
		// Simulate processing delay
		setTimeout(() => {
			dispatch('audioProcessed', {
				type: 'transcription',
				text: placeholderTranscription,
				features: [
					'High-accuracy speech recognition',
					'Multi-language support',
					'Background noise filtering',
					'Speaker identification',
					'Emotion detection'
				],
				isStub: true
			});
		}, 1500);
	}

	// Helper function to get voice description
	function getVoiceDescription(voiceId) {
		const voice = voiceOptions.find(v => v.id === voiceId);
		return voice ? voice.name : 'Default Voice';
	}

	// Handle audio file upload
	function handleAudioFile(event: any) {
		const file = event.target.files[0];
		if (file && file.type.startsWith('audio/')) {
			processAudioInput(file);
		}
		// Clear input for future uploads
		event.target.value = '';
	}

	export function startListening() {
		if (recognition && !isListening) {
			try {
				transcript = '';
				recognition.start();
			} catch (error) {
				console.error('Error starting recognition:', error);
			}
		}
	}

	export function stopListening() {
		if (recognition && isListening) {
			recognition.stop();
		}
		if (silenceTimer) {
			clearTimeout(silenceTimer);
			silenceTimer = null;
		}
	}

	export function toggleListening() {
		if (isListening) {
			stopListening();
		} else {
			startListening();
		}
	}

	export function speak(text, voice = selectedVoice) {
		if (speechSynthesis && text) {
			// Stop any current speech
			speechSynthesis.cancel();
			
			const utterance = new SpeechSynthesisUtterance(text);
			if (voice) {
				utterance.voice = voice;
			}
			utterance.rate = 0.9;
			utterance.pitch = 1;
			utterance.volume = 0.8;
			
			utterance.onstart = () => {
				isSpeaking = true;
				dispatch('speaking', { isSpeaking: true });
			};
			
			utterance.onend = () => {
				isSpeaking = false;
				dispatch('speaking', { isSpeaking: false });
			};
			
			speechSynthesis.speak(utterance);
		}
	}

	export function stopSpeaking() {
		if (speechSynthesis) {
			speechSynthesis.cancel();
			isSpeaking = false;
		}
	}

	// Auto-speak when autoSpeak is enabled
	export function handleAutoSpeak(text) {
		if (autoSpeak && text) {
			if (audioPlaybackEnabled) {
				playAudioResponse(text);
			} else {
				speak(text);
			}
		}
	}
</script>

<!-- Issue 3.1.3: Enhanced voice controls with future capabilities -->
<div class="voice-controls bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
	<div class="flex items-center justify-between mb-3">
		<h4 class="font-medium text-gray-800">🎵 Voice & Audio Controls</h4>
		<label class="flex items-center gap-2">
			<input 
				type="checkbox" 
				bind:checked={audioPlaybackEnabled}
				class="rounded"
			/>
			<span class="text-sm text-gray-700">Enhanced Audio</span>
		</label>
	</div>
	
	<!-- Voice selection -->
	<div class="mb-3">
		<label class="block text-sm font-medium text-gray-700 mb-1">Voice Style:</label>
		<select bind:value={voiceSelection} class="w-full p-2 border border-gray-200 rounded-md text-sm">
			{#each voiceOptions as voice}
				<option value={voice.id} disabled={!voice.available}>
					{voice.name} {voice.available ? '' : '(Preview)'}
				</option>
			{/each}
		</select>
		{#if voiceSelection !== 'default'}
			<p class="text-xs text-gray-500 mt-1">
				{voiceOptions.find(v => v.id === voiceSelection)?.description || ''}
			</p>
		{/if}
	</div>
	
	<!-- Main voice controls -->
	<div class="flex items-center space-x-2 mb-3">
		{#if isSupported}
			<!-- Microphone Button -->
			<button
				on:click={toggleListening}
				class="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 {
					isListening 
						? 'bg-red-500 hover:bg-red-600 text-white shadow-lg ring-4 ring-red-200 animate-pulse' 
						: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
				}"
				title={isListening ? 'Stop voice input (will auto-send after pause)' : 'Start voice input'}
			>
				{#if isListening}
					<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
					</svg>
				{:else}
					<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
					</svg>
				{/if}
			</button>

			<!-- Speaker Button (for TTS) -->
			<button
				on:click={stopSpeaking}
				disabled={!isSpeaking && !isPlaying}
				class="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 {
					isSpeaking || isPlaying
						? 'bg-green-500 hover:bg-green-600 text-white shadow-md animate-pulse' 
						: 'bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50'
				}"
				title={isSpeaking || isPlaying ? 'Stop speaking' : 'Text-to-speech ready'}
			>
				{#if isSpeaking || isPlaying}
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.616 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.616l3.767-3.816a1 1 0 011.617.816zM14.657 5.343a1 1 0 011.414 0 9.972 9.972 0 010 14.142 1 1 0 11-1.414-1.414 7.971 7.971 0 000-11.314 1 1 0 010-1.414z" clip-rule="evenodd" />
					</svg>
				{:else}
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.616 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.616l3.767-3.816a1 1 0 011.617.816zM14.657 5.343a1 1 0 011.414 0 9.972 9.972 0 010 14.142 1 1 0 11-1.414-1.414 7.971 7.971 0 000-11.314 1 1 0 010-1.414z" clip-rule="evenodd" />
					</svg>
				{/if}
			</button>

			<!-- Issue 3.1.3: Audio input button -->
			<input 
				type="file"
				accept="audio/*"
				on:change={handleAudioFile}
				class="hidden"
				id="audio-upload"
			/>
			<label 
				for="audio-upload"
				class="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500 hover:bg-purple-600 text-white shadow-md hover:shadow-lg cursor-pointer transition-all duration-200"
				title="Upload audio file (preview)"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
				</svg>
			</label>
		{:else}
			<div class="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full">
				Voice not supported in this browser
			</div>
		{/if}
	</div>
	
	<!-- Status indicators -->
	{#if isListening}
		<div class="flex items-center space-x-2 text-sm bg-red-50 border border-red-200 rounded p-2">
			<div class="flex items-center text-red-600">
				<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
				<span class="font-medium">Listening...</span>
			</div>
			{#if confidence > 0}
				<span class="text-red-500">({Math.round(confidence * 100)}% confident)</span>
			{/if}
			{#if autoSend}
				<span class="text-xs text-red-400">• Will auto-send after pause</span>
			{/if}
		</div>
	{/if}
	
	{#if audioQueue.length > 0}
		<div class="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded p-2 mt-2">
			🎵 Audio queue: {audioQueue.length} item{audioQueue.length !== 1 ? 's' : ''} pending
		</div>
	{/if}
	
	{#if audioPlaybackEnabled && voiceSelection !== 'default'}
		<div class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
			🚧 Enhanced voice features in preview mode - using simulation
		</div>
	{/if}
</div>

<style>
	@keyframes slideIn {
		from { transform: translateX(100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}
</style> 