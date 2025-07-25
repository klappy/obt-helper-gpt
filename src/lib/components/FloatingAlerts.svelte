<script>
	import { onMount, onDestroy } from 'svelte';
	import { spring, tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale, fly } from 'svelte/transition';
	import { FloatingCard } from './ui/index.js';
	import { createEventDispatcher } from 'svelte';
	
	export let position = 'top-right'; // 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center'
	export let maxAlerts = 5;
	export let autoDismiss = true;
	export let dismissTime = 5000;
	export let stackSpacing = 12;
	export let allowDragToDismiss = true;
	
	const dispatch = createEventDispatcher();
	
	// Alert types and their properties
	const alertTypes = {
		success: {
			icon: '✅',
			color: 'var(--color-success-base)',
			bgColor: 'var(--color-success-subtle)',
			defaultTitle: 'Success'
		},
		error: {
			icon: '❌',
			color: 'var(--color-error-base)',
			bgColor: 'var(--color-error-subtle)',
			defaultTitle: 'Error'
		},
		warning: {
			icon: '⚠️',
			color: 'var(--color-warning-base)',
			bgColor: 'var(--color-warning-subtle)',
			defaultTitle: 'Warning'
		},
		info: {
			icon: 'ℹ️',
			color: 'var(--color-primary-base)',
			bgColor: 'var(--color-primary-subtle)',
			defaultTitle: 'Information'
		},
		system: {
			icon: '🔧',
			color: 'var(--color-text-secondary)',
			bgColor: 'var(--color-background-tertiary)',
			defaultTitle: 'System'
		}
	};
	
	// Alert management
	let alerts = [];
	let nextId = 1;
	let container;
	
	// Animation springs for each alert
	const alertPositions = new Map();
	const alertOpacity = new Map();
	
	// Position styles based on prop
	$: positionStyles = {
		'top-left': { top: '1rem', left: '1rem', alignItems: 'flex-start' },
		'top-right': { top: '1rem', right: '1rem', alignItems: 'flex-end' },
		'bottom-left': { bottom: '1rem', left: '1rem', alignItems: 'flex-start' },
		'bottom-right': { bottom: '1rem', right: '1rem', alignItems: 'flex-end' },
		'top-center': { top: '1rem', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' },
		'bottom-center': { bottom: '1rem', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }
	};
	
	// Public API to add alerts
	export function addAlert(options) {
		const alert = {
			id: nextId++,
			type: options.type || 'info',
			title: options.title || alertTypes[options.type || 'info'].defaultTitle,
			message: options.message || '',
			actions: options.actions || [],
			persistent: options.persistent || false,
			timestamp: Date.now(),
			progress: tweened(100, { duration: dismissTime, easing: cubicOut }),
			dismissTimer: null,
			dragOffset: { x: 0, y: 0 },
			isDragging: false,
			dragX: spring(0, { stiffness: 0.2, damping: 0.7 }),
			dragOpacity: spring(1, { stiffness: 0.3, damping: 0.8 })
		};
		
		// Initialize animation values
		alertPositions.set(alert.id, spring(0, { stiffness: 0.2, damping: 0.7 }));
		alertOpacity.set(alert.id, spring(1, { stiffness: 0.3, damping: 0.8 }));
		
		// Add to alerts array (newest first)
		alerts = [alert, ...alerts];
		
		// Limit number of alerts
		if (alerts.length > maxAlerts) {
			const removed = alerts.slice(maxAlerts);
			alerts = alerts.slice(0, maxAlerts);
			removed.forEach(a => removeAlert(a.id, false));
		}
		
		// Start auto-dismiss timer if needed
		if (autoDismiss && !alert.persistent) {
			startDismissTimer(alert);
		}
		
		// Update positions
		updateAlertPositions();
		
		// Dispatch event
		dispatch('alertAdded', { alert });
		
		return alert.id;
	}
	
	// Remove an alert
	function removeAlert(id, animate = true) {
		const index = alerts.findIndex(a => a.id === id);
		if (index === -1) return;
		
		const alert = alerts[index];
		
		// Clear timer
		if (alert.dismissTimer) {
			clearTimeout(alert.dismissTimer);
		}
		
		if (animate) {
			// Animate out
			const opacity = alertOpacity.get(id);
			if (opacity) {
				opacity.set(0);
			}
			
			// Remove after animation
			setTimeout(() => {
				alerts = alerts.filter(a => a.id !== id);
				alertPositions.delete(id);
				alertOpacity.delete(id);
				updateAlertPositions();
			}, 300);
		} else {
			// Remove immediately
			alerts = alerts.filter(a => a.id !== id);
			alertPositions.delete(id);
			alertOpacity.delete(id);
			updateAlertPositions();
		}
		
		dispatch('alertRemoved', { id });
	}
	
	// Start auto-dismiss timer
	function startDismissTimer(alert) {
		alert.progress.set(0);
		alert.dismissTimer = setTimeout(() => {
			removeAlert(alert.id);
		}, dismissTime);
	}
	
	// Pause auto-dismiss on hover
	function pauseDismiss(alert) {
		if (alert.dismissTimer) {
			clearTimeout(alert.dismissTimer);
			alert.progress.set(alert.progress.get(), { duration: 0 });
		}
	}
	
	// Resume auto-dismiss
	function resumeDismiss(alert) {
		if (autoDismiss && !alert.persistent && !alert.isDragging) {
			const remaining = (alert.progress.get() / 100) * dismissTime;
			alert.progress.set(0, { duration: remaining });
			alert.dismissTimer = setTimeout(() => {
				removeAlert(alert.id);
			}, remaining);
		}
	}
	
	// Update alert positions for stacking
	function updateAlertPositions() {
		let offset = 0;
		alerts.forEach((alert, index) => {
			const pos = alertPositions.get(alert.id);
			if (pos) {
				pos.set(offset);
				// Calculate height of previous alerts + spacing
				const element = container?.querySelector(`[data-alert-id="${alert.id}"]`);
				if (element) {
					offset += element.offsetHeight + stackSpacing;
				}
			}
		});
	}
	
	// Handle drag to dismiss
	function startDrag(e, alert) {
		if (!allowDragToDismiss) return;
		
		alert.isDragging = true;
		alert.dragOffset.x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
		pauseDismiss(alert);
		
		window.addEventListener('mousemove', (e) => handleDrag(e, alert));
		window.addEventListener('mouseup', (e) => endDrag(e, alert));
		window.addEventListener('touchmove', (e) => handleDrag(e, alert));
		window.addEventListener('touchend', (e) => endDrag(e, alert));
	}
	
	function handleDrag(e, alert) {
		if (!alert.isDragging) return;
		
		const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
		const deltaX = x - alert.dragOffset.x;
		
		alert.dragX.set(deltaX);
		
		// Update opacity based on drag distance
		const opacity = Math.max(0, 1 - Math.abs(deltaX) / 200);
		alert.dragOpacity.set(opacity);
	}
	
	function endDrag(e, alert) {
		if (!alert.isDragging) return;
		
		alert.isDragging = false;
		
		// Remove event listeners
		window.removeEventListener('mousemove', handleDrag);
		window.removeEventListener('mouseup', endDrag);
		window.removeEventListener('touchmove', handleDrag);
		window.removeEventListener('touchend', endDrag);
		
		// Check if should dismiss
		if (Math.abs(alert.dragX.get()) > 100 || alert.dragOpacity.get() < 0.5) {
			removeAlert(alert.id);
		} else {
			// Snap back
			alert.dragX.set(0);
			alert.dragOpacity.set(1);
			resumeDismiss(alert);
		}
	}
	
	// Handle action clicks
	function handleAction(alert, action) {
		if (action.handler) {
			action.handler(alert);
		}
		if (action.dismiss !== false) {
			removeAlert(alert.id);
		}
	}
	
	// Update positions when container resizes
	let resizeObserver;
	onMount(() => {
		if (container) {
			resizeObserver = new ResizeObserver(() => {
				updateAlertPositions();
			});
			resizeObserver.observe(container);
		}
	});
	
	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
		// Clear all timers
		alerts.forEach(alert => {
			if (alert.dismissTimer) {
				clearTimeout(alert.dismissTimer);
			}
		});
	});
	
	// Reactive updates
	$: if (container && alerts.length > 0) {
		updateAlertPositions();
	}
</script>

<div 
	class="floating-alerts floating-alerts-{position}"
	style={Object.entries(positionStyles[position])
		.map(([key, value]) => `${key}: ${value}`)
		.join('; ')}
	bind:this={container}
>
	{#each alerts as alert (alert.id)}
		<div
			class="alert-wrapper"
			data-alert-id={alert.id}
			style="
				transform: translateY({position.includes('bottom') ? '-' : ''}{$alertPositions.get(alert.id) || 0}px) 
							translateX({$alert.dragX}px);
				opacity: {$alertOpacity.get(alert.id) * $alert.dragOpacity};
			"
			transition:scale={{ duration: 300, easing: cubicOut }}
			on:mouseenter={() => pauseDismiss(alert)}
			on:mouseleave={() => resumeDismiss(alert)}
		>
			<FloatingCard 
				depth={3} 
				hover={!alert.isDragging}
				class="alert-card alert-{alert.type}"
			>
				<div 
					class="alert-content"
					on:mousedown={(e) => startDrag(e, alert)}
					on:touchstart={(e) => startDrag(e, alert)}
				>
					<!-- Alert Icon -->
					<div 
						class="alert-icon"
						style="color: {alertTypes[alert.type].color}"
					>
						{alertTypes[alert.type].icon}
					</div>
					
					<!-- Alert Body -->
					<div class="alert-body">
						<h4 class="alert-title">{alert.title}</h4>
						{#if alert.message}
							<p class="alert-message">{alert.message}</p>
						{/if}
						
						{#if alert.actions.length > 0}
							<div class="alert-actions">
								{#each alert.actions as action}
									<button
										class="alert-action"
										class:primary={action.primary}
										on:click={() => handleAction(alert, action)}
									>
										{action.label}
									</button>
								{/each}
							</div>
						{/if}
					</div>
					
					<!-- Dismiss Button -->
					{#if !alert.persistent}
						<button
							class="alert-dismiss"
							on:click={() => removeAlert(alert.id)}
							aria-label="Dismiss alert"
						>
							×
						</button>
					{/if}
				</div>
				
				<!-- Progress Bar -->
				{#if autoDismiss && !alert.persistent}
					<div class="alert-progress">
						<div 
							class="alert-progress-bar"
							style="
								width: {$alert.progress}%;
								background-color: {alertTypes[alert.type].color};
							"
						/>
					</div>
				{/if}
			</FloatingCard>
		</div>
	{/each}
</div>

<style>
	.floating-alerts {
		position: fixed;
		z-index: 9999;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		gap: 0; /* Managed by JS */
		max-width: 420px;
		width: calc(100vw - 2rem);
	}
	
	.alert-wrapper {
		pointer-events: auto;
		transition: transform var(--duration-medium), opacity var(--duration-medium);
		cursor: grab;
		will-change: transform, opacity;
	}
	
	.alert-wrapper:active {
		cursor: grabbing;
	}
	
	:global(.alert-card) {
		background: var(--color-background-primary) !important;
		border: 1px solid var(--color-border-secondary);
		overflow: hidden;
	}
	
	.alert-content {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		position: relative;
		user-select: none;
	}
	
	.alert-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
	
	.alert-body {
		flex: 1;
		min-width: 0;
	}
	
	.alert-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 0.25rem 0;
		line-height: 1.4;
	}
	
	.alert-message {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		margin: 0;
		line-height: 1.5;
		word-wrap: break-word;
	}
	
	.alert-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
		flex-wrap: wrap;
	}
	
	.alert-action {
		padding: 0.25rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border: 1px solid var(--color-border-secondary);
		background: var(--color-background-secondary);
		color: var(--color-text-primary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--duration-fast);
		white-space: nowrap;
	}
	
	.alert-action:hover {
		background: var(--color-background-tertiary);
		border-color: var(--color-border-primary);
		transform: translateY(-1px);
	}
	
	.alert-action.primary {
		background: var(--color-primary-base);
		color: white;
		border-color: var(--color-primary-base);
	}
	
	.alert-action.primary:hover {
		background: var(--color-primary-hover);
		border-color: var(--color-primary-hover);
	}
	
	.alert-dismiss {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--color-text-tertiary);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--duration-fast);
		padding: 0;
	}
	
	.alert-dismiss:hover {
		background: var(--color-background-tertiary);
		color: var(--color-text-primary);
	}
	
	.alert-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-background-tertiary);
		overflow: hidden;
	}
	
	.alert-progress-bar {
		height: 100%;
		transition: width linear;
		opacity: 0.6;
	}
	
	/* Alert type specific styles */
	:global(.alert-success) {
		border-color: var(--color-success-subtle) !important;
	}
	
	:global(.alert-error) {
		border-color: var(--color-error-subtle) !important;
	}
	
	:global(.alert-warning) {
		border-color: var(--color-warning-subtle) !important;
	}
	
	:global(.alert-info) {
		border-color: var(--color-primary-subtle) !important;
	}
	
	:global(.alert-system) {
		border-color: var(--color-border-secondary) !important;
	}
	
	/* Position specific adjustments */
	.floating-alerts-bottom-left,
	.floating-alerts-bottom-right,
	.floating-alerts-bottom-center {
		flex-direction: column-reverse;
	}
	
	/* Mobile adjustments */
	@media (max-width: 480px) {
		.floating-alerts {
			max-width: calc(100vw - 1rem);
			font-size: 0.875rem;
		}
		
		.alert-content {
			padding: 0.75rem;
			gap: 0.75rem;
		}
		
		.alert-icon {
			font-size: 1.25rem;
		}
		
		.alert-title {
			font-size: 0.8125rem;
		}
		
		.alert-message {
			font-size: 0.75rem;
		}
		
		.alert-action {
			font-size: 0.75rem;
			padding: 0.25rem 0.5rem;
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.alert-wrapper {
			transition: none;
		}
		
		.alert-progress-bar {
			transition: none;
		}
	}
	
	/* High contrast mode */
	@media (prefers-contrast: high) {
		:global(.alert-card) {
			border-width: 2px;
		}
		
		.alert-dismiss {
			border: 1px solid currentColor;
		}
	}
</style>