<script>
	import { onMount, onDestroy } from 'svelte';
	import { spring, tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale, slide, fly } from 'svelte/transition';
	import { FloatingCard } from './ui/index.js';
	import { AdaptiveButton } from './ui/index.js';
	import { createEventDispatcher } from 'svelte';
	
	export let items = [];
	export let operations = [];
	export let itemKey = 'id';
	export let itemLabel = 'name';
	export let maxSelection = null;
	export let variant = 'detailed'; // 'inline', 'compact', 'detailed'
	export let confirmDangerous = true;
	
	const dispatch = createEventDispatcher();
	
	// Default operations if none provided
	const defaultOperations = [
		{
			id: 'export',
			name: 'Export',
			icon: '📥',
			type: 'safe',
			description: 'Export selected items',
			handler: async (selectedItems) => {
				console.log('Exporting:', selectedItems);
			}
		},
		{
			id: 'archive',
			name: 'Archive',
			icon: '📦',
			type: 'moderate',
			description: 'Archive selected items',
			handler: async (selectedItems) => {
				console.log('Archiving:', selectedItems);
			}
		},
		{
			id: 'delete',
			name: 'Delete',
			icon: '🗑️',
			type: 'dangerous',
			description: 'Permanently delete selected items',
			handler: async (selectedItems) => {
				console.log('Deleting:', selectedItems);
			}
		}
	];
	
	// State management
	let selectedItems = new Set();
	let selectAllState = 'none'; // 'none', 'some', 'all'
	let activeOperation = null;
	let isProcessing = false;
	let processProgress = 0;
	let processedCount = 0;
	let showConfirmDialog = false;
	let confirmOperation = null;
	let searchTerm = '';
	let filterTag = null;
	
	// Animation values
	const selectionCount = tweened(0, { duration: 300, easing: cubicOut });
	const progressBar = tweened(0, { duration: 400, easing: cubicOut });
	const successScale = spring(0, { stiffness: 0.3, damping: 0.4 });
	
	// Use provided operations or defaults
	$: currentOperations = operations.length > 0 ? operations : defaultOperations;
	
	// Filtered items based on search
	$: filteredItems = items.filter(item => {
		if (!searchTerm) return true;
		const label = getItemLabel(item).toLowerCase();
		return label.includes(searchTerm.toLowerCase());
	});
	
	// Update selection count
	$: selectionCount.set(selectedItems.size);
	
	// Update select all state
	$: {
		if (selectedItems.size === 0) {
			selectAllState = 'none';
		} else if (selectedItems.size === filteredItems.length) {
			selectAllState = 'all';
		} else {
			selectAllState = 'some';
		}
	}
	
	// Get item key value
	function getItemKey(item) {
		return typeof itemKey === 'function' ? itemKey(item) : item[itemKey];
	}
	
	// Get item label
	function getItemLabel(item) {
		return typeof itemLabel === 'function' ? itemLabel(item) : item[itemLabel];
	}
	
	// Toggle item selection
	function toggleItemSelection(item) {
		const key = getItemKey(item);
		
		if (selectedItems.has(key)) {
			selectedItems.delete(key);
		} else {
			if (maxSelection && selectedItems.size >= maxSelection) {
				// Notify about max selection
				dispatch('maxSelectionReached', { max: maxSelection });
				return;
			}
			selectedItems.add(key);
		}
		
		selectedItems = selectedItems; // Trigger reactivity
		dispatch('selectionChanged', { selected: Array.from(selectedItems) });
	}
	
	// Select all items
	function selectAll() {
		if (selectAllState === 'all') {
			selectedItems.clear();
		} else {
			selectedItems.clear();
			const limit = maxSelection || filteredItems.length;
			filteredItems.slice(0, limit).forEach(item => {
				selectedItems.add(getItemKey(item));
			});
		}
		
		selectedItems = selectedItems;
		dispatch('selectionChanged', { selected: Array.from(selectedItems) });
	}
	
	// Execute operation
	async function executeOperation(operation) {
		if (selectedItems.size === 0) return;
		
		// Check if confirmation needed
		if (confirmDangerous && operation.type === 'dangerous') {
			confirmOperation = operation;
			showConfirmDialog = true;
			return;
		}
		
		// Proceed with operation
		await performOperation(operation);
	}
	
	// Perform the actual operation
	async function performOperation(operation) {
		isProcessing = true;
		activeOperation = operation;
		processedCount = 0;
		progressBar.set(0);
		
		const selectedArray = Array.from(selectedItems);
		const total = selectedArray.length;
		
		dispatch('operationStarted', { 
			operation: operation.id, 
			items: selectedArray 
		});
		
		try {
			// Process items in batches
			const batchSize = 10;
			for (let i = 0; i < selectedArray.length; i += batchSize) {
				const batch = selectedArray.slice(i, i + batchSize);
				const batchItems = items.filter(item => 
					batch.includes(getItemKey(item))
				);
				
				// Execute handler
				if (operation.handler) {
					await operation.handler(batchItems);
				}
				
				// Update progress
				processedCount = Math.min(i + batchSize, total);
				const progress = (processedCount / total) * 100;
				progressBar.set(progress);
				
				// Small delay for visual feedback
				await new Promise(resolve => setTimeout(resolve, 100));
			}
			
			// Success animation
			successScale.set(1);
			setTimeout(() => successScale.set(0), 1000);
			
			// Clear selection after success
			selectedItems.clear();
			selectedItems = selectedItems;
			
			dispatch('operationCompleted', { 
				operation: operation.id, 
				itemsProcessed: total,
				success: true
			});
			
		} catch (error) {
			dispatch('operationFailed', { 
				operation: operation.id, 
				error: error.message 
			});
		} finally {
			isProcessing = false;
			activeOperation = null;
			setTimeout(() => {
				processedCount = 0;
				progressBar.set(0);
			}, 1000);
		}
	}
	
	// Confirm dangerous operation
	function confirmDangerousOperation() {
		showConfirmDialog = false;
		if (confirmOperation) {
			performOperation(confirmOperation);
			confirmOperation = null;
		}
	}
	
	// Cancel dangerous operation
	function cancelDangerousOperation() {
		showConfirmDialog = false;
		confirmOperation = null;
	}
	
	// Keyboard shortcuts
	function handleKeydown(e) {
		// Ctrl/Cmd + A to select all
		if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
			e.preventDefault();
			selectAll();
		}
		// Escape to clear selection
		else if (e.key === 'Escape') {
			if (showConfirmDialog) {
				cancelDangerousOperation();
			} else if (selectedItems.size > 0) {
				selectedItems.clear();
				selectedItems = selectedItems;
				dispatch('selectionChanged', { selected: [] });
			}
		}
	}
	
	// Get operation color
	function getOperationColor(type) {
		return {
			safe: 'var(--color-success-base)',
			moderate: 'var(--color-warning-base)',
			dangerous: 'var(--color-error-base)'
		}[type] || 'var(--color-primary-base)';
	}
	
	// Format operation status
	function getOperationStatus() {
		if (!activeOperation) return '';
		
		if (processedCount < selectedItems.size) {
			return `Processing ${activeOperation.name}: ${processedCount}/${selectedItems.size}`;
		} else {
			return `Completed ${activeOperation.name} for ${processedCount} items`;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="batch-operations batch-operations-{variant}">
	{#if variant === 'inline'}
		<!-- Inline variant - minimal controls -->
		<div class="inline-controls">
			{#if selectedItems.size > 0}
				<span class="selection-count">{selectedItems.size} selected</span>
				<div class="inline-actions">
					{#each currentOperations as operation}
						<button
							class="inline-action"
							style="--action-color: {getOperationColor(operation.type)}"
							on:click={() => executeOperation(operation)}
							disabled={isProcessing}
							title={operation.description}
						>
							<span class="action-icon">{operation.icon}</span>
							<span class="action-label">{operation.name}</span>
						</button>
					{/each}
				</div>
			{:else}
				<span class="no-selection">Select items to perform actions</span>
			{/if}
		</div>
		
	{:else if variant === 'compact'}
		<!-- Compact variant - dropdown style -->
		<FloatingCard depth={1} padding="sm">
			<div class="compact-controls">
				<div class="compact-selection">
					<label class="select-all-checkbox">
						<input
							type="checkbox"
							checked={selectAllState === 'all'}
							indeterminate={selectAllState === 'some'}
							on:change={selectAll}
						/>
						<span class="select-all-label">
							{#if selectAllState === 'all'}
								Deselect all
							{:else}
								Select all
							{/if}
						</span>
					</label>
					<span class="selection-status">
						{selectedItems.size} of {filteredItems.length} selected
					</span>
				</div>
				
				{#if selectedItems.size > 0}
					<div class="compact-actions">
						<select
							class="operation-select"
							on:change={(e) => {
								const op = currentOperations.find(o => o.id === e.target.value);
								if (op) executeOperation(op);
								e.target.value = '';
							}}
							disabled={isProcessing}
						>
							<option value="">Choose action...</option>
							{#each currentOperations as operation}
								<option value={operation.id}>
									{operation.icon} {operation.name}
								</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>
		</FloatingCard>
		
	{:else}
		<!-- Detailed variant - full interface -->
		<div class="detailed-interface">
			<!-- Header -->
			<FloatingCard depth={2} padding="lg">
				<div class="detailed-header">
					<div class="header-content">
						<h3 class="header-title">Batch Operations</h3>
						<p class="header-subtitle">
							Select multiple items to perform bulk actions
						</p>
					</div>
					
					<div class="header-stats">
						<div class="stat">
							<span class="stat-value">{items.length}</span>
							<span class="stat-label">Total Items</span>
						</div>
						<div class="stat">
							<span class="stat-value" style="color: var(--color-primary-base)">
								{$selectionCount}
							</span>
							<span class="stat-label">Selected</span>
						</div>
					</div>
				</div>
			</FloatingCard>
			
			<!-- Controls -->
			<FloatingCard depth={1} padding="md">
				<div class="controls-section">
					<div class="search-controls">
						<div class="search-wrapper">
							<span class="search-icon">🔍</span>
							<input
								type="text"
								class="search-input"
								placeholder="Search items..."
								bind:value={searchTerm}
							/>
						</div>
						
						<button
							class="select-all-button"
							class:selected={selectAllState === 'all'}
							on:click={selectAll}
						>
							{#if selectAllState === 'all'}
								<span>☑</span> Deselect All
							{:else}
								<span>☐</span> Select All
							{/if}
						</button>
					</div>
					
					{#if selectedItems.size > 0}
						<div class="operations-bar" transition:slide={{ duration: 200 }}>
							<div class="operations-info">
								<span class="selected-count">
									{$selectionCount} items selected
								</span>
								{#if maxSelection}
									<span class="max-selection">
										(max: {maxSelection})
									</span>
								{/if}
							</div>
							
							<div class="operations-list">
								{#each currentOperations as operation}
									<button
										class="operation-button operation-{operation.type}"
										on:click={() => executeOperation(operation)}
										disabled={isProcessing}
									>
										<span class="operation-icon">{operation.icon}</span>
										<span class="operation-name">{operation.name}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</FloatingCard>
			
			<!-- Items List -->
			<FloatingCard depth={1} padding="none">
				<div class="items-section">
					<div class="items-header">
						<h4 class="items-title">Items</h4>
						<span class="items-count">{filteredItems.length} items</span>
					</div>
					
					<div class="items-list">
						{#each filteredItems as item (getItemKey(item))}
							{@const isSelected = selectedItems.has(getItemKey(item))}
							<div
								class="item-row"
								class:selected={isSelected}
								on:click={() => toggleItemSelection(item)}
								transition:fly={{ x: -20, duration: 200 }}
							>
								<div class="item-checkbox">
									<input
										type="checkbox"
										checked={isSelected}
										on:click|stopPropagation
										on:change={() => toggleItemSelection(item)}
									/>
								</div>
								
								<div class="item-content">
									<span class="item-label">{getItemLabel(item)}</span>
									{#if item.description}
										<span class="item-description">{item.description}</span>
									{/if}
								</div>
								
								{#if item.tags}
									<div class="item-tags">
										{#each item.tags as tag}
											<span class="item-tag">{tag}</span>
										{/each}
									</div>
								{/if}
								
								<div class="item-meta">
									{#if item.status}
										<span class="item-status item-status-{item.status}">
											{item.status}
										</span>
									{/if}
									{#if item.date}
										<span class="item-date">
											{new Date(item.date).toLocaleDateString()}
										</span>
									{/if}
								</div>
							</div>
						{/each}
						
						{#if filteredItems.length === 0}
							<div class="empty-state">
								<p class="empty-message">
									{searchTerm ? 'No items match your search' : 'No items available'}
								</p>
							</div>
						{/if}
					</div>
				</div>
			</FloatingCard>
			
			<!-- Progress Overlay -->
			{#if isProcessing}
				<div class="progress-overlay" transition:fade={{ duration: 200 }}>
					<FloatingCard depth={4} padding="lg">
						<div class="progress-content">
							<div class="progress-header">
								<span class="progress-icon">{activeOperation.icon}</span>
								<h3 class="progress-title">{activeOperation.name}</h3>
							</div>
							
							<p class="progress-status">{getOperationStatus()}</p>
							
							<div class="progress-bar-container">
								<div 
									class="progress-bar-fill"
									style="width: {$progressBar}%"
								/>
							</div>
							
							<div class="progress-details">
								<span class="progress-count">
									{processedCount} / {selectedItems.size}
								</span>
								<span class="progress-percent">
									{Math.round($progressBar)}%
								</span>
							</div>
						</div>
					</FloatingCard>
				</div>
			{/if}
			
			<!-- Success Indicator -->
			{#if $successScale > 0}
				<div 
					class="success-indicator"
					style="transform: scale({$successScale})"
					transition:scale={{ duration: 300 }}
				>
					<div class="success-icon">✅</div>
					<p class="success-message">Operation completed successfully!</p>
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Confirmation Dialog -->
	{#if showConfirmDialog && confirmOperation}
		<div class="confirm-overlay" transition:fade={{ duration: 200 }}>
			<FloatingCard depth={4} padding="lg">
				<div class="confirm-dialog">
					<div class="confirm-header">
						<span class="confirm-icon" style="color: {getOperationColor(confirmOperation.type)}">
							{confirmOperation.icon}
						</span>
						<h3 class="confirm-title">Confirm {confirmOperation.name}</h3>
					</div>
					
					<p class="confirm-message">
						Are you sure you want to {confirmOperation.name.toLowerCase()} {selectedItems.size} selected items?
						This action cannot be undone.
					</p>
					
					<div class="confirm-actions">
						<AdaptiveButton
							variant="secondary"
							on:click={cancelDangerousOperation}
						>
							Cancel
						</AdaptiveButton>
						<AdaptiveButton
							variant="danger"
							on:click={confirmDangerousOperation}
						>
							{confirmOperation.name} {selectedItems.size} Items
						</AdaptiveButton>
					</div>
				</div>
			</FloatingCard>
		</div>
	{/if}
</div>

<style>
	.batch-operations {
		width: 100%;
		position: relative;
	}
	
	/* Inline Variant */
	.inline-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--color-background-secondary);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}
	
	.selection-count {
		font-weight: 600;
		color: var(--color-primary-base);
	}
	
	.inline-actions {
		display: flex;
		gap: 0.5rem;
	}
	
	.inline-action {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.75rem;
		background: var(--color-background-primary);
		border: 1px solid var(--action-color);
		color: var(--action-color);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.inline-action:hover:not(:disabled) {
		background: var(--action-color);
		color: white;
		transform: translateY(-1px);
	}
	
	.inline-action:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.action-icon {
		font-size: 0.875rem;
	}
	
	.no-selection {
		color: var(--color-text-tertiary);
		font-style: italic;
	}
	
	/* Compact Variant */
	.compact-controls {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}
	
	.compact-selection {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.select-all-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}
	
	.select-all-checkbox input {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
	}
	
	.select-all-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}
	
	.selection-status {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}
	
	.operation-select {
		padding: 0.5rem 2rem 0.5rem 0.75rem;
		background: var(--color-background-primary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.operation-select:hover:not(:disabled) {
		border-color: var(--color-border-primary);
	}
	
	.operation-select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	/* Detailed Variant */
	.detailed-interface {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.detailed-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}
	
	.header-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}
	
	.header-subtitle {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0.25rem 0 0 0;
	}
	
	.header-stats {
		display: flex;
		gap: 2rem;
	}
	
	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}
	
	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary);
		line-height: 1;
	}
	
	.stat-label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
	}
	
	/* Controls Section */
	.controls-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.search-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
	}
	
	.search-wrapper {
		flex: 1;
		position: relative;
	}
	
	.search-icon {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
		pointer-events: none;
	}
	
	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem 0.5rem 2.25rem;
		background: var(--color-background-primary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		transition: all var(--duration-fast);
	}
	
	.search-input:focus {
		outline: none;
		border-color: var(--color-primary-base);
		box-shadow: 0 0 0 3px var(--color-primary-subtle);
	}
	
	.select-all-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-background-primary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--duration-fast);
		white-space: nowrap;
	}
	
	.select-all-button:hover {
		background: var(--color-background-tertiary);
		border-color: var(--color-border-primary);
		transform: translateY(-1px);
	}
	
	.select-all-button.selected {
		background: var(--color-primary-subtle);
		border-color: var(--color-primary-base);
		color: var(--color-primary-base);
	}
	
	/* Operations Bar */
	.operations-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--color-primary-subtle);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-primary-base);
	}
	
	.operations-info {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	
	.selected-count {
		font-weight: 600;
		color: var(--color-primary-base);
	}
	
	.max-selection {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}
	
	.operations-list {
		display: flex;
		gap: 0.5rem;
	}
	
	.operation-button {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.operation-button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: var(--shadow-subtle);
	}
	
	.operation-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.operation-safe {
		background: var(--color-success-subtle);
		border-color: var(--color-success-base);
		color: var(--color-success-base);
	}
	
	.operation-safe:hover:not(:disabled) {
		background: var(--color-success-base);
		color: white;
	}
	
	.operation-moderate {
		background: var(--color-warning-subtle);
		border-color: var(--color-warning-base);
		color: var(--color-warning-base);
	}
	
	.operation-moderate:hover:not(:disabled) {
		background: var(--color-warning-base);
		color: white;
	}
	
	.operation-dangerous {
		background: var(--color-error-subtle);
		border-color: var(--color-error-base);
		color: var(--color-error-base);
	}
	
	.operation-dangerous:hover:not(:disabled) {
		background: var(--color-error-base);
		color: white;
	}
	
	.operation-icon {
		font-size: 1rem;
	}
	
	/* Items Section */
	.items-section {
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	
	.items-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--color-border-secondary);
	}
	
	.items-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.items-count {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}
	
	.items-list {
		flex: 1;
		overflow-y: auto;
		max-height: 500px;
	}
	
	.item-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid var(--color-border-tertiary);
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.item-row:hover {
		background: var(--color-background-secondary);
	}
	
	.item-row.selected {
		background: var(--color-primary-subtle);
		border-left: 3px solid var(--color-primary-base);
		padding-left: calc(1.5rem - 3px);
	}
	
	.item-checkbox {
		flex-shrink: 0;
	}
	
	.item-checkbox input {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
	}
	
	.item-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}
	
	.item-label {
		font-weight: 500;
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.item-description {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.item-tags {
		display: flex;
		gap: 0.375rem;
		flex-shrink: 0;
	}
	
	.item-tag {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		background: var(--color-background-tertiary);
		border-radius: var(--radius-full);
		color: var(--color-text-secondary);
	}
	
	.item-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}
	
	.item-status {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-sm);
		font-weight: 500;
		text-transform: capitalize;
	}
	
	.item-status-active {
		background: var(--color-success-subtle);
		color: var(--color-success-base);
	}
	
	.item-status-inactive {
		background: var(--color-background-tertiary);
		color: var(--color-text-tertiary);
	}
	
	.item-status-pending {
		background: var(--color-warning-subtle);
		color: var(--color-warning-base);
	}
	
	.item-date {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
		font-variant-numeric: tabular-nums;
	}
	
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--color-text-tertiary);
		font-style: italic;
	}
	
	/* Progress Overlay */
	.progress-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}
	
	.progress-content {
		min-width: 400px;
		text-align: center;
	}
	
	.progress-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.progress-icon {
		font-size: 2rem;
	}
	
	.progress-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}
	
	.progress-status {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0 0 1.5rem 0;
	}
	
	.progress-bar-container {
		height: 8px;
		background: var(--color-background-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
		margin-bottom: 1rem;
	}
	
	.progress-bar-fill {
		height: 100%;
		background: var(--color-primary-base);
		transition: width var(--duration-medium);
	}
	
	.progress-details {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}
	
	.progress-percent {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	
	/* Success Indicator */
	.success-indicator {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-background-primary);
		padding: 2rem;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-floating);
		text-align: center;
		z-index: 1001;
		pointer-events: none;
	}
	
	.success-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}
	
	.success-message {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-success-base);
		margin: 0;
	}
	
	/* Confirmation Dialog */
	.confirm-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}
	
	.confirm-dialog {
		min-width: 400px;
		max-width: 500px;
	}
	
	.confirm-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.confirm-icon {
		font-size: 2rem;
	}
	
	.confirm-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}
	
	.confirm-message {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0 0 2rem 0;
	}
	
	.confirm-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.detailed-header {
			flex-direction: column;
			align-items: flex-start;
		}
		
		.search-controls {
			flex-direction: column;
		}
		
		.search-wrapper {
			width: 100%;
		}
		
		.select-all-button {
			width: 100%;
			justify-content: center;
		}
		
		.operations-bar {
			flex-direction: column;
			gap: 1rem;
		}
		
		.operations-list {
			width: 100%;
			flex-wrap: wrap;
		}
		
		.operation-button {
			flex: 1;
		}
		
		.item-tags,
		.item-description {
			display: none;
		}
		
		.progress-content,
		.confirm-dialog {
			min-width: 90vw;
			padding: 1rem;
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		* {
			transition: none !important;
			animation: none !important;
		}
	}
	
	/* High contrast */
	@media (prefers-contrast: high) {
		.item-row.selected {
			outline: 2px solid currentColor;
		}
		
		.operation-button {
			border-width: 2px;
		}
	}
</style>