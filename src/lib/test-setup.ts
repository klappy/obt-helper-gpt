import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Speech API for testing
Object.defineProperty(window, 'speechSynthesis', {
	writable: true,
	value: {
		speak: vi.fn(),
		cancel: vi.fn(),
		pause: vi.fn(),
		resume: vi.fn(),
		getVoices: vi.fn(() => []),
	}
});

Object.defineProperty(window, 'SpeechRecognition', {
	writable: true,
	value: vi.fn(() => ({
		start: vi.fn(),
		stop: vi.fn(),
		abort: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	}))
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
	writable: true,
	value: window.SpeechRecognition
}); 