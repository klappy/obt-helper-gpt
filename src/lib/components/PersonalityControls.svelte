<script>
	import { spring } from 'svelte/motion';
	import { fade, slide } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { FloatingCard } from '$lib/components/ui/index.js';

	export let personality = {
		friendliness: 50,
		formality: 50,
		creativity: 50,
		humor: 50,
		empathy: 50,
		assertiveness: 50,
		verbosity: 50,
		patience: 50
	};
	
	const dispatch = createEventDispatcher();
	
	// Personality trait definitions
	const traits = [
		{
			key: 'friendliness',
			label: 'Friendliness',
			icon: '😊',
			min: 'Reserved',
			max: 'Warm',
			description: 'How warm and approachable the assistant should be'
		},
		{
			key: 'formality',
			label: 'Formality',
			icon: '🎩',
			min: 'Casual',
			max: 'Professional',
			description: 'The level of professional language and tone'
		},
		{
			key: 'creativity',
			label: 'Creativity',
			icon: '🎨',
			min: 'Factual',
			max: 'Creative',
			description: 'How creative and imaginative responses should be'
		},
		{
			key: 'humor',
			label: 'Humor',
			icon: '😄',
			min: 'Serious',
			max: 'Playful',
			description: 'The amount of humor and wit in responses'
		},
		{
			key: 'empathy',
			label: 'Empathy',
			icon: '💖',
			min: 'Neutral',
			max: 'Empathetic',
			description: 'How understanding and emotionally aware the assistant is'
		},
		{
			key: 'assertiveness',
			label: 'Assertiveness',
			icon: '💪',
			min: 'Gentle',
			max: 'Confident',
			description: 'How confidently the assistant expresses opinions'
		},
		{
			key: 'verbosity',
			label: 'Verbosity',
			icon: '💬',
			min: 'Concise',
			max: 'Detailed',
			description: 'The length and detail of responses'
		},
		{
			key: 'patience',
			label: 'Patience',
			icon: '🕰️',
			min: 'Direct',
			max: 'Patient',
			description: 'How patient and thorough the assistant is'
		}
	];
	
	// Spring-animated values for smooth slider movement
	const springValues = {};
	traits.forEach(trait => {
		springValues[trait.key] = spring(personality[trait.key], {
			stiffness: 0.2,
			damping: 0.7
		});
	});
	
	// Presets for quick personality configurations
	const presets = [
		{
			name: 'Professional',
			icon: '💼',
			values: {
				friendliness: 40,
				formality: 90,
				creativity: 30,
				humor: 20,
				empathy: 50,
				assertiveness: 70,
				verbosity: 60,
				patience: 60
			}
		},
		{
			name: 'Friendly Helper',
			icon: '🤗',
			values: {
				friendliness: 90,
				formality: 30,
				creativity: 60,
				humor: 70,
				empathy: 80,
				assertiveness: 40,
				verbosity: 50,
				patience: 80
			}
		},
		{
			name: 'Creative Expert',
			icon: '🎭',
			values: {
				friendliness: 70,
				formality: 50,
				creativity: 90,
				humor: 60,
				empathy: 60,
				assertiveness: 80,
				verbosity: 70,
				patience: 50
			}
		},
		{
			name: 'Teacher',
			icon: '👩‍🏫',
			values: {
				friendliness: 80,
				formality: 60,
				creativity: 70,
				humor: 40,
				empathy: 90,
				assertiveness: 50,
				verbosity: 80,
				patience: 90
			}
		},
		{
			name: 'Tech Support',
			icon: '🔧',
			values: {
				friendliness: 60,
				formality: 70,
				creativity: 40,
				humor: 30,
				empathy: 70,
				assertiveness: 60,
				verbosity: 70,
				patience: 100
			}
		}
	];
	
	let hoveredTrait = null;
	let selectedPreset = null;
	
	// Update personality value
	function updateValue(key, value) {
		personality[key] = value;
		springValues[key].set(value);
		dispatch('change', { personality });
	}
	
	// Apply preset
	function applyPreset(preset) {
		selectedPreset = preset.name;
		Object.entries(preset.values).forEach(([key, value]) => {
			personality[key] = value;
			springValues[key].set(value);
		});
		dispatch('change', { personality });
		dispatch('preset', { preset: preset.name });
	}
	
	// Reset all values to center
	function resetAll() {
		selectedPreset = null;
		traits.forEach(trait => {
			personality[trait.key] = 50;
			springValues[trait.key].set(50);
		});
		dispatch('change', { personality });
		dispatch('reset');
	}
	
	// Get color based on value
	function getColor(value) {
		if (value < 33) return 'var(--color-primary-subtle)';
		if (value < 67) return 'var(--color-warning-subtle)';
		return 'var(--color-success-subtle)';
	}
</script>

<div class="personality-controls">
	<!-- Presets -->
	<div class="presets-section">
		<h3 class="section-title">Quick Presets</h3>
		<div class="presets-grid">
			{#each presets as preset}
				<button
					class="preset-button"
					class:selected={selectedPreset === preset.name}
					on:click={() => applyPreset(preset)}
					transition:fade={{ duration: 200 }}
				>
					<span class="preset-icon">{preset.icon}</span>
					<span class="preset-name">{preset.name}</span>
				</button>
			{/each}
			<button
				class="preset-button reset-button"
				on:click={resetAll}
			>
				<span class="preset-icon">↻</span>
				<span class="preset-name">Reset</span>
			</button>
		</div>
	</div>
	
	<!-- Personality Traits -->
	<div class="traits-section">
		<h3 class="section-title">Personality Traits</h3>
		<div class="traits-list">
			{#each traits as trait}
				<FloatingCard
					depth={hoveredTrait === trait.key ? 2 : 1}
					animate={true}
					padding="md"
				>
					<div 
						class="trait-control"
						on:mouseenter={() => hoveredTrait = trait.key}
						on:mouseleave={() => hoveredTrait = null}
						transition:slide={{ duration: 300 }}
					>
						<div class="trait-header">
							<span class="trait-icon">{trait.icon}</span>
							<span class="trait-label">{trait.label}</span>
							<span class="trait-value">{Math.round($springValues[trait.key])}</span>
						</div>
						
						{#if hoveredTrait === trait.key}
							<p class="trait-description" transition:fade={{ duration: 200 }}>
								{trait.description}
							</p>
						{/if}
						
						<div class="slider-container">
							<span class="slider-label-min">{trait.min}</span>
							
							<div class="slider-track">
								<div 
									class="slider-fill"
									style="width: {$springValues[trait.key]}%; background-color: {getColor(personality[trait.key])}"
								></div>
								<input
									type="range"
									min="0"
									max="100"
									step="1"
									value={personality[trait.key]}
									on:input={(e) => updateValue(trait.key, parseInt(e.target.value))}
									class="slider-input"
								/>
								<div 
									class="slider-thumb"
									style="left: {$springValues[trait.key]}%"
								></div>
							</div>
							
							<span class="slider-label-max">{trait.max}</span>
						</div>
					</div>
				</FloatingCard>
			{/each}
		</div>
	</div>
	
	<!-- Overall Personality Summary -->
	<FloatingCard depth={2} padding="lg" animate={true}>
		<div class="personality-summary">
			<h4 class="summary-title">Personality Summary</h4>
			<div class="summary-visualization">
				<svg viewBox="0 0 200 200" class="personality-radar">
					<!-- Background circles -->
					{#each [20, 40, 60, 80, 100] as radius}
						<circle
							cx="100"
							cy="100"
							r={radius}
							fill="none"
							stroke="var(--color-border-tertiary)"
							stroke-width="0.5"
						/>
					{/each}
					
					<!-- Trait lines -->
					{#each traits as trait, i}
						{@const angle = (i * 360 / traits.length - 90) * Math.PI / 180}
						{@const x = 100 + Math.cos(angle) * 100}
						{@const y = 100 + Math.sin(angle) * 100}
						<line
							x1="100"
							y1="100"
							x2={x}
							y2={y}
							stroke="var(--color-border-secondary)"
							stroke-width="0.5"
						/>
						<text
							x={100 + Math.cos(angle) * 110}
							y={100 + Math.sin(angle) * 110}
							text-anchor="middle"
							dominant-baseline="middle"
							class="radar-label"
						>
							{trait.icon}
						</text>
					{/each}
					
					<!-- Personality polygon -->
					<polygon
						points={traits.map((trait, i) => {
							const angle = (i * 360 / traits.length - 90) * Math.PI / 180;
							const value = $springValues[trait.key];
							const x = 100 + Math.cos(angle) * value;
							const y = 100 + Math.sin(angle) * value;
							return `${x},${y}`;
						}).join(' ')}
						fill="var(--color-primary-subtle)"
						stroke="var(--color-primary-base)"
						stroke-width="2"
						opacity="0.7"
					/>
				</svg>
			</div>
		</div>
	</FloatingCard>
</div>

<style>
	.personality-controls {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	/* Presets Section */
	.presets-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.presets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
	}
	
	.preset-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--color-background-secondary);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.preset-button:hover {
		background: var(--color-background-tertiary);
		border-color: var(--color-border-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-subtle);
	}
	
	.preset-button.selected {
		background: var(--color-primary-subtle);
		border-color: var(--color-primary-base);
		box-shadow: var(--shadow-standard);
	}
	
	.preset-icon {
		font-size: 1.5rem;
	}
	
	.preset-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}
	
	.reset-button {
		background: var(--color-background-tertiary);
		border-style: dashed;
	}
	
	/* Traits Section */
	.traits-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.traits-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.trait-control {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.trait-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.trait-icon {
		font-size: 1.25rem;
		width: 2rem;
		text-align: center;
	}
	
	.trait-label {
		flex: 1;
		font-weight: 500;
		color: var(--color-text-primary);
	}
	
	.trait-value {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		color: var(--color-text-secondary);
		min-width: 2.5rem;
		text-align: right;
	}
	
	.trait-description {
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
		line-height: 1.5;
		margin: 0;
	}
	
	/* Slider Styles */
	.slider-container {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.slider-label-min,
	.slider-label-max {
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
		white-space: nowrap;
		min-width: 4rem;
	}
	
	.slider-label-min {
		text-align: right;
	}
	
	.slider-track {
		flex: 1;
		height: 0.5rem;
		background: var(--color-background-tertiary);
		border-radius: var(--radius-full);
		position: relative;
		overflow: hidden;
		border: 1px solid var(--color-border-secondary);
	}
	
	.slider-fill {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		border-radius: var(--radius-full);
		transition: width var(--duration-fast);
	}
	
	.slider-input {
		position: absolute;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
		z-index: 2;
	}
	
	.slider-thumb {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 1.25rem;
		height: 1.25rem;
		background: var(--color-background-primary);
		border: 2px solid var(--color-primary-base);
		border-radius: var(--radius-full);
		box-shadow: var(--shadow-subtle);
		pointer-events: none;
		transition: transform var(--duration-fast);
	}
	
	.slider-container:hover .slider-thumb {
		transform: translate(-50%, -50%) scale(1.2);
		box-shadow: var(--shadow-standard);
	}
	
	/* Personality Summary */
	.personality-summary {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	
	.summary-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}
	
	.summary-visualization {
		width: 100%;
		max-width: 250px;
		aspect-ratio: 1;
	}
	
	.personality-radar {
		width: 100%;
		height: 100%;
	}
	
	.radar-label {
		font-size: 0.875rem;
		fill: var(--color-text-tertiary);
		user-select: none;
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.presets-grid {
			grid-template-columns: repeat(3, 1fr);
		}
		
		.slider-label-min,
		.slider-label-max {
			display: none;
		}
	}
</style>