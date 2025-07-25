<script>
	import { onMount } from 'svelte';
	import { spring } from 'svelte/motion';
	
	export let minLeftWidth = 300;
	export let minRightWidth = 300;
	export let initialSplit = 50; // percentage
	export let dividerWidth = 4;
	export let vertical = false; // horizontal by default
	
	let container;
	let isDragging = false;
	let splitPosition = spring(initialSplit, {
		stiffness: 0.2,
		damping: 0.7
	});
	
	// Handle mouse/touch events
	function handleMouseDown(e) {
		isDragging = true;
		e.preventDefault();
		
		// Add global listeners
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('touchmove', handleTouchMove);
		window.addEventListener('touchend', handleMouseUp);
	}
	
	function handleMouseMove(e) {
		if (!isDragging || !container) return;
		updateSplit(e.clientX, e.clientY);
	}
	
	function handleTouchMove(e) {
		if (!isDragging || !container) return;
		const touch = e.touches[0];
		updateSplit(touch.clientX, touch.clientY);
	}
	
	function updateSplit(x, y) {
		const rect = container.getBoundingClientRect();
		
		if (vertical) {
			const height = rect.height;
			const pos = y - rect.top;
			const percent = (pos / height) * 100;
			
			// Respect minimum sizes
			const minTopPercent = (minLeftWidth / height) * 100;
			const maxTopPercent = 100 - (minRightWidth / height) * 100;
			
			splitPosition.set(Math.max(minTopPercent, Math.min(maxTopPercent, percent)));
		} else {
			const width = rect.width;
			const pos = x - rect.left;
			const percent = (pos / width) * 100;
			
			// Respect minimum sizes
			const minLeftPercent = (minLeftWidth / width) * 100;
			const maxLeftPercent = 100 - (minRightWidth / width) * 100;
			
			splitPosition.set(Math.max(minLeftPercent, Math.min(maxLeftPercent, percent)));
		}
	}
	
	function handleMouseUp() {
		isDragging = false;
		
		// Remove global listeners
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
		window.removeEventListener('touchmove', handleTouchMove);
		window.removeEventListener('touchend', handleMouseUp);
	}
	
	// Keyboard shortcuts
	function handleKeyDown(e) {
		if (e.key === 'ArrowLeft' && !vertical) {
			e.preventDefault();
			splitPosition.update(n => Math.max(20, n - 5));
		} else if (e.key === 'ArrowRight' && !vertical) {
			e.preventDefault();
			splitPosition.update(n => Math.min(80, n + 5));
		} else if (e.key === 'ArrowUp' && vertical) {
			e.preventDefault();
			splitPosition.update(n => Math.max(20, n - 5));
		} else if (e.key === 'ArrowDown' && vertical) {
			e.preventDefault();
			splitPosition.update(n => Math.min(80, n + 5));
		}
	}
	
	onMount(() => {
		return () => {
			// Cleanup on unmount
			handleMouseUp();
		};
	});
</script>

<div 
	bind:this={container}
	class="split-view {vertical ? 'split-view-vertical' : 'split-view-horizontal'}"
	class:is-dragging={isDragging}
>
	<!-- Left/Top Panel -->
	<div 
		class="split-panel split-panel-left"
		style={vertical ? `height: ${$splitPosition}%` : `width: ${$splitPosition}%`}
	>
		<slot name="left" />
	</div>
	
	<!-- Divider -->
	<div 
		class="split-divider"
		class:vertical
		role="separator"
		aria-orientation={vertical ? 'horizontal' : 'vertical'}
		aria-label="Resize panels"
		tabindex="0"
		on:mousedown={handleMouseDown}
		on:touchstart={handleMouseDown}
		on:keydown={handleKeyDown}
		style="width: {vertical ? '100%' : dividerWidth + 'px'}; height: {vertical ? dividerWidth + 'px' : '100%'}"
	>
		<div class="divider-handle">
			<span class="divider-dots"></span>
		</div>
	</div>
	
	<!-- Right/Bottom Panel -->
	<div 
		class="split-panel split-panel-right"
		style={vertical ? `height: calc(100% - ${$splitPosition}%)` : `width: calc(100% - ${$splitPosition}%)`}
	>
		<slot name="right" />
	</div>
</div>

<style>
	.split-view {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		background: var(--color-background-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		border: 1px solid var(--color-border-secondary);
	}
	
	.split-view-horizontal {
		flex-direction: row;
	}
	
	.split-view-vertical {
		flex-direction: column;
	}
	
	.split-panel {
		position: relative;
		overflow: auto;
		background: var(--color-background-primary);
	}
	
	.split-panel-left {
		border-right: 1px solid var(--color-border-primary);
	}
	
	.split-view-vertical .split-panel-left {
		border-right: none;
		border-bottom: 1px solid var(--color-border-primary);
	}
	
	.split-divider {
		position: relative;
		background: var(--color-background-secondary);
		cursor: col-resize;
		user-select: none;
		touch-action: none;
		flex-shrink: 0;
		transition: background-color var(--duration-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.split-divider.vertical {
		cursor: row-resize;
	}
	
	.split-divider:hover,
	.split-divider:focus {
		background: var(--color-background-tertiary);
		outline: none;
	}
	
	.split-divider:focus {
		box-shadow: 0 0 0 2px var(--color-primary-base);
	}
	
	.is-dragging .split-divider {
		background: var(--color-primary-subtle);
	}
	
	.divider-handle {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.divider-dots {
		display: block;
		width: 3px;
		height: 24px;
		background-image: radial-gradient(circle, var(--color-text-tertiary) 1px, transparent 1px);
		background-size: 3px 6px;
		background-repeat: repeat-y;
		background-position: center;
		opacity: 0.5;
		transition: opacity var(--duration-fast);
	}
	
	.split-divider.vertical .divider-dots {
		width: 24px;
		height: 3px;
		background-size: 6px 3px;
		background-repeat: repeat-x;
	}
	
	.split-divider:hover .divider-dots,
	.is-dragging .divider-dots {
		opacity: 1;
	}
	
	/* Prevent text selection while dragging */
	.is-dragging {
		user-select: none;
		-webkit-user-select: none;
	}
	
	.is-dragging .split-panel {
		pointer-events: none;
	}
	
	/* Responsive adjustments */
	@media (max-width: 768px) {
		.split-divider {
			display: none;
		}
		
		.split-view-horizontal {
			flex-direction: column;
		}
		
		.split-panel {
			width: 100% !important;
			height: 50% !important;
		}
		
		.split-panel-left {
			border-right: none;
			border-bottom: 1px solid var(--color-border-primary);
		}
	}
</style>