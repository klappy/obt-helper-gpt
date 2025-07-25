<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	
	export let value = '';
	export let placeholder = 'Type something...';
	export let minRows = 1;
	export let maxRows = 10;
	export let disabled = false;
	export let readonly = false;
	export let maxLength: number | null = null;
	export let resize: 'none' | 'vertical' | 'horizontal' | 'both' = 'none';
	export let autoFocus = false;
	export let spellcheck = true;
	export let required = false;
	export let name = '';
	export let id = '';
	export let ariaLabel = '';
	export let className = '';
	
	const dispatch = createEventDispatcher();
	
	let textareaElement: HTMLTextAreaElement;
	let lineHeight = 24; // Default line height
	let paddingHeight = 16; // Default padding
	
	// Calculate the height based on content
	function updateHeight() {
		if (!textareaElement) return;
		
		// Reset height to get accurate scrollHeight
		textareaElement.style.height = 'auto';
		
		// Calculate new height
		const minHeight = lineHeight * minRows + paddingHeight;
		const maxHeight = lineHeight * maxRows + paddingHeight;
		const contentHeight = textareaElement.scrollHeight;
		
		// Apply constraints
		const newHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);
		textareaElement.style.height = `${newHeight}px`;
		
		// Update overflow based on whether we've hit max height
		textareaElement.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
	}
	
	// Get computed styles on mount
	function initializeStyles() {
		if (!textareaElement) return;
		
		const styles = window.getComputedStyle(textareaElement);
		lineHeight = parseInt(styles.lineHeight) || 24;
		
		const paddingTop = parseInt(styles.paddingTop) || 8;
		const paddingBottom = parseInt(styles.paddingBottom) || 8;
		paddingHeight = paddingTop + paddingBottom;
		
		// Initial height calculation
		updateHeight();
	}
	
	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		value = target.value;
		updateHeight();
		dispatch('input', { value });
	}
	
	function handleChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		value = target.value;
		dispatch('change', { value });
	}
	
	function handleKeyDown(event: KeyboardEvent) {
		dispatch('keydown', event);
		
		// Handle Cmd/Ctrl + Enter for submit
		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			dispatch('submit', { value });
		}
	}
	
	function handleFocus() {
		dispatch('focus');
	}
	
	function handleBlur() {
		dispatch('blur');
	}
	
	function handlePaste(event: ClipboardEvent) {
		dispatch('paste', event);
		// Update height after paste (with small delay for content to update)
		setTimeout(updateHeight, 0);
	}
	
	// Public method to focus the textarea
	export function focus() {
		textareaElement?.focus();
	}
	
	// Public method to select all text
	export function select() {
		textareaElement?.select();
	}
	
	// Public method to get selection
	export function getSelection() {
		if (!textareaElement) return null;
		return {
			start: textareaElement.selectionStart,
			end: textareaElement.selectionEnd,
			text: value.substring(textareaElement.selectionStart, textareaElement.selectionEnd)
		};
	}
	
	// Update height when value changes externally
	$: if (textareaElement && value !== undefined) {
		updateHeight();
	}
	
	onMount(() => {
		initializeStyles();
		
		if (autoFocus) {
			textareaElement.focus();
		}
		
		// Handle resize observer for container changes
		const resizeObserver = new ResizeObserver(() => {
			updateHeight();
		});
		
		resizeObserver.observe(textareaElement);
		
		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div class="auto-resize-textarea-wrapper {className}">
	<textarea
		bind:this={textareaElement}
		{value}
		{placeholder}
		{disabled}
		{readonly}
		{spellcheck}
		{required}
		{name}
		{id}
		rows={minRows}
		maxlength={maxLength}
		aria-label={ariaLabel || placeholder}
		on:input={handleInput}
		on:change={handleChange}
		on:keydown={handleKeyDown}
		on:focus={handleFocus}
		on:blur={handleBlur}
		on:paste={handlePaste}
		class="auto-resize-textarea"
		class:disabled
		class:readonly
		style="resize: {resize}"
	/>
	{#if maxLength}
		<div 
			class="character-count"
			class:warning={value.length > maxLength * 0.9}
			class:error={value.length >= maxLength}
		>
			<span class="count-current">{value.length}</span>
			<span class="count-separator">/</span>
			<span class="count-max">{maxLength}</span>
		</div>
	{/if}
</div>

<style>
	.auto-resize-textarea-wrapper {
		position: relative;
		width: 100%;
	}
	
	.auto-resize-textarea {
		width: 100%;
		min-height: auto;
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--surface-base);
		color: var(--text-primary);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		line-height: 1.5;
		transition: all var(--animation-quick);
		overflow-y: hidden;
		display: block;
		box-sizing: border-box;
	}
	
	.auto-resize-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-subtle);
		background: var(--surface-elevated);
	}
	
	.auto-resize-textarea:hover:not(:disabled):not(:focus) {
		border-color: var(--border-hover);
		background: var(--surface-raised);
	}
	
	.auto-resize-textarea.disabled,
	.auto-resize-textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--surface-subtle);
	}
	
	.auto-resize-textarea.readonly,
	.auto-resize-textarea:read-only {
		background: var(--surface-subtle);
		cursor: default;
	}
	
	.auto-resize-textarea::placeholder {
		color: var(--text-tertiary);
		opacity: 1;
	}
	
	.auto-resize-textarea::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}
	
	.auto-resize-textarea::-webkit-scrollbar-track {
		background: var(--surface-subtle);
		border-radius: var(--radius-sm);
	}
	
	.auto-resize-textarea::-webkit-scrollbar-thumb {
		background: var(--border-default);
		border-radius: var(--radius-sm);
		border: 2px solid transparent;
		background-clip: padding-box;
	}
	
	.auto-resize-textarea::-webkit-scrollbar-thumb:hover {
		background: var(--border-hover);
		background-clip: padding-box;
	}
	
	/* Character count */
	.character-count {
		position: absolute;
		bottom: var(--spacing-xs);
		right: var(--spacing-sm);
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		pointer-events: none;
		font-variant-numeric: tabular-nums;
		background: var(--surface-base);
		padding: 0 var(--spacing-xs);
		border-radius: var(--radius-sm);
		opacity: 0.8;
		transition: all var(--animation-quick);
	}
	
	.character-count.warning {
		color: var(--color-warning);
		opacity: 1;
	}
	
	.character-count.error {
		color: var(--color-error);
		opacity: 1;
		font-weight: 600;
	}
	
	.count-separator {
		margin: 0 2px;
		opacity: 0.5;
	}
	
	/* Dark mode */
	:global(.dark) .auto-resize-textarea {
		background: var(--surface-raised);
		border-color: var(--border-subtle);
	}
	
	:global(.dark) .auto-resize-textarea:focus {
		background: var(--surface-elevated);
	}
	
	:global(.dark) .character-count {
		background: var(--surface-raised);
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.auto-resize-textarea {
			font-size: 16px; /* Prevent zoom on iOS */
			padding: var(--spacing-xs) var(--spacing-sm);
		}
	}
	
	/* High contrast mode */
	@media (prefers-contrast: high) {
		.auto-resize-textarea {
			border-width: 2px;
		}
		
		.auto-resize-textarea:focus {
			border-width: 3px;
			box-shadow: none;
		}
	}
	
	/* Print styles */
	@media print {
		.auto-resize-textarea {
			border: 1px solid currentColor;
			box-shadow: none;
			min-height: auto !important;
			height: auto !important;
			overflow: visible !important;
		}
		
		.character-count {
			display: none;
		}
	}
</style>