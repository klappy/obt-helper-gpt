<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';
	import { FloatingCard } from './ui/index.js';
	
	export let assistant = {
		id: '1',
		name: 'Helper',
		avatar: '🤖',
		status: 'online' as 'online' | 'busy' | 'offline',
		personality: 'friendly',
		description: 'Your AI assistant'
	};
	export let position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right';
	export let minimized = false;
	export let showTimer = true;
	export let showCost = true;
	export let draggable = true;
	export let swipeable = true;
	
	const dispatch = createEventDispatcher();
	
	// Spring stores for smooth animations
	const coords = spring({ x: 0, y: 0 }, { stiffness: 0.2, damping: 0.4 });
	const rotation = spring(0, { stiffness: 0.1, damping: 0.3 });
	const scale = spring(1, { stiffness: 0.3, damping: 0.5 });
	
	let cardElement: HTMLElement;
	let isDragging = false;
	let dragStart = { x: 0, y: 0 };
	let originalPosition = { x: 0, y: 0 };
	let swipeThreshold = 100;
	let hasInteracted = false;
	
	// Position offsets
	const positions = {
		'top-left': { x: 20, y: 20 },
		'top-right': { x: -20, y: 20 },
		'bottom-left': { x: 20, y: -20 },
		'bottom-right': { x: -20, y: -20 }
	};
	
	// Initialize position
	function setInitialPosition() {
		const pos = positions[position];
		if (position.includes('right')) {
			$coords.x = window.innerWidth + pos.x - (minimized ? 60 : 280);
		} else {
			$coords.x = pos.x;
		}
		
		if (position.includes('bottom')) {
			$coords.y = window.innerHeight + pos.y - (minimized ? 60 : 120);
		} else {
			$coords.y = pos.y;
		}
	}
	
	// Drag handling
	function handleDragStart(event: MouseEvent | TouchEvent) {
		if (!draggable) return;
		
		isDragging = true;
		hasInteracted = true;
		const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
		const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		
		dragStart = { x: clientX - $coords.x, y: clientY - $coords.y };
		originalPosition = { x: $coords.x, y: $coords.y };
		$scale = 0.95;
		
		// Add global listeners
		if ('touches' in event) {
			window.addEventListener('touchmove', handleDragMove, { passive: false });
			window.addEventListener('touchend', handleDragEnd);
		} else {
			window.addEventListener('mousemove', handleDragMove);
			window.addEventListener('mouseup', handleDragEnd);
		}
	}
	
	function handleDragMove(event: MouseEvent | TouchEvent) {
		if (!isDragging) return;
		
		event.preventDefault();
		const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
		const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		
		$coords.x = clientX - dragStart.x;
		$coords.y = clientY - dragStart.y;
		
		// Calculate rotation based on drag velocity
		if (swipeable) {
			const deltaX = $coords.x - originalPosition.x;
			$rotation = Math.max(-30, Math.min(30, deltaX * 0.1));
		}
	}
	
	function handleDragEnd(event: MouseEvent | TouchEvent) {
		if (!isDragging) return;
		
		isDragging = false;
		$scale = 1;
		
		// Remove global listeners
		window.removeEventListener('mousemove', handleDragMove);
		window.removeEventListener('mouseup', handleDragEnd);
		window.removeEventListener('touchmove', handleDragMove);
		window.removeEventListener('touchend', handleDragEnd);
		
		// Check for swipe
		if (swipeable) {
			const deltaX = $coords.x - originalPosition.x;
			const deltaY = $coords.y - originalPosition.y;
			
			if (Math.abs(deltaX) > swipeThreshold) {
				// Swipe detected
				const direction = deltaX > 0 ? 'right' : 'left';
				dispatch('swipe', { direction, assistant });
				
				// Animate off screen
				$coords.x = deltaX > 0 ? window.innerWidth + 100 : -300;
				$rotation = deltaX > 0 ? 45 : -45;
				
				// Reset after animation
				setTimeout(() => {
					setInitialPosition();
					$rotation = 0;
				}, 300);
			} else {
				// Snap back to edge
				snapToEdge();
				$rotation = 0;
			}
		} else {
			// Just snap to edge
			snapToEdge();
		}
	}
	
	// Snap to nearest edge
	function snapToEdge() {
		const centerX = $coords.x + (minimized ? 30 : 140);
		const centerY = $coords.y + (minimized ? 30 : 60);
		
		const leftDistance = centerX;
		const rightDistance = window.innerWidth - centerX;
		const topDistance = centerY;
		const bottomDistance = window.innerHeight - centerY;
		
		// Find closest edge
		if (leftDistance < rightDistance) {
			$coords.x = 20;
		} else {
			$coords.x = window.innerWidth - (minimized ? 60 : 280) - 20;
		}
		
		// Keep within vertical bounds
		$coords.y = Math.max(20, Math.min($coords.y, window.innerHeight - (minimized ? 60 : 120) - 20));
	}
	
	// Toggle minimized state
	function toggleMinimized() {
		minimized = !minimized;
		dispatch('toggle', { minimized });
		
		// Adjust position when toggling
		if (hasInteracted) {
			snapToEdge();
		}
	}
	
	// Handle window resize
	function handleResize() {
		if (!hasInteracted) {
			setInitialPosition();
		} else {
			snapToEdge();
		}
	}
	
	// Status indicators
	const statusColors = {
		online: 'var(--color-success)',
		busy: 'var(--color-warning)',
		offline: 'var(--text-tertiary)'
	};
	
	const personalityEmojis = {
		friendly: '😊',
		professional: '💼',
		playful: '🎮',
		helpful: '🤝',
		creative: '🎨',
		analytical: '📊'
	};
	
	onMount(() => {
		setInitialPosition();
		window.addEventListener('resize', handleResize);
	});
	
	onDestroy(() => {
		window.removeEventListener('resize', handleResize);
		window.removeEventListener('mousemove', handleDragMove);
		window.removeEventListener('mouseup', handleDragEnd);
		window.removeEventListener('touchmove', handleDragMove);
		window.removeEventListener('touchend', handleDragEnd);
	});
</script>

<div
	bind:this={cardElement}
	class="assistant-presence"
	class:minimized
	class:dragging={isDragging}
	style="
		transform: translate3d({$coords.x}px, {$coords.y}px, 0) rotate({$rotation}deg) scale({$scale});
		position: fixed;
		z-index: 1000;
	"
	on:mousedown={handleDragStart}
	on:touchstart={handleDragStart}
	role="complementary"
	aria-label="Assistant: {assistant.name}"
>
	<FloatingCard 
		depth={isDragging ? 5 : 4} 
		hover={!isDragging} 
		animate={false}
		padding={minimized ? 'sm' : 'md'}
	>
		{#if minimized}
			<!-- Minimized view -->
			<button
				class="minimized-content"
				on:click={toggleMinimized}
				aria-label="Expand assistant card"
			>
				<div class="avatar-small">
					{assistant.avatar}
				</div>
				<div 
					class="status-dot"
					style="background-color: {statusColors[assistant.status]}"
					aria-label="Status: {assistant.status}"
				/>
			</button>
		{:else}
			<!-- Expanded view -->
			<div class="expanded-content" transition:fade={{ duration: 200 }}>
				<div class="header">
					<div class="avatar-container">
						<div class="avatar">
							{assistant.avatar}
						</div>
						<div 
							class="status-indicator"
							style="background-color: {statusColors[assistant.status]}"
						/>
					</div>
					<div class="info">
						<h3 class="name">{assistant.name}</h3>
						<p class="description">{assistant.description}</p>
					</div>
					<button
						class="minimize-button"
						on:click={toggleMinimized}
						aria-label="Minimize assistant card"
					>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
							<path d="M4 8h8v1H4z"/>
						</svg>
					</button>
				</div>
				
				<div class="personality">
					<span class="personality-emoji">
						{personalityEmojis[assistant.personality] || '🤖'}
					</span>
					<span class="personality-label">{assistant.personality}</span>
				</div>
				
				{#if showTimer || showCost}
					<div class="metrics">
						{#if showTimer}
							<div class="metric">
								<span class="metric-icon">⏱️</span>
								<span class="metric-value">
									<slot name="timer">0:00</slot>
								</span>
							</div>
						{/if}
						{#if showCost}
							<div class="metric">
								<span class="metric-icon">💰</span>
								<span class="metric-value">
									<slot name="cost">$0.00</slot>
								</span>
							</div>
						{/if}
					</div>
				{/if}
				
				<div class="actions">
					<slot name="actions">
						<button 
							class="action-button"
							on:click={() => dispatch('action', { type: 'settings' })}
							aria-label="Assistant settings"
						>
							⚙️
						</button>
						<button 
							class="action-button"
							on:click={() => dispatch('action', { type: 'switch' })}
							aria-label="Switch assistant"
						>
							🔄
						</button>
					</slot>
				</div>
			</div>
		{/if}
	</FloatingCard>
</div>

<style>
	.assistant-presence {
		position: fixed;
		cursor: move;
		user-select: none;
		touch-action: none;
		transition: transform var(--animation-spring);
		will-change: transform;
	}
	
	.assistant-presence.dragging {
		cursor: grabbing;
		transition: none;
	}
	
	/* Minimized state */
	.minimized-content {
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		width: 48px;
		height: 48px;
		border: none;
		background: none;
		cursor: pointer;
		padding: 0;
	}
	
	.avatar-small {
		font-size: 24px;
		line-height: 1;
	}
	
	.status-dot {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid var(--surface-base);
	}
	
	/* Expanded state */
	.expanded-content {
		width: 240px;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}
	
	.header {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
	}
	
	.avatar-container {
		position: relative;
		flex-shrink: 0;
	}
	
	.avatar {
		width: 48px;
		height: 48px;
		background: var(--surface-subtle);
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
	}
	
	.status-indicator {
		position: absolute;
		bottom: -2px;
		right: -2px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 3px solid var(--surface-base);
	}
	
	.info {
		flex: 1;
		min-width: 0;
	}
	
	.name {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.description {
		font-size: var(--text-xs);
		color: var(--text-secondary);
		margin: 2px 0 0 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.minimize-button {
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--animation-quick);
		flex-shrink: 0;
	}
	
	.minimize-button:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
	}
	
	.personality {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
	}
	
	.personality-emoji {
		font-size: 16px;
	}
	
	.personality-label {
		color: var(--text-secondary);
		text-transform: capitalize;
	}
	
	.metrics {
		display: flex;
		gap: var(--spacing-md);
		padding: var(--spacing-xs) 0;
	}
	
	.metric {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: var(--text-sm);
	}
	
	.metric-icon {
		font-size: 14px;
		opacity: 0.7;
	}
	
	.metric-value {
		color: var(--text-primary);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
	
	.actions {
		display: flex;
		gap: var(--spacing-xs);
		margin-top: var(--spacing-xs);
	}
	
	.action-button {
		flex: 1;
		padding: var(--spacing-xs);
		border: none;
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 16px;
		transition: all var(--animation-quick);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.action-button:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
		transform: scale(1.05);
	}
	
	/* Dark mode */
	:global(.dark) .avatar {
		background: var(--surface-raised);
	}
	
	:global(.dark) .minimize-button {
		background: var(--surface-raised);
	}
	
	:global(.dark) .personality {
		background: var(--surface-raised);
	}
	
	:global(.dark) .action-button {
		background: var(--surface-raised);
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.expanded-content {
			width: 200px;
		}
		
		.description {
			display: none;
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.assistant-presence {
			transition: none !important;
		}
		
		.minimized-content,
		.expanded-content {
			transition: none !important;
		}
	}
	
	/* High contrast */
	@media (prefers-contrast: high) {
		.status-dot,
		.status-indicator {
			border-width: 3px;
			border-color: black;
		}
		
		:global(.dark) .status-dot,
		:global(.dark) .status-indicator {
			border-color: white;
		}
	}
</style>