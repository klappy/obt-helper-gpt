<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, scale, fly } from 'svelte/transition';
	import { FloatingCard } from './ui/index.js';
	
	export let isOpen = false;
	export let position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
	export let align: 'start' | 'center' | 'end' = 'start';
	export let searchable = true;
	export let categories = true;
	export let maxHeight = 400;
	export let triggerElement: HTMLElement | null = null;
	
	const dispatch = createEventDispatcher();
	
	let searchQuery = '';
	let selectedIndex = 0;
	let menuElement: HTMLElement;
	let searchInput: HTMLInputElement;
	
	// Default quick actions organized by category
	const defaultActions = [
		{
			category: 'Insert',
			items: [
				{ id: 'template', icon: '📝', label: 'Use Template', shortcut: '⌘T' },
				{ id: 'snippet', icon: '✂️', label: 'Insert Snippet', shortcut: '⌘S' },
				{ id: 'emoji', icon: '😊', label: 'Add Emoji', shortcut: '⌘E' },
				{ id: 'mention', icon: '@', label: 'Mention Someone', shortcut: '@' }
			]
		},
		{
			category: 'Format',
			items: [
				{ id: 'bold', icon: 'B', label: 'Bold', shortcut: '⌘B' },
				{ id: 'italic', icon: 'I', label: 'Italic', shortcut: '⌘I' },
				{ id: 'code', icon: '{ }', label: 'Code', shortcut: '⌘K' },
				{ id: 'link', icon: '🔗', label: 'Add Link', shortcut: '⌘L' }
			]
		},
		{
			category: 'Actions',
			items: [
				{ id: 'schedule', icon: '🕐', label: 'Schedule Message', shortcut: '⌘⇧S' },
				{ id: 'reminder', icon: '🔔', label: 'Set Reminder', shortcut: '⌘R' },
				{ id: 'location', icon: '📍', label: 'Share Location', shortcut: '⌘⇧L' },
				{ id: 'contact', icon: '👤', label: 'Share Contact', shortcut: '⌘⇧C' }
			]
		},
		{
			category: 'Tools',
			items: [
				{ id: 'translate', icon: '🌐', label: 'Translate', shortcut: '⌘⇧T' },
				{ id: 'ai-assist', icon: '✨', label: 'AI Assist', shortcut: '⌘/' },
				{ id: 'voice-note', icon: '🎤', label: 'Voice Note', shortcut: '⌘V' },
				{ id: 'draw', icon: '✏️', label: 'Draw', shortcut: '⌘D' }
			]
		}
	];
	
	export let actions = defaultActions;
	
	// Flatten actions for easier filtering
	$: flatActions = actions.flatMap(category => 
		category.items.map(item => ({ ...item, category: category.category }))
	);
	
	// Filter actions based on search
	$: filteredActions = searchQuery
		? flatActions.filter(action => 
			action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
			action.category.toLowerCase().includes(searchQuery.toLowerCase())
		)
		: flatActions;
	
	// Group filtered actions by category
	$: groupedActions = filteredActions.reduce((acc, action) => {
		const category = action.category;
		if (!acc[category]) acc[category] = [];
		acc[category].push(action);
		return acc;
	}, {} as Record<string, typeof flatActions>);
	
	// Update selected index when filtered results change
	$: if (filteredActions.length > 0 && selectedIndex >= filteredActions.length) {
		selectedIndex = 0;
	}
	
	function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = (selectedIndex + 1) % filteredActions.length;
				scrollToSelected();
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = selectedIndex === 0 ? filteredActions.length - 1 : selectedIndex - 1;
				scrollToSelected();
				break;
			case 'Enter':
				event.preventDefault();
				if (filteredActions[selectedIndex]) {
					selectAction(filteredActions[selectedIndex]);
				}
				break;
			case 'Escape':
				event.preventDefault();
				close();
				break;
			case 'Tab':
				event.preventDefault();
				// Tab cycles through actions
				if (event.shiftKey) {
					selectedIndex = selectedIndex === 0 ? filteredActions.length - 1 : selectedIndex - 1;
				} else {
					selectedIndex = (selectedIndex + 1) % filteredActions.length;
				}
				scrollToSelected();
				break;
		}
	}
	
	function selectAction(action: typeof flatActions[0]) {
		dispatch('select', action);
		close();
	}
	
	function close() {
		isOpen = false;
		searchQuery = '';
		selectedIndex = 0;
		dispatch('close');
	}
	
	function scrollToSelected() {
		const selectedElement = menuElement?.querySelector(`[data-index="${selectedIndex}"]`);
		selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}
	
	// Position the menu relative to trigger
	function updatePosition() {
		if (!menuElement || !triggerElement) return;
		
		const triggerRect = triggerElement.getBoundingClientRect();
		const menuRect = menuElement.getBoundingClientRect();
		
		let top = 0;
		let left = 0;
		
		// Vertical positioning
		switch (position) {
			case 'top':
				top = triggerRect.top - menuRect.height - 8;
				break;
			case 'bottom':
				top = triggerRect.bottom + 8;
				break;
			case 'left':
				top = triggerRect.top;
				left = triggerRect.left - menuRect.width - 8;
				break;
			case 'right':
				top = triggerRect.top;
				left = triggerRect.right + 8;
				break;
		}
		
		// Horizontal alignment for top/bottom positions
		if (position === 'top' || position === 'bottom') {
			switch (align) {
				case 'start':
					left = triggerRect.left;
					break;
				case 'center':
					left = triggerRect.left + (triggerRect.width - menuRect.width) / 2;
					break;
				case 'end':
					left = triggerRect.right - menuRect.width;
					break;
			}
		}
		
		// Keep menu within viewport
		const padding = 16;
		left = Math.max(padding, Math.min(left, window.innerWidth - menuRect.width - padding));
		top = Math.max(padding, Math.min(top, window.innerHeight - menuRect.height - padding));
		
		menuElement.style.top = `${top}px`;
		menuElement.style.left = `${left}px`;
	}
	
	// Handle click outside
	function handleClickOutside(event: MouseEvent) {
		if (menuElement && !menuElement.contains(event.target as Node) && 
			triggerElement && !triggerElement.contains(event.target as Node)) {
			close();
		}
	}
	
	onMount(() => {
		if (isOpen && searchable) {
			searchInput?.focus();
		}
		updatePosition();
		
		document.addEventListener('click', handleClickOutside);
		window.addEventListener('resize', updatePosition);
		window.addEventListener('scroll', updatePosition, true);
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
			window.removeEventListener('resize', updatePosition);
			window.removeEventListener('scroll', updatePosition, true);
		};
	});
	
	$: if (isOpen) {
		setTimeout(() => {
			searchInput?.focus();
			updatePosition();
		}, 0);
	}
</script>

{#if isOpen}
	<div 
		bind:this={menuElement}
		class="quick-actions-menu"
		style="max-height: {maxHeight}px"
		on:keydown={handleKeyDown}
		transition:scale={{ duration: 200, start: 0.95 }}
		role="menu"
		aria-label="Quick actions menu"
	>
		<FloatingCard depth={4} hover={false} animate={false} padding="none">
			{#if searchable}
				<div class="search-container">
					<span class="search-icon">🔍</span>
					<input
						bind:this={searchInput}
						bind:value={searchQuery}
						type="text"
						placeholder="Search actions..."
						class="search-input"
						aria-label="Search actions"
					/>
				</div>
			{/if}
			
			<div class="actions-container">
				{#if filteredActions.length === 0}
					<div class="no-results">
						No actions found for "{searchQuery}"
					</div>
				{:else if categories}
					{#each Object.entries(groupedActions) as [category, items], categoryIndex}
						<div class="category-group" transition:fade={{ duration: 150 }}>
							<div class="category-label">{category}</div>
							{#each items as action, actionIndex}
								{@const globalIndex = flatActions.findIndex(a => a.id === action.id)}
								<button
									class="action-item"
									class:selected={globalIndex === selectedIndex}
									data-index={globalIndex}
									on:click={() => selectAction(action)}
									on:mouseenter={() => selectedIndex = globalIndex}
									role="menuitem"
								>
									<span class="action-icon">{action.icon}</span>
									<span class="action-label">{action.label}</span>
									{#if action.shortcut}
										<span class="action-shortcut">{action.shortcut}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/each}
				{:else}
					{#each filteredActions as action, index}
						<button
							class="action-item"
							class:selected={index === selectedIndex}
							data-index={index}
							on:click={() => selectAction(action)}
							on:mouseenter={() => selectedIndex = index}
							role="menuitem"
						>
							<span class="action-icon">{action.icon}</span>
							<span class="action-label">{action.label}</span>
							{#if action.shortcut}
								<span class="action-shortcut">{action.shortcut}</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</FloatingCard>
	</div>
{/if}

<style>
	.quick-actions-menu {
		position: fixed;
		z-index: 1000;
		min-width: 280px;
		font-size: var(--text-sm);
	}
	
	:global(.quick-actions-menu .floating-card) {
		overflow: hidden;
	}
	
	.search-container {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--border-subtle);
		background: var(--surface-subtle);
	}
	
	.search-icon {
		font-size: 16px;
		opacity: 0.6;
	}
	
	.search-input {
		flex: 1;
		border: none;
		background: none;
		color: var(--text-primary);
		font-size: var(--text-sm);
		outline: none;
	}
	
	.search-input::placeholder {
		color: var(--text-tertiary);
	}
	
	.actions-container {
		overflow-y: auto;
		padding: var(--spacing-xs);
	}
	
	.no-results {
		padding: var(--spacing-xl) var(--spacing-md);
		text-align: center;
		color: var(--text-secondary);
		font-style: italic;
	}
	
	.category-group {
		margin-bottom: var(--spacing-xs);
	}
	
	.category-group:last-child {
		margin-bottom: 0;
	}
	
	.category-label {
		padding: var(--spacing-xs) var(--spacing-sm);
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.action-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		width: 100%;
		padding: var(--spacing-sm);
		border: none;
		background: none;
		color: var(--text-primary);
		text-align: left;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--animation-quick);
		position: relative;
	}
	
	.action-item:hover,
	.action-item.selected {
		background: var(--surface-hover);
		color: var(--color-primary);
	}
	
	.action-item.selected::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 3px;
		height: 60%;
		background: var(--color-primary);
		border-radius: var(--radius-sm);
	}
	
	.action-icon {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		flex-shrink: 0;
	}
	
	.action-label {
		flex: 1;
		font-weight: 500;
	}
	
	.action-shortcut {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		padding: 2px 6px;
		background: var(--surface-subtle);
		border-radius: var(--radius-xs);
		font-family: var(--font-mono);
		white-space: nowrap;
	}
	
	/* Scrollbar styling */
	.actions-container::-webkit-scrollbar {
		width: 6px;
	}
	
	.actions-container::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.actions-container::-webkit-scrollbar-thumb {
		background: var(--border-subtle);
		border-radius: var(--radius-sm);
	}
	
	.actions-container::-webkit-scrollbar-thumb:hover {
		background: var(--border-default);
	}
	
	/* Dark mode */
	:global(.dark) .search-container {
		background: var(--surface-raised);
	}
	
	:global(.dark) .action-item:hover,
	:global(.dark) .action-item.selected {
		background: var(--surface-elevated);
	}
	
	:global(.dark) .action-shortcut {
		background: var(--surface-raised);
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.quick-actions-menu {
			min-width: 240px;
			font-size: var(--text-base);
		}
		
		.action-item {
			padding: var(--spacing-md);
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.quick-actions-menu {
			transition: none;
		}
		
		.action-item {
			transition: none;
		}
	}
	
	/* High contrast mode */
	@media (prefers-contrast: high) {
		.action-item.selected {
			outline: 2px solid currentColor;
			outline-offset: -2px;
		}
		
		.action-item.selected::before {
			display: none;
		}
	}
</style>