<script>
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Voice recognition
	let recognition = null;
	let isListening = false;
	let isSupported = false;
	let transcript = '';
	let confidence = 0;
	let silenceTimer = null;

	// Text-to-speech
	let speechSynthesis = null;
	let voices = [];
	let selectedVoice = null;
	let isSpeaking = false;

	// Settings
	export let continuous = false;
	export let language = 'en-US';
	export let autoSpeak = false;
	export let autoSend = true;
	export let silenceDelay = 2000;

	onMount(() => {
		// Check for speech recognition support
		if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
			const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
			
			recognition.onresult = (event) => {
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
			
			recognition.onerror = (event) => {
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
	});

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
			speak(text);
		}
	}
</script>

<div class="flex items-center space-x-2">
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
			disabled={!isSpeaking}
			class="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 {
				isSpeaking 
					? 'bg-green-500 hover:bg-green-600 text-white shadow-md animate-pulse' 
					: 'bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50'
			}"
			title={isSpeaking ? 'Stop speaking' : 'Text-to-speech ready'}
		>
			{#if isSpeaking}
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.616 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.616l3.767-3.816a1 1 0 011.617.816zM14.657 5.343a1 1 0 011.414 0 9.972 9.972 0 010 14.142 1 1 0 11-1.414-1.414 7.971 7.971 0 000-11.314 1 1 0 010-1.414z" clip-rule="evenodd" />
				</svg>
			{:else}
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.616 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.616l3.767-3.816a1 1 0 011.617.816zM14.657 5.343a1 1 0 011.414 0 9.972 9.972 0 010 14.142 1 1 0 11-1.414-1.414 7.971 7.971 0 000-11.314 1 1 0 010-1.414z" clip-rule="evenodd" />
				</svg>
			{/if}
		</button>
	{:else}
		<div class="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full">
			Voice not supported
		</div>
	{/if}
</div>

{#if isListening}
	<div class="flex items-center space-x-2 mt-2 text-sm">
		<div class="flex items-center text-red-600">
			<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
			<span class="font-medium">Listening...</span>
		</div>
		{#if confidence > 0}
			<span class="text-gray-500">({Math.round(confidence * 100)}% confident)</span>
		{/if}
		{#if autoSend}
			<span class="text-xs text-gray-400">• Will auto-send after pause</span>
		{/if}
	</div>
{/if} 