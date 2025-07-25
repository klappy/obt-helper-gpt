<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { FloatingCard } from './ui/index.js';
	
	export let maxItems = 10;
	export let autoScroll = true;
	export let showTimestamps = true;
	export let showAvatars = true;
	export let variant: 'compact' | 'detailed' | 'minimal' = 'compact';
	export let filter: string[] = [];
	
	// Activity types
	const activityTypes = {
		message: { icon: '💬', color: 'var(--color-primary)', label: 'Message' },
		user_joined: { icon: '👋', color: 'var(--color-success)', label: 'User Joined' },
		user_left: { icon: '👋', color: 'var(--text-tertiary)', label: 'User Left' },
		tool_activated: { icon: '🤖', color: 'var(--color-secondary)', label: 'Tool Activated' },
		error: { icon: '❌', color: 'var(--color-error)', label: 'Error' },
		warning: { icon: '⚠️', color: 'var(--color-warning)', label: 'Warning' },
		success: { icon: '✅', color: 'var(--color-success)', label: 'Success' },
		cost_alert: { icon: '💰', color: 'var(--color-warning)', label: 'Cost Alert' },
		system: { icon: '⚙️', color: 'var(--text-secondary)', label: 'System' },
		api_call: { icon: '🔗', color: 'var(--color-info)', label: 'API Call' }
	};
	
	// Mock activities for demo
	let activities = [];
	let activityIdCounter = 0;
	let updateInterval;
	let feedElement: HTMLElement;
	
	// Generate mock activity
	function generateActivity() {
		const types = Object.keys(activityTypes);
		const type = types[Math.floor(Math.random() * types.length)];
		const users = ['Sarah', 'Mike', 'Emma', 'John', 'Lisa', 'David'];
		const tools = ['Grammar Assistant', 'Code Helper', 'Creative Writer', 'Data Analyst'];
		
		let title, description, metadata = {};
		
		switch (type) {
			case 'message':
				const user = users[Math.floor(Math.random() * users.length)];
				const tool = tools[Math.floor(Math.random() * tools.length)];
				title = `${user} sent a message`;
				description = `Using ${tool}`;
				metadata = { user, tool, messageLength: Math.floor(Math.random() * 200) + 50 };
				break;
				
			case 'user_joined':
				const newUser = users[Math.floor(Math.random() * users.length)];
				title = `${newUser} joined`;
				description = 'New session started';
				metadata = { user: newUser, sessionId: Math.random().toString(36).substring(7) };
				break;
				
			case 'user_left':
				const leftUser = users[Math.floor(Math.random() * users.length)];
				title = `${leftUser} left`;
				description = 'Session ended';
				metadata = { user: leftUser, duration: Math.floor(Math.random() * 3600) };
				break;
				
			case 'tool_activated':
				const activeTool = tools[Math.floor(Math.random() * tools.length)];
				title = `${activeTool} activated`;
				description = 'Processing request';
				metadata = { tool: activeTool, model: 'gpt-4o' };
				break;
				
			case 'error':
				title = 'API Error';
				description = 'Rate limit exceeded';
				metadata = { code: 429, endpoint: '/chat' };
				break;
				
			case 'warning':
				title = 'High response time';
				description = 'API latency increased';
				metadata = { latency: Math.floor(Math.random() * 1000) + 500 };
				break;
				
			case 'success':
				title = 'Backup completed';
				description = 'All data saved successfully';
				metadata = { items: Math.floor(Math.random() * 50) + 10 };
				break;
				
			case 'cost_alert':
				const cost = (Math.random() * 10).toFixed(2);
				title = 'Cost threshold reached';
				description = `Daily limit: $${cost}`;
				metadata = { cost, threshold: 10 };
				break;
				
			case 'system':
				title = 'System update';
				description = 'Performance optimizations applied';
				metadata = { version: '5.2.1' };
				break;
				
			case 'api_call':
				const endpoint = ['/chat', '/tools', '/sessions'][Math.floor(Math.random() * 3)];
				title = 'API request';
				description = `${endpoint} called`;
				metadata = { endpoint, duration: Math.floor(Math.random() * 200) + 50 };
				break;
		}
		
		return {
			id: ++activityIdCounter,
			type,
			title,
			description,
			metadata,
			timestamp: new Date(),
			read: false
		};
	}
	
	// Add new activity
	function addActivity(activity = generateActivity()) {
		// Filter if needed
		if (filter.length > 0 && !filter.includes(activity.type)) {
			return;
		}
		
		activities = [activity, ...activities].slice(0, maxItems);
		
		// Auto scroll to top if enabled
		if (autoScroll && feedElement) {
			setTimeout(() => {
				feedElement.scrollTop = 0;
			}, 100);
		}
	}
	
	// Mark activity as read
	function markAsRead(id: number) {
		activities = activities.map(a => 
			a.id === id ? { ...a, read: true } : a
		);
	}
	
	// Clear all activities
	export function clear() {
		activities = [];
	}
	
	// Format timestamp
	function formatTime(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		
		if (seconds < 60) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return date.toLocaleDateString();
	}
	
	// Get activity style
	function getActivityStyle(type: string) {
		return activityTypes[type] || activityTypes.system;
	}
	
	onMount(() => {
		// Initialize with some activities
		for (let i = 0; i < 5; i++) {
			addActivity();
		}
		
		// Simulate real-time updates
		updateInterval = setInterval(() => {
			if (Math.random() > 0.7) {
				addActivity();
			}
		}, 3000) as unknown as number;
	});
	
	onDestroy(() => {
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	});
</script>

<div class="activity-feed activity-feed-{variant}" bind:this={feedElement}>
	{#if variant === 'minimal'}
		<!-- Minimal variant - just icons and title -->
		<div class="feed-minimal">
			{#each activities as activity (activity.id)}
				<div 
					class="activity-minimal"
					class:unread={!activity.read}
					on:click={() => markAsRead(activity.id)}
					in:fly={{ x: -20, duration: 300 }}
					out:fade={{ duration: 200 }}
					animate:flip={{ duration: 300 }}
				>
					<span 
						class="activity-icon"
						style="color: {getActivityStyle(activity.type).color}"
					>
						{getActivityStyle(activity.type).icon}
					</span>
					<span class="activity-title">{activity.title}</span>
					{#if showTimestamps}
						<time class="activity-time">{formatTime(activity.timestamp)}</time>
					{/if}
				</div>
			{/each}
		</div>
		
	{:else if variant === 'compact'}
		<!-- Compact variant - standard feed -->
		<div class="feed-compact">
			{#each activities as activity (activity.id)}
				<div 
					class="activity-compact"
					class:unread={!activity.read}
					on:click={() => markAsRead(activity.id)}
					in:fly={{ x: -20, duration: 300 }}
					out:fade={{ duration: 200 }}
					animate:flip={{ duration: 300 }}
				>
					<FloatingCard depth={activity.read ? 1 : 2} hover={true} padding="sm">
						<div class="activity-content">
							{#if showAvatars}
								<div 
									class="activity-avatar"
									style="background-color: {getActivityStyle(activity.type).color}20"
								>
									<span style="color: {getActivityStyle(activity.type).color}">
										{getActivityStyle(activity.type).icon}
									</span>
								</div>
							{/if}
							
							<div class="activity-details">
								<h4 class="activity-title">{activity.title}</h4>
								<p class="activity-description">{activity.description}</p>
								
								{#if showTimestamps}
									<div class="activity-meta">
										<time class="activity-timestamp">
											{formatTime(activity.timestamp)}
										</time>
										<span class="activity-type">
											{getActivityStyle(activity.type).label}
										</span>
									</div>
								{/if}
							</div>
							
							{#if !activity.read}
								<div class="unread-indicator" />
							{/if}
						</div>
					</FloatingCard>
				</div>
			{/each}
		</div>
		
	{:else}
		<!-- Detailed variant - full information -->
		<div class="feed-detailed">
			{#each activities as activity (activity.id)}
				<div 
					class="activity-detailed"
					class:unread={!activity.read}
					in:slide={{ duration: 300 }}
					out:slide={{ duration: 200 }}
					animate:flip={{ duration: 300 }}
				>
					<FloatingCard depth={activity.read ? 2 : 3} hover={true}>
						<div class="activity-header">
							<div class="header-left">
								<div 
									class="activity-badge"
									style="background-color: {getActivityStyle(activity.type).color}"
								>
									{getActivityStyle(activity.type).icon}
								</div>
								<div>
									<h3 class="activity-title">{activity.title}</h3>
									<p class="activity-description">{activity.description}</p>
								</div>
							</div>
							
							<div class="header-right">
								{#if !activity.read}
									<button 
										class="mark-read-button"
										on:click={() => markAsRead(activity.id)}
										aria-label="Mark as read"
									>
										✓
									</button>
								{/if}
							</div>
						</div>
						
						{#if Object.keys(activity.metadata).length > 0}
							<div class="activity-metadata">
								{#each Object.entries(activity.metadata) as [key, value]}
									<div class="metadata-item">
										<span class="metadata-key">{key}:</span>
										<span class="metadata-value">{value}</span>
									</div>
								{/each}
							</div>
						{/if}
						
						<div class="activity-footer">
							<time class="activity-timestamp">
								{activity.timestamp.toLocaleString()}
							</time>
							<span class="activity-category">
								{getActivityStyle(activity.type).label}
							</span>
						</div>
					</FloatingCard>
				</div>
			{/each}
		</div>
	{/if}
	
	{#if activities.length === 0}
		<div class="empty-state">
			<span class="empty-icon">📭</span>
			<p class="empty-text">No recent activity</p>
		</div>
	{/if}
</div>

<style>
	.activity-feed {
		position: relative;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
	}
	
	/* Minimal variant */
	.feed-minimal {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm);
	}
	
	.activity-minimal {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--animation-quick);
		font-size: var(--text-sm);
	}
	
	.activity-minimal:hover {
		background: var(--surface-hover);
	}
	
	.activity-minimal.unread {
		font-weight: 600;
	}
	
	.activity-icon {
		font-size: 16px;
		flex-shrink: 0;
	}
	
	.activity-minimal .activity-title {
		flex: 1;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.activity-time {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		flex-shrink: 0;
	}
	
	/* Compact variant */
	.feed-compact {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
	}
	
	.activity-compact {
		position: relative;
		cursor: pointer;
	}
	
	.activity-content {
		display: flex;
		gap: var(--spacing-sm);
		align-items: flex-start;
		position: relative;
	}
	
	.activity-avatar {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		font-size: 20px;
	}
	
	.activity-details {
		flex: 1;
		min-width: 0;
	}
	
	.activity-compact .activity-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 2px 0;
	}
	
	.activity-description {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 0;
	}
	
	.activity-meta {
		display: flex;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-xs);
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}
	
	.activity-timestamp {
		color: var(--text-tertiary);
	}
	
	.activity-type {
		padding: 2px 8px;
		background: var(--surface-subtle);
		border-radius: var(--radius-sm);
		font-weight: 500;
	}
	
	.unread-indicator {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 8px;
		height: 8px;
		background: var(--color-primary);
		border-radius: 50%;
		box-shadow: 0 0 0 2px var(--surface-base);
	}
	
	/* Detailed variant */
	.feed-detailed {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
	}
	
	.activity-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--spacing-sm);
	}
	
	.header-left {
		display: flex;
		gap: var(--spacing-sm);
		align-items: flex-start;
		flex: 1;
	}
	
	.activity-badge {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 24px;
		flex-shrink: 0;
	}
	
	.activity-detailed .activity-title {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 4px 0;
	}
	
	.mark-read-button {
		width: 32px;
		height: 32px;
		border: none;
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--animation-quick);
	}
	
	.mark-read-button:hover {
		background: var(--surface-hover);
		color: var(--color-success);
		transform: scale(1.1);
	}
	
	.activity-metadata {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: var(--surface-subtle);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-sm);
	}
	
	.metadata-item {
		display: flex;
		gap: var(--spacing-xs);
		font-size: var(--text-xs);
		padding: 4px 8px;
		background: var(--surface-base);
		border-radius: var(--radius-sm);
	}
	
	.metadata-key {
		color: var(--text-tertiary);
		text-transform: capitalize;
	}
	
	.metadata-value {
		color: var(--text-primary);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
	
	.activity-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		padding-top: var(--spacing-sm);
		border-top: 1px solid var(--border-subtle);
	}
	
	.activity-category {
		padding: 2px 8px;
		background: var(--surface-subtle);
		border-radius: var(--radius-sm);
		font-weight: 500;
	}
	
	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-2xl);
		opacity: 0.5;
	}
	
	.empty-icon {
		font-size: 48px;
		opacity: 0.5;
	}
	
	.empty-text {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		margin: 0;
	}
	
	/* Scrollbar styling */
	.activity-feed::-webkit-scrollbar {
		width: 6px;
	}
	
	.activity-feed::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.activity-feed::-webkit-scrollbar-thumb {
		background: var(--border-subtle);
		border-radius: var(--radius-sm);
	}
	
	.activity-feed::-webkit-scrollbar-thumb:hover {
		background: var(--border-default);
	}
	
	/* Dark mode */
	:global(.dark) .activity-minimal:hover {
		background: var(--surface-raised);
	}
	
	:global(.dark) .activity-badge {
		opacity: 0.9;
	}
	
	:global(.dark) .metadata-item {
		background: var(--surface-raised);
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.feed-compact,
		.feed-detailed {
			padding: var(--spacing-sm);
		}
		
		.activity-avatar {
			width: 32px;
			height: 32px;
			font-size: 16px;
		}
		
		.activity-badge {
			width: 40px;
			height: 40px;
			font-size: 20px;
		}
		
		.activity-metadata {
			gap: var(--spacing-xs);
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		.activity-minimal,
		.activity-compact,
		.activity-detailed {
			animation: none !important;
			transition: none !important;
		}
	}
	
	/* High contrast */
	@media (prefers-contrast: high) {
		.unread-indicator {
			box-shadow: 0 0 0 3px var(--surface-base);
		}
		
		.activity-type,
		.activity-category {
			border: 1px solid currentColor;
		}
	}
</style>