<script>
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { FloatingCard } from '$lib/components/ui/index.js';
	import { spring } from 'svelte/motion';
	import { fade, scale } from 'svelte/transition';
	
	export let config = {
		modules: [],
		connections: []
	};
	
	// Available module types
	const moduleTypes = [
		{
			id: 'input',
			name: 'Input Handler',
			icon: '📥',
			color: 'primary',
			description: 'Processes user input',
			settings: ['type', 'validation', 'preprocessing']
		},
		{
			id: 'context',
			name: 'Context Builder',
			icon: '🧠',
			color: 'secondary',
			description: 'Manages conversation context',
			settings: ['memory', 'relevance', 'window']
		},
		{
			id: 'personality',
			name: 'Personality Layer',
			icon: '🎭',
			color: 'tertiary',
			description: 'Applies personality traits',
			settings: ['tone', 'formality', 'humor']
		},
		{
			id: 'knowledge',
			name: 'Knowledge Base',
			icon: '📚',
			color: 'success',
			description: 'Access external knowledge',
			settings: ['sources', 'confidence', 'citations']
		},
		{
			id: 'response',
			name: 'Response Generator',
			icon: '💬',
			color: 'warning',
			description: 'Generates AI responses',
			settings: ['style', 'length', 'creativity']
		},
		{
			id: 'filter',
			name: 'Output Filter',
			icon: '🔍',
			color: 'error',
			description: 'Filters and validates output',
			settings: ['safety', 'accuracy', 'compliance']
		}
	];
	
	let modules = config.modules || [];
	let draggedModule = null;
	let hoveredModule = null;
	let selectedModule = null;
	let draggedType = null;
	let canvas;
	let dragOffset = { x: 0, y: 0 };
	let ghostElement = null;
	
	// Module positions for visual layout
	let modulePositions = new Map();
	
	// Spring animations for smooth movements
	const flipDuration = 300;
	
	// Add a new module
	function addModule(type, position = null) {
		const moduleType = moduleTypes.find(m => m.id === type.id);
		const newModule = {
			id: `${type.id}-${Date.now()}`,
			type: type.id,
			name: moduleType.name,
			icon: moduleType.icon,
			color: moduleType.color,
			settings: {},
			x: position?.x || Math.random() * 200,
			y: position?.y || modules.length * 100
		};
		
		modules = [...modules, newModule];
		updateConfig();
		return newModule;
	}
	
	// Remove a module
	function removeModule(moduleId) {
		modules = modules.filter(m => m.id !== moduleId);
		if (selectedModule?.id === moduleId) {
			selectedModule = null;
		}
		updateConfig();
	}
	
	// Update configuration
	function updateConfig() {
		config = {
			...config,
			modules
		};
	}
	
	// Start dragging from palette
	function startDragFromPalette(e, type) {
		e.preventDefault();
		draggedType = type;
		
		// Create ghost element
		ghostElement = document.createElement('div');
		ghostElement.className = 'drag-ghost';
		ghostElement.innerHTML = `<span class="ghost-icon">${type.icon}</span>`;
		document.body.appendChild(ghostElement);
		
		// Position ghost at cursor
		const rect = e.currentTarget.getBoundingClientRect();
		dragOffset.x = e.clientX - rect.left;
		dragOffset.y = e.clientY - rect.top;
		
		updateGhostPosition(e.clientX, e.clientY);
		
		// Add event listeners
		window.addEventListener('mousemove', handleGlobalMouseMove);
		window.addEventListener('mouseup', handleGlobalMouseUp);
		window.addEventListener('touchmove', handleGlobalTouchMove);
		window.addEventListener('touchend', handleGlobalMouseUp);
	}
	
	// Start dragging existing module
	function startDragModule(e, module) {
		e.preventDefault();
		e.stopPropagation();
		draggedModule = module;
		
		const rect = e.currentTarget.getBoundingClientRect();
		dragOffset.x = e.clientX - rect.left;
		dragOffset.y = e.clientY - rect.top;
		
		// Add event listeners
		window.addEventListener('mousemove', handleGlobalMouseMove);
		window.addEventListener('mouseup', handleGlobalMouseUp);
		window.addEventListener('touchmove', handleGlobalTouchMove);
		window.addEventListener('touchend', handleGlobalMouseUp);
	}
	
	// Handle global mouse move
	function handleGlobalMouseMove(e) {
		if (draggedType && ghostElement) {
			updateGhostPosition(e.clientX, e.clientY);
		} else if (draggedModule && canvas) {
			const rect = canvas.getBoundingClientRect();
			draggedModule.x = e.clientX - rect.left - dragOffset.x;
			draggedModule.y = e.clientY - rect.top - dragOffset.y;
			modules = modules; // Trigger reactivity
		}
	}
	
	// Handle global touch move
	function handleGlobalTouchMove(e) {
		const touch = e.touches[0];
		if (draggedType && ghostElement) {
			updateGhostPosition(touch.clientX, touch.clientY);
		} else if (draggedModule && canvas) {
			const rect = canvas.getBoundingClientRect();
			draggedModule.x = touch.clientX - rect.left - dragOffset.x;
			draggedModule.y = touch.clientY - rect.top - dragOffset.y;
			modules = modules; // Trigger reactivity
		}
	}
	
	// Update ghost position
	function updateGhostPosition(x, y) {
		if (ghostElement) {
			ghostElement.style.left = `${x - dragOffset.x}px`;
			ghostElement.style.top = `${y - dragOffset.y}px`;
		}
	}
	
	// Handle global mouse up
	function handleGlobalMouseUp(e) {
		if (draggedType && canvas) {
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX || e.changedTouches?.[0]?.clientX;
			const y = e.clientY || e.changedTouches?.[0]?.clientY;
			
			// Check if dropped on canvas
			if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
				const position = {
					x: x - rect.left - dragOffset.x,
					y: y - rect.top - dragOffset.y
				};
				const newModule = addModule(draggedType, position);
				selectedModule = newModule;
			}
		}
		
		// Clean up
		if (ghostElement) {
			document.body.removeChild(ghostElement);
			ghostElement = null;
		}
		
		draggedType = null;
		draggedModule = null;
		updateConfig();
		
		// Remove event listeners
		window.removeEventListener('mousemove', handleGlobalMouseMove);
		window.removeEventListener('mouseup', handleGlobalMouseUp);
		window.removeEventListener('touchmove', handleGlobalTouchMove);
		window.removeEventListener('touchend', handleGlobalMouseUp);
	}
	
	// Select module for editing
	function selectModule(module) {
		selectedModule = module;
	}
	
	// Handle keyboard shortcuts
	function handleKeyDown(e) {
		if (selectedModule && e.key === 'Delete') {
			e.preventDefault();
			removeModule(selectedModule.id);
		}
	}
	
	onMount(() => {
		// Initialize module positions
		modules.forEach((module, index) => {
			modulePositions.set(module.id, {
				x: spring(module.x || 0),
				y: spring(module.y || index * 100)
			});
		});
		
		// Add keyboard listener
		window.addEventListener('keydown', handleKeyDown);
		
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			handleGlobalMouseUp(); // Clean up any active drags
		};
	});
</script>

<div class="configurator">
	<!-- Module Palette -->
	<div class="module-palette">
		<h3 class="palette-title">Available Modules</h3>
		<div class="module-types">
			{#each moduleTypes as type}
				<button
					class="module-type"
					on:mousedown={(e) => startDragFromPalette(e, type)}
					on:touchstart={(e) => startDragFromPalette(e, type)}
					transition:scale={{ duration: 200 }}
				>
					<span class="module-icon">{type.icon}</span>
					<span class="module-name">{type.name}</span>
					<span class="module-description">{type.description}</span>
				</button>
			{/each}
		</div>
	</div>
	
	<!-- Configuration Canvas -->
	<div class="config-canvas" bind:this={canvas}>
		<div class="modules-container">
			{#each modules as module (module.id)}
				<div
					class="config-module"
					class:selected={selectedModule?.id === module.id}
					class:dragging={draggedModule?.id === module.id}
					style="transform: translate({module.x}px, {module.y}px)"
					animate:flip={{ duration: flipDuration }}
					on:mousedown={(e) => startDragModule(e, module)}
					on:touchstart={(e) => startDragModule(e, module)}
					on:click={() => selectModule(module)}
					on:mouseenter={() => hoveredModule = module}
					on:mouseleave={() => hoveredModule = null}
				>
					<FloatingCard
						depth={hoveredModule?.id === module.id ? 4 : 3}
						interactive={true}
						animate={true}
					>
						<div class="module-content">
							<div class="module-header">
								<span class="module-icon">{module.icon}</span>
								<span class="module-title">{module.name}</span>
								<button
									class="module-remove"
									on:click|stopPropagation={() => removeModule(module.id)}
								>
									×
								</button>
							</div>
							<div class="module-body">
								<div class="module-ports">
									<div class="port port-input" title="Input"></div>
									<div class="port port-output" title="Output"></div>
								</div>
							</div>
						</div>
					</FloatingCard>
				</div>
			{/each}
		</div>
		
		{#if modules.length === 0}
			<div class="empty-state" transition:fade>
				<p>Drag modules here to build your assistant</p>
			</div>
		{/if}
	</div>
	
	<!-- Module Settings -->
	{#if selectedModule}
		<div class="module-settings" transition:fade={{ duration: 200 }}>
			<h3 class="settings-title">
				{selectedModule.icon} {selectedModule.name} Settings
			</h3>
			<div class="settings-content">
				{#each moduleTypes.find(m => m.id === selectedModule.type)?.settings || [] as setting}
					<div class="setting-item">
						<label class="setting-label">{setting}</label>
						<input
							type="text"
							class="setting-input"
							placeholder="Configure {setting}..."
							bind:value={selectedModule.settings[setting]}
							on:input={updateConfig}
						/>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.configurator {
		display: grid;
		grid-template-columns: 250px 1fr 300px;
		gap: 1.5rem;
		height: 100%;
		position: relative;
	}
	
	/* Module Palette */
	.module-palette {
		background: var(--color-background-secondary);
		border-radius: var(--radius-lg);
		padding: 1rem;
		overflow-y: auto;
	}
	
	.palette-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin-bottom: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.module-types {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.module-type {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 0.75rem;
		background: var(--color-background-primary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-md);
		cursor: grab;
		transition: all var(--duration-fast);
		text-align: left;
	}
	
	.module-type:hover {
		background: var(--color-background-tertiary);
		border-color: var(--color-border-primary);
		transform: translateX(2px);
	}
	
	.module-type:active {
		cursor: grabbing;
	}
	
	.module-icon {
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
	}
	
	.module-name {
		font-weight: 500;
		color: var(--color-text-primary);
		margin-bottom: 0.25rem;
	}
	
	.module-description {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
	}
	
	/* Configuration Canvas */
	.config-canvas {
		background: var(--color-background-secondary);
		border-radius: var(--radius-lg);
		padding: 2rem;
		position: relative;
		overflow: auto;
		background-image: 
			radial-gradient(circle, var(--color-border-tertiary) 1px, transparent 1px);
		background-size: 20px 20px;
	}
	
	.modules-container {
		min-height: 400px;
		position: relative;
	}
	
	.config-module {
		position: absolute;
		width: 200px;
		cursor: move;
		transition: transform var(--duration-fast);
		user-select: none;
	}
	
	.config-module.selected {
		z-index: 10;
	}
	
	.config-module.dragging {
		z-index: 20;
		cursor: grabbing;
		opacity: 0.8;
	}
	
	.module-content {
		position: relative;
	}
	
	.module-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--color-background-primary);
		border-bottom: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-md) var(--radius-md) 0 0;
	}
	
	.module-title {
		flex: 1;
		font-weight: 500;
		color: var(--color-text-primary);
	}
	
	.module-remove {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--color-text-tertiary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--duration-fast);
		font-size: 1.25rem;
		line-height: 1;
	}
	
	.module-remove:hover {
		background: var(--color-error-subtle);
		color: var(--color-error);
	}
	
	.module-body {
		padding: 1rem;
		min-height: 60px;
		position: relative;
	}
	
	.module-ports {
		display: flex;
		justify-content: space-between;
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		transform: translateY(-50%);
	}
	
	.port {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--color-background-primary);
		border: 2px solid var(--color-primary-base);
		cursor: crosshair;
		transition: all var(--duration-fast);
	}
	
	.port:hover {
		transform: scale(1.5);
		border-color: var(--color-primary-hover);
		box-shadow: 0 0 0 4px var(--color-primary-subtle);
	}
	
	.port-input {
		margin-left: -6px;
	}
	
	.port-output {
		margin-right: -6px;
	}
	
	/* Empty State */
	.empty-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: var(--color-text-tertiary);
		font-size: 1.125rem;
		pointer-events: none;
	}
	
	/* Module Settings */
	.module-settings {
		background: var(--color-background-secondary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		overflow-y: auto;
	}
	
	.settings-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.settings-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.setting-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		text-transform: capitalize;
	}
	
	.setting-input {
		padding: 0.5rem 0.75rem;
		background: var(--color-background-primary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		transition: all var(--duration-fast);
	}
	
	.setting-input:focus {
		outline: none;
		border-color: var(--color-primary-base);
		box-shadow: 0 0 0 3px var(--color-primary-subtle);
	}
	
	/* Responsive */
	@media (max-width: 1200px) {
		.configurator {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr auto;
		}
		
		.module-palette {
			order: 1;
		}
		
		.config-canvas {
			order: 2;
			min-height: 400px;
		}
		
		.module-settings {
			order: 3;
		}
		
		.module-types {
			flex-direction: row;
			flex-wrap: wrap;
		}
		
		.module-type {
			flex: 1 1 calc(50% - 0.25rem);
		}
	}
	
	/* Global drag ghost */
	:global(.drag-ghost) {
		position: fixed;
		pointer-events: none;
		z-index: 9999;
		opacity: 0.8;
		background: var(--color-background-primary);
		border: 2px solid var(--color-primary-base);
		border-radius: var(--radius-md);
		padding: 0.75rem;
		box-shadow: var(--shadow-floating);
		transform: translate(-50%, -50%);
	}
	
	:global(.ghost-icon) {
		font-size: 2rem;
		display: block;
	}
</style>