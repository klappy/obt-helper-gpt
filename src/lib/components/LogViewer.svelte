<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import { spring, tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale, slide } from 'svelte/transition';
	import { FloatingCard } from './ui/index.js';
	import { AdaptiveButton } from './ui/index.js';
	import { createEventDispatcher } from 'svelte';
	
	export let logs = [];
	export let maxLogs = 1000;
	export let autoScroll = true;
	export let showLineNumbers = true;
	export let showTimestamps = true;
	export let enableFilter = true;
	export let enableSearch = true;
	export let variant = 'detailed'; // 'minimal', 'compact', 'detailed'
	
	const dispatch = createEventDispatcher();
	
	// Log levels and their properties
	const logLevels = {
		debug: { icon: '🔍', color: 'var(--color-text-tertiary)', order: 0 },
		info: { icon: 'ℹ️', color: 'var(--color-primary-base)', order: 1 },
		success: { icon: '✅', color: 'var(--color-success-base)', order: 2 },
		warning: { icon: '⚠️', color: 'var(--color-warning-base)', order: 3 },
		error: { icon: '❌', color: 'var(--color-error-base)', order: 4 },
		critical: { icon: '🚨', color: 'var(--color-error-base)', order: 5 }
	};
	
	// State management
	let container;
	let scrollContainer;
	let searchTerm = '';
	let activeFilters = new Set(['info', 'success', 'warning', 'error', 'critical']);
	let isScrolledToBottom = true;
	let selectedLog = null;
	let hoveredLog = null;
	let copiedLogId = null;
	
	// Animation values
	const scrollProgress = tweened(0, { duration: 300, easing: cubicOut });
	const filterHeight = spring(0, { stiffness: 0.2, damping: 0.7 });
	
	// Filtered and searched logs
	$: filteredLogs = logs.filter(log => {
		// Filter by level
		if (!activeFilters.has(log.level)) return false;
		
		// Search in message and metadata
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			return (
				log.message.toLowerCase().includes(term) ||
				log.source?.toLowerCase().includes(term) ||
				log.metadata?.toLowerCase().includes(term)
			);
		}
		
		return true;
	});
	
	// Grouped logs by time periods
	$: groupedLogs = groupLogsByTime(filteredLogs);
	
	// Group logs by time periods
	function groupLogsByTime(logs) {
		const groups = new Map();
		const now = Date.now();
		
		logs.forEach(log => {
			const timestamp = log.timestamp || now;
			const diff = now - timestamp;
			
			let groupKey;
			if (diff < 60000) groupKey = 'Last minute';
			else if (diff < 3600000) groupKey = 'Last hour';
			else if (diff < 86400000) groupKey = 'Today';
			else if (diff < 172800000) groupKey = 'Yesterday';
			else groupKey = 'Earlier';
			
			if (!groups.has(groupKey)) {
				groups.set(groupKey, []);
			}
			groups.get(groupKey).push(log);
		});
		
		return groups;
	}
	
	// Add new log entry
	export function addLog(level, message, source = null, metadata = null) {
		const log = {
			id: Date.now() + Math.random(),
			level,
			message,
			source,
			metadata,
			timestamp: Date.now()
		};
		
		logs = [...logs, log];
		
		// Limit logs
		if (logs.length > maxLogs) {
			logs = logs.slice(-maxLogs);
		}
		
		// Auto-scroll if at bottom
		if (autoScroll && isScrolledToBottom) {
			tick().then(scrollToBottom);
		}
		
		dispatch('logAdded', { log });
		
		return log.id;
	}
	
	// Clear logs
	export function clearLogs(level = null) {
		if (level) {
			logs = logs.filter(log => log.level !== level);
		} else {
			logs = [];
		}
		dispatch('logsCleared', { level });
	}
	
	// Scroll management
	function handleScroll() {
		if (!scrollContainer) return;
		
		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
		scrollProgress.set(scrollPercentage);
		
		// Check if scrolled to bottom
		isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50;
	}
	
	function scrollToBottom() {
		if (!scrollContainer) return;
		scrollContainer.scrollTop = scrollContainer.scrollHeight;
	}
	
	function scrollToTop() {
		if (!scrollContainer) return;
		scrollContainer.scrollTop = 0;
	}
	
	// Filter management
	function toggleFilter(level) {
		if (activeFilters.has(level)) {
			activeFilters.delete(level);
		} else {
			activeFilters.add(level);
		}
		activeFilters = activeFilters; // Trigger reactivity
		dispatch('filterChanged', { filters: Array.from(activeFilters) });
	}
	
	function toggleAllFilters() {
		if (activeFilters.size === Object.keys(logLevels).length) {
			activeFilters = new Set();
		} else {
			activeFilters = new Set(Object.keys(logLevels));
		}
		dispatch('filterChanged', { filters: Array.from(activeFilters) });
	}
	
	// Log actions
	function selectLog(log) {
		selectedLog = selectedLog?.id === log.id ? null : log;
		dispatch('logSelected', { log: selectedLog });
	}
	
	function copyLog(log) {
		const text = formatLogForCopy(log);
		navigator.clipboard.writeText(text).then(() => {
			copiedLogId = log.id;
			setTimeout(() => copiedLogId = null, 2000);
		});
	}
	
	function formatLogForCopy(log) {
		const timestamp = new Date(log.timestamp).toISOString();
		return `[${timestamp}] [${log.level.toUpperCase()}] ${log.source ? `[${log.source}] ` : ''}${log.message}${log.metadata ? `\n${log.metadata}` : ''}`;
	}
	
	// Export logs
	export function exportLogs(format = 'json') {
		const data = format === 'json' 
			? JSON.stringify(filteredLogs, null, 2)
			: filteredLogs.map(formatLogForCopy).join('\n');
		
		const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `logs-${new Date().toISOString()}.${format === 'json' ? 'json' : 'txt'}`;
		a.click();
		URL.revokeObjectURL(url);
		
		dispatch('logsExported', { format, count: filteredLogs.length });
	}
	
	// Generate sample logs
	function generateSampleLogs() {
		const sources = ['API', 'Database', 'Auth', 'Storage', 'Queue', 'WebSocket'];
		const messages = {
			debug: ['Variable initialized', 'Function called', 'Cache hit'],
			info: ['Request received', 'Process started', 'Configuration loaded'],
			success: ['Operation completed', 'Connection established', 'Data saved'],
			warning: ['Rate limit approaching', 'Memory usage high', 'Deprecated method used'],
			error: ['Connection failed', 'Invalid input', 'Resource not found'],
			critical: ['Service down', 'Database unreachable', 'Security breach detected']
		};
		
		// Generate 20 sample logs
		for (let i = 0; i < 20; i++) {
			const level = Object.keys(logLevels)[Math.floor(Math.random() * Object.keys(logLevels).length)];
			const source = sources[Math.floor(Math.random() * sources.length)];
			const messageList = messages[level];
			const message = messageList[Math.floor(Math.random() * messageList.length)];
			
			setTimeout(() => {
				addLog(level, message, source, Math.random() > 0.7 ? 'Additional context data' : null);
			}, i * 100);
		}
	}
	
	// Lifecycle
	onMount(() => {
		if (logs.length === 0 && variant === 'detailed') {
			generateSampleLogs();
		}
		
		if (autoScroll && scrollContainer) {
			scrollToBottom();
		}
	});
	
	// Keyboard shortcuts
	function handleKeydown(e) {
		if (e.key === 'Escape' && selectedLog) {
			selectedLog = null;
		} else if (e.ctrlKey && e.key === 'f') {
			e.preventDefault();
			// Focus search input
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="log-viewer log-viewer-{variant}" bind:this={container}>
	{#if variant === 'minimal'}
		<!-- Minimal variant - simple list -->
		<div class="logs-minimal">
			{#each filteredLogs.slice(-5) as log (log.id)}
				<div class="log-minimal" transition:fade={{ duration: 200 }}>
					<span class="log-level-icon" style="color: {logLevels[log.level].color}">
						{logLevels[log.level].icon}
					</span>
					<span class="log-message">{log.message}</span>
				</div>
			{/each}
		</div>
		
	{:else if variant === 'compact'}
		<!-- Compact variant - scrollable list with basic controls -->
		<FloatingCard depth={1} padding="none">
			<div class="logs-compact">
				<div class="compact-header">
					<h4 class="compact-title">System Logs</h4>
					<div class="compact-actions">
						<button class="compact-action" on:click={clearLogs} title="Clear logs">
							🗑️
						</button>
						<button class="compact-action" on:click={() => autoScroll = !autoScroll} title="Toggle auto-scroll">
							{autoScroll ? '⏸️' : '▶️'}
						</button>
					</div>
				</div>
				
				<div class="compact-logs" bind:this={scrollContainer} on:scroll={handleScroll}>
					{#each filteredLogs as log, index (log.id)}
						<div 
							class="log-compact"
							class:selected={selectedLog?.id === log.id}
							on:click={() => selectLog(log)}
							transition:slide={{ duration: 200 }}
						>
							{#if showLineNumbers}
								<span class="log-line-number">{index + 1}</span>
							{/if}
							<span class="log-level-icon" style="color: {logLevels[log.level].color}">
								{logLevels[log.level].icon}
							</span>
							<span class="log-message">{log.message}</span>
						</div>
					{/each}
				</div>
			</div>
		</FloatingCard>
		
	{:else}
		<!-- Detailed variant - full featured -->
		<div class="logs-detailed">
			<!-- Header -->
			<FloatingCard depth={2} padding="md">
				<div class="logs-header">
					<div class="header-left">
						<h3 class="logs-title">System Logs</h3>
						<div class="logs-stats">
							<span class="stat">Total: {logs.length}</span>
							<span class="stat">Filtered: {filteredLogs.length}</span>
						</div>
					</div>
					
					<div class="header-right">
						<div class="header-actions">
							<AdaptiveButton
								size="small"
								variant="secondary"
								on:click={() => exportLogs('json')}
							>
								📥 Export JSON
							</AdaptiveButton>
							<AdaptiveButton
								size="small"
								variant="secondary"
								on:click={() => exportLogs('text')}
							>
								📄 Export Text
							</AdaptiveButton>
							<AdaptiveButton
								size="small"
								variant="secondary"
								on:click={clearLogs}
							>
								🗑️ Clear All
							</AdaptiveButton>
						</div>
					</div>
				</div>
			</FloatingCard>
			
			<!-- Filters and Search -->
			{#if enableFilter || enableSearch}
				<FloatingCard depth={1} padding="md">
					<div class="logs-controls">
						{#if enableFilter}
							<div class="filter-section">
								<h4 class="section-title">Filter by Level</h4>
								<div class="filter-chips">
									<button
										class="filter-all"
										class:active={activeFilters.size === Object.keys(logLevels).length}
										on:click={toggleAllFilters}
									>
										All
									</button>
									{#each Object.entries(logLevels) as [level, config]}
										<button
											class="filter-chip"
											class:active={activeFilters.has(level)}
											style="--chip-color: {config.color}"
											on:click={() => toggleFilter(level)}
										>
											<span class="chip-icon">{config.icon}</span>
											<span class="chip-label">{level}</span>
											<span class="chip-count">
												{logs.filter(l => l.level === level).length}
											</span>
										</button>
									{/each}
								</div>
							</div>
						{/if}
						
						{#if enableSearch}
							<div class="search-section">
								<h4 class="section-title">Search</h4>
								<div class="search-input-wrapper">
									<span class="search-icon">🔍</span>
									<input
										type="text"
										class="search-input"
										placeholder="Search logs..."
										bind:value={searchTerm}
									/>
									{#if searchTerm}
										<button
											class="search-clear"
											on:click={() => searchTerm = ''}
										>
											×
										</button>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</FloatingCard>
			{/if}
			
			<!-- Log Content -->
			<FloatingCard depth={2} padding="none">
				<div class="logs-container">
					<!-- Scroll Progress -->
					<div class="scroll-progress">
						<div 
							class="scroll-progress-bar"
							style="width: {$scrollProgress}%"
						/>
					</div>
					
					<!-- Logs -->
					<div 
						class="logs-scroll-container"
						bind:this={scrollContainer}
						on:scroll={handleScroll}
					>
						{#if filteredLogs.length === 0}
							<div class="empty-state">
								<p class="empty-message">
									{searchTerm ? 'No logs match your search' : 'No logs to display'}
								</p>
							</div>
						{:else}
							{#each Array.from(groupedLogs.entries()) as [period, periodLogs]}
								<div class="log-group">
									<h5 class="group-title">{period}</h5>
									{#each periodLogs as log, index (log.id)}
										<div
											class="log-entry"
											class:selected={selectedLog?.id === log.id}
											class:hovered={hoveredLog === log.id}
											on:click={() => selectLog(log)}
											on:mouseenter={() => hoveredLog = log.id}
											on:mouseleave={() => hoveredLog = null}
											transition:slide={{ duration: 150 }}
										>
											{#if showLineNumbers}
												<span class="line-number">
													{logs.indexOf(log) + 1}
												</span>
											{/if}
											
											{#if showTimestamps}
												<time class="log-timestamp">
													{new Date(log.timestamp).toLocaleTimeString()}
												</time>
											{/if}
											
											<span 
												class="log-level"
												style="color: {logLevels[log.level].color}"
											>
												{logLevels[log.level].icon}
											</span>
											
											{#if log.source}
												<span class="log-source">[{log.source}]</span>
											{/if}
											
											<span class="log-message">{log.message}</span>
											
											<div class="log-actions">
												<button
													class="log-action"
													class:copied={copiedLogId === log.id}
													on:click|stopPropagation={() => copyLog(log)}
													title="Copy log"
												>
													{copiedLogId === log.id ? '✓' : '📋'}
												</button>
											</div>
											
											{#if selectedLog?.id === log.id && log.metadata}
												<div class="log-metadata" transition:slide={{ duration: 200 }}>
													<pre>{log.metadata}</pre>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{/each}
						{/if}
					</div>
					
					<!-- Scroll Controls -->
					<div class="scroll-controls">
						<button
							class="scroll-button"
							on:click={scrollToTop}
							title="Scroll to top"
						>
							⬆️
						</button>
						<button
							class="scroll-button"
							class:active={autoScroll}
							on:click={() => autoScroll = !autoScroll}
							title="{autoScroll ? 'Disable' : 'Enable'} auto-scroll"
						>
							{autoScroll ? '⏸️' : '▶️'}
						</button>
						<button
							class="scroll-button"
							on:click={scrollToBottom}
							title="Scroll to bottom"
						>
							⬇️
						</button>
					</div>
				</div>
			</FloatingCard>
		</div>
	{/if}
</div>

<style>
	.log-viewer {
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	
	/* Minimal Variant */
	.logs-minimal {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8125rem;
	}
	
	.log-minimal {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0;
		color: var(--color-text-secondary);
	}
	
	.log-level-icon {
		font-size: 0.875rem;
		flex-shrink: 0;
	}
	
	/* Compact Variant */
	.logs-compact {
		display: flex;
		flex-direction: column;
		height: 300px;
	}
	
	.compact-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border-secondary);
	}
	
	.compact-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}
	
	.compact-actions {
		display: flex;
		gap: 0.5rem;
	}
	
	.compact-action {
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		font-size: 0.875rem;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--duration-fast);
	}
	
	.compact-action:hover {
		background: var(--color-background-tertiary);
	}
	
	.compact-logs {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}
	
	.log-compact {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-xs);
		cursor: pointer;
		transition: background var(--duration-fast);
	}
	
	.log-compact:hover {
		background: var(--color-background-secondary);
	}
	
	.log-compact.selected {
		background: var(--color-primary-subtle);
	}
	
	/* Detailed Variant */
	.logs-detailed {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
	}
	
	.logs-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}
	
	.header-left {
		display: flex;
		align-items: baseline;
		gap: 1rem;
	}
	
	.logs-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
	}
	
	.logs-stats {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}
	
	.stat {
		font-variant-numeric: tabular-nums;
	}
	
	.header-actions {
		display: flex;
		gap: 0.5rem;
	}
	
	/* Controls */
	.logs-controls {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
	}
	
	.filter-section,
	.search-section {
		flex: 1;
		min-width: 250px;
	}
	
	.section-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.75rem 0;
	}
	
	.filter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	
	.filter-all,
	.filter-chip {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.75rem;
		background: var(--color-background-secondary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-full);
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all var(--duration-fast);
		white-space: nowrap;
	}
	
	.filter-all:hover,
	.filter-chip:hover {
		background: var(--color-background-tertiary);
		border-color: var(--color-border-primary);
		transform: translateY(-1px);
	}
	
	.filter-all.active,
	.filter-chip.active {
		background: var(--chip-color, var(--color-primary-subtle));
		border-color: var(--chip-color, var(--color-primary-base));
		color: var(--chip-color, var(--color-primary-base));
	}
	
	.chip-icon {
		font-size: 0.875rem;
	}
	
	.chip-label {
		font-weight: 500;
		text-transform: capitalize;
	}
	
	.chip-count {
		font-variant-numeric: tabular-nums;
		opacity: 0.7;
	}
	
	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}
	
	.search-icon {
		position: absolute;
		left: 0.75rem;
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
		pointer-events: none;
	}
	
	.search-input {
		flex: 1;
		padding: 0.5rem 2rem 0.5rem 2.25rem;
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
	
	.search-clear {
		position: absolute;
		right: 0.5rem;
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--color-text-tertiary);
		font-size: 1.125rem;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--duration-fast);
	}
	
	.search-clear:hover {
		background: var(--color-background-tertiary);
		color: var(--color-text-primary);
	}
	
	/* Log Container */
	.logs-container {
		position: relative;
		height: 100%;
		min-height: 400px;
		display: flex;
		flex-direction: column;
	}
	
	.scroll-progress {
		height: 2px;
		background: var(--color-background-tertiary);
		position: sticky;
		top: 0;
		z-index: 10;
	}
	
	.scroll-progress-bar {
		height: 100%;
		background: var(--color-primary-base);
		transition: width var(--duration-fast);
	}
	
	.logs-scroll-container {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		line-height: 1.6;
	}
	
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 200px;
	}
	
	.empty-message {
		color: var(--color-text-tertiary);
		font-style: italic;
		margin: 0;
	}
	
	.log-group {
		margin-bottom: 1.5rem;
	}
	
	.group-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.5rem 0;
		padding: 0.25rem 0;
		border-bottom: 1px solid var(--color-border-tertiary);
	}
	
	.log-entry {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.375rem 0.5rem;
		border-radius: var(--radius-xs);
		cursor: pointer;
		transition: all var(--duration-fast);
		position: relative;
		flex-wrap: wrap;
	}
	
	.log-entry:hover {
		background: var(--color-background-secondary);
	}
	
	.log-entry.selected {
		background: var(--color-primary-subtle);
		box-shadow: inset 2px 0 0 var(--color-primary-base);
	}
	
	.line-number {
		color: var(--color-text-tertiary);
		text-align: right;
		width: 3rem;
		flex-shrink: 0;
		font-variant-numeric: tabular-nums;
		opacity: 0.5;
	}
	
	.log-timestamp {
		color: var(--color-text-tertiary);
		flex-shrink: 0;
		font-variant-numeric: tabular-nums;
	}
	
	.log-level {
		flex-shrink: 0;
	}
	
	.log-source {
		color: var(--color-text-secondary);
		font-weight: 500;
		flex-shrink: 0;
	}
	
	.log-message {
		flex: 1;
		word-break: break-word;
		color: var(--color-text-primary);
	}
	
	.log-actions {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		opacity: 0;
		transition: opacity var(--duration-fast);
	}
	
	.log-entry:hover .log-actions {
		opacity: 1;
	}
	
	.log-action {
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-background-primary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.log-action:hover {
		background: var(--color-background-tertiary);
		border-color: var(--color-border-primary);
	}
	
	.log-action.copied {
		background: var(--color-success-subtle);
		border-color: var(--color-success-base);
		color: var(--color-success-base);
	}
	
	.log-metadata {
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: var(--color-background-tertiary);
		border-radius: var(--radius-xs);
		overflow-x: auto;
	}
	
	.log-metadata pre {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}
	
	/* Scroll Controls */
	.scroll-controls {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		display: flex;
		gap: 0.5rem;
		background: var(--color-background-primary);
		padding: 0.25rem;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-elevated);
		border: 1px solid var(--color-border-secondary);
	}
	
	.scroll-button {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-background-secondary);
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.scroll-button:hover {
		background: var(--color-background-tertiary);
		transform: translateY(-1px);
	}
	
	.scroll-button.active {
		background: var(--color-primary-subtle);
		color: var(--color-primary-base);
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.logs-header {
			flex-direction: column;
			align-items: flex-start;
		}
		
		.header-actions {
			width: 100%;
			justify-content: stretch;
		}
		
		.logs-controls {
			flex-direction: column;
			gap: 1rem;
		}
		
		.line-number {
			display: none;
		}
		
		.log-entry {
			font-size: 0.75rem;
		}
		
		.scroll-controls {
			bottom: 0.5rem;
			right: 0.5rem;
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		* {
			transition: none !important;
		}
	}
	
	/* High contrast */
	@media (prefers-contrast: high) {
		.log-entry.selected {
			outline: 2px solid currentColor;
		}
		
		.filter-chip.active {
			outline: 2px solid currentColor;
		}
	}
</style>