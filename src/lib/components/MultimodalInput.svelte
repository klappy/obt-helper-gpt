<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { FloatingCard } from './ui/index.js';
	import { AdaptiveButton } from './ui/index.js';
	
	export let value = '';
	export let placeholder = 'Type a message...';
	export let disabled = false;
	export let maxLength = 1000;
	export let showVoice = true;
	export let showAttachment = true;
	export let showQuickActions = true;
	export let isRecording = false;
	export let attachments: File[] = [];
	
	const dispatch = createEventDispatcher();
	
	let textareaElement: HTMLTextAreaElement;
	let fileInput: HTMLInputElement;
	let isFocused = false;
	let isDragging = false;
	let quickActionsOpen = false;
	
	// Auto-resize textarea
	function handleInput() {
		if (textareaElement) {
			textareaElement.style.height = 'auto';
			textareaElement.style.height = Math.min(textareaElement.scrollHeight, 120) + 'px';
		}
		dispatch('input', { value });
	}
	
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}
	
	function handleSubmit() {
		if (value.trim() || attachments.length > 0) {
			dispatch('submit', { value, attachments });
			value = '';
			attachments = [];
			if (textareaElement) {
				textareaElement.style.height = 'auto';
			}
		}
	}
	
	function handleVoiceToggle() {
		dispatch('voice', { recording: !isRecording });
	}
	
	function handleFileSelect() {
		fileInput?.click();
	}
	
	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			const newFiles = Array.from(input.files);
			attachments = [...attachments, ...newFiles];
			dispatch('attach', { files: newFiles });
		}
	}
	
	function removeAttachment(index: number) {
		attachments = attachments.filter((_, i) => i !== index);
		dispatch('removeAttachment', { index });
	}
	
	// Drag and drop
	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		
		if (event.dataTransfer?.files) {
			const newFiles = Array.from(event.dataTransfer.files);
			attachments = [...attachments, ...newFiles];
			dispatch('attach', { files: newFiles });
		}
	}
	
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}
	
	function handleDragLeave() {
		isDragging = false;
	}
	
	// Quick actions
	const quickActions = [
		{ id: 'template', icon: '📝', label: 'Templates' },
		{ id: 'schedule', icon: '🕐', label: 'Schedule' },
		{ id: 'location', icon: '📍', label: 'Location' },
		{ id: 'contact', icon: '👤', label: 'Contact' }
	];
	
	function handleQuickAction(action: typeof quickActions[0]) {
		dispatch('quickAction', action);
		quickActionsOpen = false;
	}
	
	// Format file size
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<div class="multimodal-input" class:focused={isFocused} class:dragging={isDragging}>
	<FloatingCard depth={isFocused ? 3 : 2} hover={false} animate={false} class="input-container">
		{#if attachments.length > 0}
			<div class="attachments-preview" transition:fade={{ duration: 200 }}>
				{#each attachments as file, index}
					<div class="attachment-item" transition:scale={{ duration: 200 }}>
						<span class="attachment-icon">📎</span>
						<div class="attachment-info">
							<span class="attachment-name">{file.name}</span>
							<span class="attachment-size">{formatFileSize(file.size)}</span>
						</div>
						<button 
							class="remove-attachment"
							on:click={() => removeAttachment(index)}
							aria-label="Remove attachment"
						>
							×
						</button>
					</div>
				{/each}
			</div>
		{/if}
		
		<div class="input-row">
			{#if showQuickActions}
				<button
					class="input-action"
					class:active={quickActionsOpen}
					on:click={() => quickActionsOpen = !quickActionsOpen}
					aria-label="Quick actions"
					{disabled}
				>
					<span class="action-icon">⚡</span>
				</button>
			{/if}
			
			{#if showAttachment}
				<button
					class="input-action"
					on:click={handleFileSelect}
					aria-label="Attach file"
					{disabled}
				>
					<span class="action-icon">📎</span>
				</button>
				<input
					bind:this={fileInput}
					type="file"
					multiple
					on:change={handleFileChange}
					style="display: none"
				/>
			{/if}
			
			<div 
				class="textarea-wrapper"
				on:drop={handleDrop}
				on:dragover={handleDragOver}
				on:dragleave={handleDragLeave}
			>
				<textarea
					bind:this={textareaElement}
					bind:value
					{placeholder}
					{disabled}
					{maxLength}
					on:input={handleInput}
					on:keydown={handleKeyDown}
					on:focus={() => isFocused = true}
					on:blur={() => isFocused = false}
					rows="1"
					aria-label="Message input"
				/>
				{#if value.length > maxLength * 0.8}
					<div class="char-count" class:warning={value.length > maxLength * 0.9}>
						{value.length} / {maxLength}
					</div>
				{/if}
			</div>
			
			{#if showVoice}
				<button
					class="input-action voice-button"
					class:recording={isRecording}
					on:click={handleVoiceToggle}
					aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
					{disabled}
				>
					<span class="action-icon">{isRecording ? '⏸️' : '🎤'}</span>
				</button>
			{/if}
			
			<AdaptiveButton
				variant="primary"
				size="sm"
				on:click={handleSubmit}
				disabled={disabled || (!value.trim() && attachments.length === 0)}
				aria-label="Send message"
			>
				<span class="send-icon">↑</span>
			</AdaptiveButton>
		</div>
		
		{#if quickActionsOpen}
			<div class="quick-actions-menu" transition:scale={{ duration: 200 }}>
				{#each quickActions as action}
					<button
						class="quick-action-item"
						on:click={() => handleQuickAction(action)}
					>
						<span class="quick-action-icon">{action.icon}</span>
						<span class="quick-action-label">{action.label}</span>
					</button>
				{/each}
			</div>
		{/if}
	</FloatingCard>
</div>

<style>
	.multimodal-input {
		position: relative;
		width: 100%;
		transition: all var(--animation-smooth);
	}
	
	:global(.input-container) {
		width: 100% !important;
		overflow: visible !important;
	}
	
	.attachments-preview {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm);
		border-bottom: 1px solid var(--border-subtle);
	}
	
	.attachment-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
		font-size: var(--text-xs);
		max-width: 200px;
	}
	
	.attachment-icon {
		font-size: var(--text-sm);
		opacity: 0.7;
	}
	
	.attachment-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}
	
	.attachment-name {
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.attachment-size {
		color: var(--text-tertiary);
		font-size: var(--text-xs);
	}
	
	.remove-attachment {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border: none;
		background: none;
		color: var(--text-secondary);
		font-size: 20px;
		line-height: 1;
		cursor: pointer;
		opacity: 0.7;
		transition: all var(--animation-quick);
		border-radius: var(--radius-sm);
	}
	
	.remove-attachment:hover {
		opacity: 1;
		background: var(--surface-raised);
		color: var(--color-error);
	}
	
	.input-row {
		display: flex;
		align-items: flex-end;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm);
	}
	
	.input-action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: none;
		background: none;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: all var(--animation-quick);
		flex-shrink: 0;
	}
	
	.input-action:hover:not(:disabled) {
		background: var(--surface-raised);
		color: var(--text-primary);
		transform: scale(1.05);
	}
	
	.input-action:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.input-action.active {
		background: var(--surface-raised);
		color: var(--color-primary);
	}
	
	.voice-button.recording {
		color: var(--color-error);
		animation: pulse 1s ease-in-out infinite;
	}
	
	.action-icon {
		font-size: 18px;
		line-height: 1;
	}
	
	.textarea-wrapper {
		flex: 1;
		position: relative;
		min-width: 0;
	}
	
	.textarea-wrapper.dragging::after {
		content: '';
		position: absolute;
		inset: -4px;
		border: 2px dashed var(--color-primary);
		border-radius: var(--radius-md);
		pointer-events: none;
	}
	
	textarea {
		width: 100%;
		min-height: 36px;
		max-height: 120px;
		padding: var(--spacing-xs) var(--spacing-sm);
		border: none;
		background: var(--surface-subtle);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		line-height: 1.5;
		border-radius: var(--radius-md);
		resize: none;
		transition: all var(--animation-quick);
		overflow-y: auto;
	}
	
	textarea:focus {
		outline: none;
		background: var(--surface-base);
		box-shadow: inset 0 0 0 2px var(--color-primary-subtle);
	}
	
	textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.char-count {
		position: absolute;
		bottom: 4px;
		right: 8px;
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		pointer-events: none;
	}
	
	.char-count.warning {
		color: var(--color-warning);
	}
	
	.send-icon {
		font-size: 16px;
		font-weight: bold;
		display: block;
		transform: rotate(90deg);
	}
	
	.quick-actions-menu {
		position: absolute;
		bottom: 100%;
		left: var(--spacing-sm);
		margin-bottom: var(--spacing-xs);
		background: var(--surface-elevated);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-floating);
		overflow: hidden;
		z-index: 10;
	}
	
	.quick-action-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: none;
		background: none;
		color: var(--text-primary);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
		transition: all var(--animation-quick);
		white-space: nowrap;
	}
	
	.quick-action-item:hover {
		background: var(--surface-hover);
		color: var(--color-primary);
	}
	
	.quick-action-icon {
		font-size: 16px;
		width: 20px;
		text-align: center;
	}
	
	.quick-action-label {
		font-weight: 500;
	}
	
	/* Animations */
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.1);
		}
	}
	
	/* Dark mode */
	:global(.dark) textarea {
		background: var(--surface-raised);
	}
	
	:global(.dark) .input-action:hover:not(:disabled) {
		background: var(--surface-elevated);
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.input-row {
			padding: var(--spacing-xs);
		}
		
		.input-action {
			width: 32px;
			height: 32px;
		}
		
		.action-icon {
			font-size: 16px;
		}
		
		textarea {
			font-size: 16px; /* Prevent zoom on iOS */
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.voice-button.recording {
			animation: none;
			box-shadow: 0 0 0 2px var(--color-error);
		}
	}
</style>