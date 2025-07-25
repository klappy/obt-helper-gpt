/**
 * Haptic Feedback Utilities
 * Provides cross-platform haptic feedback for mobile devices
 * Falls back gracefully on unsupported devices
 */

// Check if haptic feedback is supported
export const isHapticSupported = () => {
	// Check for Vibration API
	if ('vibrate' in navigator) return true;
	
	// Check for iOS Haptic Feedback (via webkit)
	if (window.webkit?.messageHandlers?.haptic) return true;
	
	// Check for Android Chrome specific haptics
	if (window.navigator?.userAgent?.includes('Android') && 'vibrate' in navigator) return true;
	
	return false;
};

// Haptic patterns for different interactions
const patterns = {
	// Light tap - for button presses, selections
	light: [10],
	
	// Medium tap - for toggles, confirmations
	medium: [20],
	
	// Heavy tap - for important actions, errors
	heavy: [30],
	
	// Success pattern - short burst for positive feedback
	success: [10, 50, 10],
	
	// Warning pattern - double tap for attention
	warning: [20, 100, 20],
	
	// Error pattern - triple tap for errors
	error: [30, 100, 30, 100, 30],
	
	// Notification pattern - gentle double tap
	notification: [10, 100, 10],
	
	// Selection pattern - very light tap
	selection: [5],
	
	// Long press pattern - continuous gentle vibration
	longPress: [200],
	
	// Swipe pattern - quick light tap
	swipe: [8],
	
	// Impact patterns (iOS style)
	impactLight: [10],
	impactMedium: [15],
	impactHeavy: [20],
	
	// Custom patterns
	custom: {
		messageReceived: [10, 50, 10, 50, 10],
		messageSent: [5, 30, 5],
		typing: [3],
		recording: [5, 95], // Repeating pattern
		delete: [20, 50, 30],
		refresh: [10, 40, 10, 40, 10]
	}
};

// Main haptic feedback function
export const haptic = (pattern = 'light', options = {}) => {
	// Check if haptics are enabled in user preferences
	if (options.respectUserPreference !== false) {
		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReducedMotion) return;
		
		// Check if user has disabled haptics (would be stored in localStorage)
		const hapticsDisabled = localStorage.getItem('haptics-disabled') === 'true';
		if (hapticsDisabled) return;
	}
	
	// Get the vibration pattern
	let vibrationPattern;
	if (typeof pattern === 'string') {
		vibrationPattern = patterns[pattern] || patterns.light;
	} else if (Array.isArray(pattern)) {
		vibrationPattern = pattern;
	} else {
		vibrationPattern = patterns.light;
	}
	
	// Try to vibrate
	try {
		if ('vibrate' in navigator) {
			navigator.vibrate(vibrationPattern);
		} else if (window.webkit?.messageHandlers?.haptic) {
			// iOS WebKit haptic feedback
			window.webkit.messageHandlers.haptic.postMessage({
				type: pattern,
				intensity: options.intensity || 1
			});
		}
	} catch (error) {
		console.warn('Haptic feedback failed:', error);
	}
};

// Specific haptic feedback functions for common interactions
export const haptics = {
	// UI interactions
	tap: () => haptic('light'),
	press: () => haptic('medium'),
	longPress: () => haptic('longPress'),
	forcePress: () => haptic('heavy'),
	
	// Navigation
	swipeLeft: () => haptic('swipe'),
	swipeRight: () => haptic('swipe'),
	swipeUp: () => haptic('swipe'),
	swipeDown: () => haptic('swipe'),
	
	// Feedback
	success: () => haptic('success'),
	warning: () => haptic('warning'),
	error: () => haptic('error'),
	notification: () => haptic('notification'),
	
	// Selection
	select: () => haptic('selection'),
	deselect: () => haptic('selection'),
	toggle: () => haptic('medium'),
	
	// Messaging
	messageReceived: () => haptic('custom.messageReceived'),
	messageSent: () => haptic('custom.messageSent'),
	typing: () => haptic('custom.typing'),
	
	// Media
	recordStart: () => haptic('medium'),
	recordStop: () => haptic('medium'),
	recordPulse: () => haptic('custom.recording'),
	
	// Actions
	delete: () => haptic('custom.delete'),
	refresh: () => haptic('custom.refresh'),
	
	// Impact (iOS style)
	impactLight: () => haptic('impactLight'),
	impactMedium: () => haptic('impactMedium'),
	impactHeavy: () => haptic('impactHeavy'),
	
	// Custom pattern
	custom: (pattern) => haptic(pattern)
};

// Continuous haptic feedback (for dragging, scrolling, etc.)
export class ContinuousHaptic {
	constructor(pattern = [5, 95], maxDuration = 5000) {
		this.pattern = pattern;
		this.maxDuration = maxDuration;
		this.isRunning = false;
		this.startTime = null;
		this.intervalId = null;
	}
	
	start() {
		if (this.isRunning || !isHapticSupported()) return;
		
		this.isRunning = true;
		this.startTime = Date.now();
		
		const vibrate = () => {
			if (!this.isRunning) return;
			
			// Check max duration
			if (Date.now() - this.startTime > this.maxDuration) {
				this.stop();
				return;
			}
			
			haptic(this.pattern);
		};
		
		// Start immediately
		vibrate();
		
		// Continue vibrating
		const totalPatternDuration = this.pattern.reduce((a, b) => a + b, 0);
		this.intervalId = setInterval(vibrate, totalPatternDuration);
	}
	
	stop() {
		this.isRunning = false;
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		// Stop any ongoing vibration
		if ('vibrate' in navigator) {
			navigator.vibrate(0);
		}
	}
}

// React to system events with haptic feedback
export const initHapticListeners = (options = {}) => {
	if (!isHapticSupported()) return;
	
	const elements = options.elements || document.querySelectorAll('button, a, input[type="checkbox"], input[type="radio"]');
	
	elements.forEach(element => {
		// Remove existing listeners to prevent duplicates
		element.removeEventListener('touchstart', handleTouchStart);
		element.removeEventListener('touchend', handleTouchEnd);
		
		// Add new listeners
		element.addEventListener('touchstart', handleTouchStart, { passive: true });
		element.addEventListener('touchend', handleTouchEnd, { passive: true });
	});
	
	function handleTouchStart(event) {
		const element = event.currentTarget;
		element.dataset.touchStartTime = Date.now();
		
		// Long press detection
		element.dataset.longPressTimeout = setTimeout(() => {
			haptics.longPress();
			element.dataset.didLongPress = 'true';
		}, 500);
	}
	
	function handleTouchEnd(event) {
		const element = event.currentTarget;
		const touchDuration = Date.now() - parseInt(element.dataset.touchStartTime || 0);
		
		// Clear long press timeout
		clearTimeout(element.dataset.longPressTimeout);
		
		// Skip if long press was triggered
		if (element.dataset.didLongPress === 'true') {
			delete element.dataset.didLongPress;
			return;
		}
		
		// Determine haptic feedback based on element type and duration
		if (element.tagName === 'BUTTON' || element.tagName === 'A') {
			haptics.tap();
		} else if (element.type === 'checkbox' || element.type === 'radio') {
			haptics.toggle();
		}
	}
	
	// Return cleanup function
	return () => {
		elements.forEach(element => {
			element.removeEventListener('touchstart', handleTouchStart);
			element.removeEventListener('touchend', handleTouchEnd);
		});
	};
};

// Svelte action for haptic feedback
export const hapticAction = (node, options = {}) => {
	const type = options.type || 'tap';
	const event = options.event || 'click';
	
	const handler = () => {
		if (typeof type === 'function') {
			type();
		} else {
			haptic(type, options);
		}
	};
	
	node.addEventListener(event, handler);
	
	return {
		update(newOptions) {
			options = newOptions;
		},
		destroy() {
			node.removeEventListener(event, handler);
		}
	};
};

// Utility to check and request vibration permission (for iOS)
export const requestHapticPermission = async () => {
	if (!isHapticSupported()) {
		return { granted: false, reason: 'not-supported' };
	}
	
	// iOS requires user interaction to enable haptics
	if (window.DeviceMotionEvent?.requestPermission) {
		try {
			const permission = await DeviceMotionEvent.requestPermission();
			return { granted: permission === 'granted', reason: permission };
		} catch (error) {
			return { granted: false, reason: 'error', error };
		}
	}
	
	// For other platforms, haptics are generally available
	return { granted: true, reason: 'available' };
};

// Store user preference
export const setHapticPreference = (enabled) => {
	localStorage.setItem('haptics-disabled', enabled ? 'false' : 'true');
};

export const getHapticPreference = () => {
	return localStorage.getItem('haptics-disabled') !== 'true';
};

// Default export
export default haptics;