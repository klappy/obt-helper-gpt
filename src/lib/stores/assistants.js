import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Assistant personality definitions
export const personalities = {
	friendly: {
		id: 'friendly',
		name: 'Friendly',
		description: 'Warm, approachable, and encouraging',
		emoji: '😊',
		traits: ['warm', 'encouraging', 'patient', 'casual'],
		color: 'var(--color-success)',
		responseStyle: {
			greeting: 'Hey there! How can I help you today?',
			thinking: 'Let me think about that for a moment...',
			error: 'Oops! Something went wrong. Let\'s try again!',
			goodbye: 'Take care! Feel free to come back anytime!'
		},
		typingSpeed: 'normal',
		voiceTone: 'cheerful'
	},
	professional: {
		id: 'professional', 
		name: 'Professional',
		description: 'Formal, precise, and business-focused',
		emoji: '💼',
		traits: ['formal', 'precise', 'efficient', 'structured'],
		color: 'var(--color-primary)',
		responseStyle: {
			greeting: 'Good day. How may I assist you?',
			thinking: 'Processing your request...',
			error: 'An error has occurred. Please try again.',
			goodbye: 'Thank you for your time. Have a productive day.'
		},
		typingSpeed: 'fast',
		voiceTone: 'neutral'
	},
	playful: {
		id: 'playful',
		name: 'Playful',
		description: 'Fun, creative, and enthusiastic',
		emoji: '🎮',
		traits: ['fun', 'creative', 'enthusiastic', 'quirky'],
		color: 'var(--color-secondary)',
		responseStyle: {
			greeting: 'Yo! Ready for some awesome help? 🚀',
			thinking: 'Hmm, let me cook up something good...',
			error: 'Whoopsie! That didn\'t work. Round 2?',
			goodbye: 'Catch you later! Stay awesome! ✨'
		},
		typingSpeed: 'variable',
		voiceTone: 'energetic'
	},
	helpful: {
		id: 'helpful',
		name: 'Helpful',
		description: 'Supportive, thorough, and solution-oriented',
		emoji: '🤝',
		traits: ['supportive', 'thorough', 'patient', 'detailed'],
		color: 'var(--color-primary)',
		responseStyle: {
			greeting: 'Hello! I\'m here to help you find the best solution.',
			thinking: 'Let me find the best way to help you...',
			error: 'I encountered an issue. Let me help you resolve it.',
			goodbye: 'I hope I was helpful! Don\'t hesitate to ask if you need more assistance.'
		},
		typingSpeed: 'moderate',
		voiceTone: 'supportive'
	},
	creative: {
		id: 'creative',
		name: 'Creative',
		description: 'Imaginative, artistic, and innovative',
		emoji: '🎨',
		traits: ['imaginative', 'artistic', 'innovative', 'expressive'],
		color: 'var(--color-warning)',
		responseStyle: {
			greeting: 'Welcome! Let\'s create something amazing together!',
			thinking: 'Brewing up some creative ideas...',
			error: 'Every mistake is a chance to try something new!',
			goodbye: 'Keep creating! The world needs your ideas!'
		},
		typingSpeed: 'variable',
		voiceTone: 'inspiring'
	},
	analytical: {
		id: 'analytical',
		name: 'Analytical',
		description: 'Logical, data-driven, and methodical',
		emoji: '📊',
		traits: ['logical', 'methodical', 'precise', 'data-driven'],
		color: 'var(--color-info)',
		responseStyle: {
			greeting: 'Greetings. Let\'s analyze your requirements.',
			thinking: 'Analyzing data and computing optimal solution...',
			error: 'Error detected. Initiating troubleshooting protocol.',
			goodbye: 'Analysis complete. Efficiency optimized.'
		},
		typingSpeed: 'consistent',
		voiceTone: 'monotone'
	}
};

// Default assistants with assigned personalities
const defaultAssistants = [
	{
		id: '1',
		name: 'Alex',
		avatar: '🤖',
		personality: 'friendly',
		status: 'online',
		description: 'Your friendly AI companion',
		capabilities: ['chat', 'code', 'creative', 'analysis'],
		languages: ['en', 'es', 'fr'],
		responseTime: 'fast',
		accuracy: 0.95,
		specialties: ['general', 'conversation', 'help']
	},
	{
		id: '2',
		name: 'Nova',
		avatar: '✨',
		personality: 'creative',
		status: 'online',
		description: 'Creative genius and idea generator',
		capabilities: ['creative', 'brainstorming', 'writing', 'design'],
		languages: ['en'],
		responseTime: 'moderate',
		accuracy: 0.92,
		specialties: ['creative writing', 'ideation', 'design']
	},
	{
		id: '3',
		name: 'Data',
		avatar: '📈',
		personality: 'analytical',
		status: 'online',
		description: 'Data analysis and insights expert',
		capabilities: ['analysis', 'data', 'statistics', 'reports'],
		languages: ['en', 'de'],
		responseTime: 'fast',
		accuracy: 0.98,
		specialties: ['data analysis', 'statistics', 'research']
	},
	{
		id: '4',
		name: 'Pro',
		avatar: '💻',
		personality: 'professional',
		status: 'online',
		description: 'Professional business assistant',
		capabilities: ['business', 'documents', 'email', 'planning'],
		languages: ['en', 'ja', 'zh'],
		responseTime: 'very fast',
		accuracy: 0.97,
		specialties: ['business', 'productivity', 'documentation']
	}
];

// Create stores
function createAssistantsStore() {
	const { subscribe, set, update } = writable(defaultAssistants);
	
	// Load from localStorage if available
	if (browser) {
		const stored = localStorage.getItem('assistants');
		if (stored) {
			try {
				set(JSON.parse(stored));
			} catch (e) {
				console.error('Failed to load assistants from storage:', e);
			}
		}
	}
	
	return {
		subscribe,
		
		// Add a new assistant
		add: (assistant) => update(assistants => {
			const newAssistant = {
				id: Date.now().toString(),
				status: 'online',
				capabilities: [],
				languages: ['en'],
				responseTime: 'moderate',
				accuracy: 0.9,
				specialties: [],
				...assistant
			};
			const updated = [...assistants, newAssistant];
			if (browser) {
				localStorage.setItem('assistants', JSON.stringify(updated));
			}
			return updated;
		}),
		
		// Update an assistant
		update: (id, updates) => update(assistants => {
			const updated = assistants.map(a => 
				a.id === id ? { ...a, ...updates } : a
			);
			if (browser) {
				localStorage.setItem('assistants', JSON.stringify(updated));
			}
			return updated;
		}),
		
		// Remove an assistant
		remove: (id) => update(assistants => {
			const updated = assistants.filter(a => a.id !== id);
			if (browser) {
				localStorage.setItem('assistants', JSON.stringify(updated));
			}
			return updated;
		}),
		
		// Set assistant status
		setStatus: (id, status) => update(assistants => {
			const updated = assistants.map(a => 
				a.id === id ? { ...a, status } : a
			);
			if (browser) {
				localStorage.setItem('assistants', JSON.stringify(updated));
			}
			return updated;
		}),
		
		// Reset to defaults
		reset: () => {
			set(defaultAssistants);
			if (browser) {
				localStorage.setItem('assistants', JSON.stringify(defaultAssistants));
			}
		}
	};
}

// Create active assistant store
function createActiveAssistantStore() {
	const { subscribe, set } = writable(null);
	
	// Load from localStorage if available
	if (browser) {
		const storedId = localStorage.getItem('activeAssistantId');
		if (storedId) {
			// Will be set by derived store
		}
	}
	
	return {
		subscribe,
		set: (assistant) => {
			set(assistant);
			if (browser && assistant) {
				localStorage.setItem('activeAssistantId', assistant.id);
			}
		},
		clear: () => {
			set(null);
			if (browser) {
				localStorage.removeItem('activeAssistantId');
			}
		}
	};
}

// Export stores
export const assistants = createAssistantsStore();
export const activeAssistant = createActiveAssistantStore();

// Derived store for active assistant with full personality data
export const activeAssistantWithPersonality = derived(
	[activeAssistant, assistants],
	([$activeAssistant, $assistants]) => {
		if (!$activeAssistant) {
			// Set default if none active
			const defaultAssistant = $assistants[0];
			if (defaultAssistant) {
				activeAssistant.set(defaultAssistant);
				return {
					...defaultAssistant,
					personality: personalities[defaultAssistant.personality] || personalities.friendly
				};
			}
			return null;
		}
		
		return {
			...$activeAssistant,
			personality: personalities[$activeAssistant.personality] || personalities.friendly
		};
	}
);

// Helper functions
export function getPersonalityById(id) {
	return personalities[id] || personalities.friendly;
}

export function getAssistantsByPersonality(personalityId) {
	let allAssistants = [];
	assistants.subscribe(value => allAssistants = value)();
	return allAssistants.filter(a => a.personality === personalityId);
}

export function getAssistantsByStatus(status) {
	let allAssistants = [];
	assistants.subscribe(value => allAssistants = value)();
	return allAssistants.filter(a => a.status === status);
}

// Personality-based response generator
export function generateResponse(personalityId, responseType = 'greeting') {
	const personality = personalities[personalityId] || personalities.friendly;
	return personality.responseStyle[responseType] || 'Hello!';
}

// Typing animation settings based on personality
export function getTypingSettings(personalityId) {
	const personality = personalities[personalityId] || personalities.friendly;
	
	const settings = {
		normal: { speed: 50, variance: 10 },
		fast: { speed: 30, variance: 5 },
		slow: { speed: 70, variance: 15 },
		variable: { speed: 50, variance: 30 },
		consistent: { speed: 40, variance: 0 },
		moderate: { speed: 60, variance: 10 }
	};
	
	return settings[personality.typingSpeed] || settings.normal;
}

// Export personality list for UI
export const personalityList = Object.values(personalities);