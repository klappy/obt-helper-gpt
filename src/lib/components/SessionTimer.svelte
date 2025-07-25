<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	
	export let startTime: Date | null = null;
	export let pauseTime: Date | null = null;
	export let format: 'minimal' | 'detailed' | 'compact' = 'compact';
	export let showMilliseconds = false;
	export let showIcon = true;
	export let autoStart = true;
	export let warnAfter = 30 * 60 * 1000; // 30 minutes
	export let alertAfter = 60 * 60 * 1000; // 60 minutes
	
	let elapsed = 0;
	let isRunning = false;
	let isPaused = false;
	let updateInterval: number;
	let sessionSegments: Array<{ start: Date; end: Date | null }> = [];
	
	// Animated progress for visual feedback
	const progress = tweened(0, {
		duration: 300,
		easing: cubicOut
	});
	
	// Timer state
	$: timerState = (() => {
		if (!isRunning && elapsed === 0) return 'idle';
		if (isPaused) return 'paused';
		if (elapsed >= alertAfter) return 'alert';
		if (elapsed >= warnAfter) return 'warning';
		return 'active';
	})();
	
	// State colors
	const stateColors = {
		idle: 'var(--text-tertiary)',
		active: 'var(--color-primary)',
		paused: 'var(--color-secondary)',
		warning: 'var(--color-warning)',
		alert: 'var(--color-error)'
	};
	
	// Format time display
	function formatTime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		const milliseconds = Math.floor((ms % 1000) / 10); // Show centiseconds
		
		if (format === 'minimal') {
			if (hours > 0) {
				return `${hours}:${minutes.toString().padStart(2, '0')}`;
			}
			return `${minutes}:${seconds.toString().padStart(2, '0')}`;
		}
		
		if (format === 'detailed') {
			const parts = [];
			if (hours > 0) parts.push(`${hours}h`);
			if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
			parts.push(`${seconds}s`);
			if (showMilliseconds) parts.push(`${milliseconds.toString().padStart(2, '0')}ms`);
			return parts.join(' ');
		}
		
		// Compact format (default)
		let timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		if (showMilliseconds) {
			timeStr += `.${milliseconds.toString().padStart(2, '0')}`;
		}
		return timeStr;
	}
	
	// Calculate total elapsed time including pauses
	function calculateElapsed(): number {
		let total = 0;
		
		for (const segment of sessionSegments) {
			const end = segment.end || new Date();
			total += end.getTime() - segment.start.getTime();
		}
		
		if (isRunning && !isPaused && startTime) {
			total += Date.now() - startTime.getTime();
		}
		
		return total;
	}
	
	// Update timer
	function updateTimer() {
		if (isRunning && !isPaused) {
			elapsed = calculateElapsed();
			
			// Update progress bar
			if (alertAfter > 0) {
				$progress = Math.min((elapsed / alertAfter) * 100, 100);
			}
		}
	}
	
	// Timer controls
	export function start() {
		if (!isRunning) {
			startTime = new Date();
			isRunning = true;
			isPaused = false;
			sessionSegments = [];
		} else if (isPaused) {
			// Resume from pause
			startTime = new Date();
			isPaused = false;
		}
	}
	
	export function pause() {
		if (isRunning && !isPaused) {
			isPaused = true;
			pauseTime = new Date();
			
			// Save current segment
			if (startTime) {
				sessionSegments.push({
					start: startTime,
					end: pauseTime
				});
			}
		}
	}
	
	export function stop() {
		if (isRunning) {
			if (!isPaused && startTime) {
				sessionSegments.push({
					start: startTime,
					end: new Date()
				});
			}
			
			isRunning = false;
			isPaused = false;
			startTime = null;
			pauseTime = null;
		}
	}
	
	export function reset() {
		stop();
		elapsed = 0;
		sessionSegments = [];
		$progress = 0;
	}
	
	export function toggle() {
		if (!isRunning) {
			start();
		} else if (isPaused) {
			start(); // Resume
		} else {
			pause();
		}
	}
	
	// Get session statistics
	export function getStats() {
		const activeDuration = elapsed;
		const totalDuration = startTime ? Date.now() - startTime.getTime() : 0;
		const pauseDuration = totalDuration - activeDuration;
		const pauseCount = sessionSegments.length;
		
		return {
			activeDuration,
			totalDuration,
			pauseDuration,
			pauseCount,
			averageSegmentDuration: pauseCount > 0 ? activeDuration / pauseCount : activeDuration
		};
	}
	
	// Lifecycle
	onMount(() => {
		if (autoStart && !isRunning) {
			start();
		}
		
		updateInterval = setInterval(updateTimer, showMilliseconds ? 10 : 100) as unknown as number;
	});
	
	onDestroy(() => {
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	});
	
	// Icons for different states
	const stateIcons = {
		idle: '⏱️',
		active: '⏱️',
		paused: '⏸️',
		warning: '⚠️',
		alert: '🚨'
	};
</script>

<div 
	class="session-timer session-timer-{format} session-timer-{timerState}"
	style="--state-color: {stateColors[timerState]}"
>
	{#if format === 'minimal'}
		<span class="timer-minimal">
			{#if showIcon}
				<span class="timer-icon">{stateIcons[timerState]}</span>
			{/if}
			<span class="timer-value">{formatTime(elapsed)}</span>
		</span>
		
	{:else if format === 'compact'}
		<div class="timer-compact">
			<div class="timer-display">
				{#if showIcon}
					<span class="timer-icon">{stateIcons[timerState]}</span>
				{/if}
				<span class="timer-value">{formatTime(elapsed)}</span>
			</div>
			{#if timerState === 'warning' || timerState === 'alert'}
				<div class="timer-alert">
					{timerState === 'warning' ? 'Long session' : 'Very long session'}
				</div>
			{/if}
		</div>
		
	{:else}
		<div class="timer-detailed">
			<div class="timer-header">
				<h4 class="timer-title">Session Duration</h4>
				<div class="timer-controls">
					<button
						class="control-button"
						on:click={toggle}
						aria-label={isPaused ? 'Resume timer' : isRunning ? 'Pause timer' : 'Start timer'}
					>
						{#if !isRunning}
							▶️
						{:else if isPaused}
							▶️
						{:else}
							⏸️
						{/if}
					</button>
					<button
						class="control-button"
						on:click={stop}
						disabled={!isRunning}
						aria-label="Stop timer"
					>
						⏹️
					</button>
					<button
						class="control-button"
						on:click={reset}
						aria-label="Reset timer"
					>
						🔄
					</button>
				</div>
			</div>
			
			<div class="timer-main">
				<div class="timer-display-large">
					<span class="timer-value-large">{formatTime(elapsed)}</span>
					{#if timerState === 'paused'}
						<span class="timer-status">Paused</span>
					{/if}
				</div>
				
				{#if alertAfter > 0}
					<div class="timer-progress">
						<div class="progress-bar">
							<div 
								class="progress-fill"
								style="width: {$progress}%"
							/>
						</div>
						<div class="progress-labels">
							<span class="progress-start">0</span>
							{#if warnAfter > 0 && warnAfter < alertAfter}
								<span 
									class="progress-marker"
									style="left: {(warnAfter / alertAfter) * 100}%"
								>
									{formatTime(warnAfter)}
								</span>
							{/if}
							<span class="progress-end">{formatTime(alertAfter)}</span>
						</div>
					</div>
				{/if}
			</div>
			
			{#if sessionSegments.length > 0}
				<div class="timer-stats">
					<div class="stat-item">
						<span class="stat-label">Active</span>
						<span class="stat-value">{formatTime(elapsed)}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Pauses</span>
						<span class="stat-value">{sessionSegments.length}</span>
					</div>
					{#if isPaused && pauseTime}
						<div class="stat-item">
							<span class="stat-label">Paused for</span>
							<span class="stat-value">{formatTime(Date.now() - pauseTime.getTime())}</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.session-timer {
		font-family: var(--font-sans);
		color: var(--text-primary);
	}
	
	/* Minimal format */
	.timer-minimal {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: var(--text-sm);
	}
	
	.timer-icon {
		font-size: 14px;
		opacity: 0.8;
	}
	
	.timer-value {
		font-variant-numeric: tabular-nums;
		font-weight: 500;
		color: var(--state-color);
		letter-spacing: 0.02em;
	}
	
	/* Compact format */
	.timer-compact {
		display: inline-flex;
		flex-direction: column;
		gap: 2px;
	}
	
	.timer-display {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}
	
	.timer-alert {
		font-size: var(--text-xs);
		color: var(--state-color);
		text-align: center;
		font-weight: 500;
		padding: 0 var(--spacing-sm);
	}
	
	/* Detailed format */
	.timer-detailed {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background: var(--surface-base);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
		box-shadow: var(--shadow-subtle);
		min-width: 280px;
	}
	
	.timer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.timer-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}
	
	.timer-controls {
		display: flex;
		gap: var(--spacing-xs);
	}
	
	.control-button {
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		transition: all var(--animation-quick);
	}
	
	.control-button:hover:not(:disabled) {
		background: var(--surface-hover);
		color: var(--text-primary);
		transform: scale(1.05);
	}
	
	.control-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.timer-main {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}
	
	.timer-display-large {
		text-align: center;
		position: relative;
	}
	
	.timer-value-large {
		font-size: var(--text-2xl);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--state-color);
		letter-spacing: 0.02em;
	}
	
	.timer-status {
		position: absolute;
		top: -16px;
		right: 0;
		font-size: var(--text-xs);
		color: var(--text-secondary);
		background: var(--surface-subtle);
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.timer-progress {
		position: relative;
		margin-top: var(--spacing-xs);
	}
	
	.progress-bar {
		height: 6px;
		background: var(--surface-raised);
		border-radius: 3px;
		overflow: hidden;
		position: relative;
	}
	
	.progress-fill {
		height: 100%;
		background: var(--state-color);
		transition: width var(--animation-smooth), background-color var(--animation-smooth);
		border-radius: 3px;
	}
	
	.progress-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 4px;
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		position: relative;
	}
	
	.progress-marker {
		position: absolute;
		transform: translateX(-50%);
		color: var(--color-warning);
		font-weight: 500;
	}
	
	.timer-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
	}
	
	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}
	
	.stat-label {
		font-size: var(--text-xs);
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.stat-value {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
	
	/* State-specific styles */
	.session-timer-paused .timer-value,
	.session-timer-paused .timer-value-large {
		opacity: 0.7;
	}
	
	.session-timer-warning .timer-display,
	.session-timer-alert .timer-display {
		animation: pulse-border 2s ease-in-out infinite;
		border-color: var(--state-color);
	}
	
	@keyframes pulse-border {
		0%, 100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}
	
	/* Dark mode */
	:global(.dark) .timer-display {
		background: var(--surface-raised);
	}
	
	:global(.dark) .timer-detailed {
		background: var(--surface-raised);
	}
	
	:global(.dark) .control-button {
		background: var(--surface-elevated);
	}
	
	:global(.dark) .timer-stats {
		background: var(--surface-elevated);
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.timer-detailed {
			min-width: 240px;
		}
		
		.timer-value-large {
			font-size: var(--text-xl);
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.progress-fill {
			transition: none;
		}
		
		.session-timer-warning .timer-display,
		.session-timer-alert .timer-display {
			animation: none;
			border-color: var(--state-color);
			border-width: 2px;
		}
	}
	
	/* High contrast */
	@media (prefers-contrast: high) {
		.progress-bar {
			border: 1px solid currentColor;
		}
		
		.timer-display {
			border-width: 2px;
		}
	}
</style>