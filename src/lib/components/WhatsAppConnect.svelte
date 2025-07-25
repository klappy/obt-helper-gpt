<script>
	import { onMount, onDestroy } from 'svelte';
	import { spring, tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale, slide } from 'svelte/transition';
	import { FloatingCard } from './ui/index.js';
	import { AdaptiveButton } from './ui/index.js';
	import { createEventDispatcher } from 'svelte';
	
	export let phoneNumber = '';
	export let countryCode = '+1';
	export let variant = 'full'; // 'full', 'compact', 'modal'
	
	const dispatch = createEventDispatcher();
	
	// Connection states
	const CONNECTION_STATES = {
		IDLE: 'idle',
		PHONE_INPUT: 'phone_input',
		SENDING_CODE: 'sending_code',
		CODE_VERIFICATION: 'code_verification',
		CONNECTING: 'connecting',
		CONNECTED: 'connected',
		ERROR: 'error'
	};
	
	// Country codes
	const countryCodes = [
		{ code: '+1', country: 'United States', flag: '🇺🇸' },
		{ code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
		{ code: '+91', country: 'India', flag: '🇮🇳' },
		{ code: '+86', country: 'China', flag: '🇨🇳' },
		{ code: '+81', country: 'Japan', flag: '🇯🇵' },
		{ code: '+49', country: 'Germany', flag: '🇩🇪' },
		{ code: '+33', country: 'France', flag: '🇫🇷' },
		{ code: '+39', country: 'Italy', flag: '🇮🇹' },
		{ code: '+34', country: 'Spain', flag: '🇪🇸' },
		{ code: '+61', country: 'Australia', flag: '🇦🇺' },
		{ code: '+55', country: 'Brazil', flag: '🇧🇷' },
		{ code: '+52', country: 'Mexico', flag: '🇲🇽' },
		{ code: '+7', country: 'Russia', flag: '🇷🇺' },
		{ code: '+82', country: 'South Korea', flag: '🇰🇷' },
		{ code: '+31', country: 'Netherlands', flag: '🇳🇱' }
	];
	
	// State management
	let currentState = CONNECTION_STATES.IDLE;
	let verificationCode = '';
	let errorMessage = '';
	let sessionInfo = null;
	let resendTimer = 0;
	let resendInterval = null;
	
	// Animation values
	const progressValue = tweened(0, { duration: 300, easing: cubicOut });
	const stepScale = spring(1, { stiffness: 0.2, damping: 0.7 });
	const successScale = spring(0, { stiffness: 0.3, damping: 0.4 });
	
	// Progress steps
	$: progressSteps = [
		{ 
			id: 'phone', 
			label: 'Phone Number', 
			state: CONNECTION_STATES.PHONE_INPUT,
			icon: '📱'
		},
		{ 
			id: 'verify', 
			label: 'Verification', 
			state: CONNECTION_STATES.CODE_VERIFICATION,
			icon: '🔐'
		},
		{ 
			id: 'connect', 
			label: 'Connect', 
			state: CONNECTION_STATES.CONNECTING,
			icon: '🔗'
		}
	];
	
	// Current step index
	$: currentStepIndex = progressSteps.findIndex(step => 
		step.state === currentState
	);
	
	// Update progress
	$: {
		const progress = currentStepIndex >= 0 
			? ((currentStepIndex + 1) / progressSteps.length) * 100
			: 0;
		progressValue.set(progress);
	}
	
	// Format phone number for display
	function formatPhoneDisplay(number) {
		// Remove all non-digits
		const cleaned = number.replace(/\D/g, '');
		
		// Format based on length (US format example)
		if (cleaned.length <= 3) {
			return cleaned;
		} else if (cleaned.length <= 6) {
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
		} else {
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
		}
	}
	
	// Validate phone number
	function validatePhoneNumber() {
		const cleaned = phoneNumber.replace(/\D/g, '');
		return cleaned.length >= 10;
	}
	
	// Handle phone number submission
	async function submitPhoneNumber() {
		if (!validatePhoneNumber()) {
			errorMessage = 'Please enter a valid phone number';
			return;
		}
		
		currentState = CONNECTION_STATES.SENDING_CODE;
		errorMessage = '';
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// Success - move to verification
			currentState = CONNECTION_STATES.CODE_VERIFICATION;
			startResendTimer();
			
			dispatch('codeSent', { 
				phoneNumber: countryCode + phoneNumber 
			});
			
		} catch (error) {
			currentState = CONNECTION_STATES.ERROR;
			errorMessage = 'Failed to send verification code. Please try again.';
			
			dispatch('error', { 
				error: errorMessage,
				stage: 'send_code'
			});
		}
	}
	
	// Start resend timer
	function startResendTimer() {
		resendTimer = 60;
		resendInterval = setInterval(() => {
			resendTimer--;
			if (resendTimer <= 0) {
				clearInterval(resendInterval);
				resendInterval = null;
			}
		}, 1000);
	}
	
	// Resend verification code
	async function resendCode() {
		if (resendTimer > 0) return;
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			startResendTimer();
			
			dispatch('codeResent', { 
				phoneNumber: countryCode + phoneNumber 
			});
			
		} catch (error) {
			errorMessage = 'Failed to resend code. Please try again.';
		}
	}
	
	// Handle verification code submission
	async function submitVerificationCode() {
		if (verificationCode.length !== 6) {
			errorMessage = 'Please enter the 6-digit code';
			return;
		}
		
		currentState = CONNECTION_STATES.CONNECTING;
		errorMessage = '';
		
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 3000));
			
			// Success - connected
			currentState = CONNECTION_STATES.CONNECTED;
			sessionInfo = {
				phoneNumber: countryCode + phoneNumber,
				sessionId: `wa_${Date.now()}`,
				connectedAt: new Date()
			};
			
			// Success animation
			successScale.set(1);
			setTimeout(() => successScale.set(0), 2000);
			
			dispatch('connected', { sessionInfo });
			
		} catch (error) {
			currentState = CONNECTION_STATES.ERROR;
			errorMessage = 'Invalid verification code. Please try again.';
			
			dispatch('error', { 
				error: errorMessage,
				stage: 'verify_code'
			});
		}
	}
	
	// Reset connection
	function resetConnection() {
		currentState = CONNECTION_STATES.IDLE;
		verificationCode = '';
		errorMessage = '';
		sessionInfo = null;
		if (resendInterval) {
			clearInterval(resendInterval);
			resendInterval = null;
		}
		resendTimer = 0;
	}
	
	// Start connection flow
	export function startConnection() {
		currentState = CONNECTION_STATES.PHONE_INPUT;
		stepScale.set(1.1);
		setTimeout(() => stepScale.set(1), 200);
	}
	
	// Handle input changes
	function handlePhoneInput(e) {
		// Allow only digits and formatting characters
		const value = e.target.value;
		const cleaned = value.replace(/[^\d-]/g, '');
		phoneNumber = cleaned;
	}
	
	function handleCodeInput(e, index) {
		const value = e.target.value;
		if (value.length > 1) {
			// Handle paste
			const cleaned = value.replace(/\D/g, '').slice(0, 6);
			verificationCode = cleaned;
			
			// Focus last input
			const inputs = e.target.parentElement.querySelectorAll('input');
			const lastIndex = Math.min(cleaned.length - 1, 5);
			inputs[lastIndex]?.focus();
		} else {
			// Single character input
			const cleaned = value.replace(/\D/g, '');
			const codeArray = verificationCode.split('');
			codeArray[index] = cleaned;
			verificationCode = codeArray.join('').slice(0, 6);
			
			// Auto-advance to next input
			if (cleaned && index < 5) {
				const inputs = e.target.parentElement.querySelectorAll('input');
				inputs[index + 1]?.focus();
			}
		}
		
		// Auto-submit when complete
		if (verificationCode.length === 6) {
			submitVerificationCode();
		}
	}
	
	function handleCodeKeydown(e, index) {
		if (e.key === 'Backspace' && !e.target.value && index > 0) {
			// Move to previous input on backspace
			const inputs = e.target.parentElement.querySelectorAll('input');
			inputs[index - 1]?.focus();
		}
	}
	
	// Cleanup
	onDestroy(() => {
		if (resendInterval) {
			clearInterval(resendInterval);
		}
	});
</script>

<div class="whatsapp-connect whatsapp-connect-{variant}">
	{#if variant === 'full'}
		<!-- Full variant with all steps visible -->
		<div class="connect-container">
			<!-- Header -->
			<div class="connect-header">
				<div class="header-content">
					<h2 class="connect-title">Connect WhatsApp</h2>
					<p class="connect-subtitle">
						Link your WhatsApp account to start using AI assistants
					</p>
				</div>
				
				{#if currentState !== CONNECTION_STATES.IDLE}
					<!-- Progress indicator -->
					<div class="progress-container">
						<div class="progress-track">
							<div 
								class="progress-fill"
								style="width: {$progressValue}%"
							/>
						</div>
						<div class="progress-steps">
							{#each progressSteps as step, index}
								<div 
									class="progress-step"
									class:active={index <= currentStepIndex}
									class:current={index === currentStepIndex}
								>
									<div class="step-icon">{step.icon}</div>
									<span class="step-label">{step.label}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Content -->
			<div class="connect-content">
				{#if currentState === CONNECTION_STATES.IDLE}
					<!-- Welcome state -->
					<div class="welcome-state" transition:fade>
						<FloatingCard depth={2} padding="xl">
							<div class="welcome-content">
								<div class="welcome-icon">💬</div>
								<h3 class="welcome-title">Ready to Connect?</h3>
								<p class="welcome-text">
									Connect your WhatsApp account to access AI assistants 
									directly in your chats. It's quick, secure, and easy.
								</p>
								<AdaptiveButton
									size="large"
									on:click={startConnection}
								>
									Get Started →
								</AdaptiveButton>
							</div>
						</FloatingCard>
					</div>
					
				{:else if currentState === CONNECTION_STATES.PHONE_INPUT || currentState === CONNECTION_STATES.SENDING_CODE}
					<!-- Phone input state -->
					<div 
						class="phone-state"
						style="transform: scale({$stepScale})"
						transition:scale
					>
						<FloatingCard depth={3} padding="lg">
							<div class="phone-content">
								<h3 class="state-title">Enter Your Phone Number</h3>
								<p class="state-description">
									We'll send you a verification code via WhatsApp
								</p>
								
								<div class="phone-input-group">
									<select 
										class="country-select"
										bind:value={countryCode}
										disabled={currentState === CONNECTION_STATES.SENDING_CODE}
									>
										{#each countryCodes as country}
											<option value={country.code}>
												{country.flag} {country.code}
											</option>
										{/each}
									</select>
									
									<input
										type="tel"
										class="phone-input"
										placeholder="123-456-7890"
										bind:value={phoneNumber}
										on:input={handlePhoneInput}
										on:keydown={(e) => e.key === 'Enter' && submitPhoneNumber()}
										disabled={currentState === CONNECTION_STATES.SENDING_CODE}
										maxlength="12"
									/>
								</div>
								
								{#if errorMessage && currentState === CONNECTION_STATES.PHONE_INPUT}
									<p class="error-message" transition:slide>
										{errorMessage}
									</p>
								{/if}
								
								<AdaptiveButton
									variant="primary"
									size="large"
									fullWidth
									loading={currentState === CONNECTION_STATES.SENDING_CODE}
									disabled={!validatePhoneNumber() || currentState === CONNECTION_STATES.SENDING_CODE}
									on:click={submitPhoneNumber}
								>
									{currentState === CONNECTION_STATES.SENDING_CODE ? 'Sending Code...' : 'Send Code'}
								</AdaptiveButton>
								
								<p class="privacy-note">
									🔒 Your phone number is encrypted and never shared
								</p>
							</div>
						</FloatingCard>
					</div>
					
				{:else if currentState === CONNECTION_STATES.CODE_VERIFICATION}
					<!-- Code verification state -->
					<div class="verification-state" transition:scale>
						<FloatingCard depth={3} padding="lg">
							<div class="verification-content">
								<h3 class="state-title">Enter Verification Code</h3>
								<p class="state-description">
									We sent a 6-digit code to {countryCode} {formatPhoneDisplay(phoneNumber)}
								</p>
								
								<div class="code-inputs">
									{#each Array(6) as _, index}
										<input
											type="text"
											class="code-input"
											maxlength="6"
											value={verificationCode[index] || ''}
											on:input={(e) => handleCodeInput(e, index)}
											on:keydown={(e) => handleCodeKeydown(e, index)}
											on:paste={(e) => handleCodeInput(e, index)}
										/>
									{/each}
								</div>
								
								{#if errorMessage && currentState === CONNECTION_STATES.CODE_VERIFICATION}
									<p class="error-message" transition:slide>
										{errorMessage}
									</p>
								{/if}
								
								<div class="resend-section">
									{#if resendTimer > 0}
										<p class="resend-timer">
											Resend code in {resendTimer}s
										</p>
									{:else}
										<button
											class="resend-button"
											on:click={resendCode}
										>
											Didn't receive code? Resend
										</button>
									{/if}
								</div>
								
								<button
									class="change-number-button"
									on:click={resetConnection}
								>
									Change phone number
								</button>
							</div>
						</FloatingCard>
					</div>
					
				{:else if currentState === CONNECTION_STATES.CONNECTING}
					<!-- Connecting state -->
					<div class="connecting-state" transition:scale>
						<FloatingCard depth={2} padding="xl">
							<div class="connecting-content">
								<div class="connecting-animation">
									<div class="spinner-ring"></div>
									<div class="whatsapp-icon">💬</div>
								</div>
								<h3 class="state-title">Connecting to WhatsApp</h3>
								<p class="state-description">
									Setting up your secure connection...
								</p>
							</div>
						</FloatingCard>
					</div>
					
				{:else if currentState === CONNECTION_STATES.CONNECTED}
					<!-- Connected state -->
					<div 
						class="connected-state"
						style="transform: scale({$successScale})"
						transition:scale
					>
						<FloatingCard depth={3} padding="xl">
							<div class="connected-content">
								<div class="success-icon">✅</div>
								<h3 class="state-title">Successfully Connected!</h3>
								<p class="state-description">
									Your WhatsApp is now linked to AI assistants
								</p>
								
								{#if sessionInfo}
									<div class="session-info">
										<div class="info-item">
											<span class="info-label">Phone:</span>
											<span class="info-value">{sessionInfo.phoneNumber}</span>
										</div>
										<div class="info-item">
											<span class="info-label">Session ID:</span>
											<span class="info-value">{sessionInfo.sessionId}</span>
										</div>
									</div>
								{/if}
								
								<AdaptiveButton
									size="large"
									variant="primary"
									on:click={() => dispatch('complete')}
								>
									Continue to Dashboard →
								</AdaptiveButton>
							</div>
						</FloatingCard>
					</div>
					
				{:else if currentState === CONNECTION_STATES.ERROR}
					<!-- Error state -->
					<div class="error-state" transition:scale>
						<FloatingCard depth={2} padding="lg">
							<div class="error-content">
								<div class="error-icon">❌</div>
								<h3 class="state-title">Connection Failed</h3>
								<p class="error-description">{errorMessage}</p>
								
								<AdaptiveButton
									variant="secondary"
									on:click={resetConnection}
								>
									Try Again
								</AdaptiveButton>
							</div>
						</FloatingCard>
					</div>
				{/if}
			</div>
		</div>
		
	{:else if variant === 'compact'}
		<!-- Compact variant -->
		<FloatingCard depth={2} padding="md">
			<div class="compact-connect">
				{#if currentState === CONNECTION_STATES.IDLE}
					<button
						class="compact-start"
						on:click={startConnection}
					>
						<span class="start-icon">💬</span>
						<span class="start-text">Connect WhatsApp</span>
						<span class="start-arrow">→</span>
					</button>
				{:else if currentState === CONNECTION_STATES.CONNECTED}
					<div class="compact-connected">
						<span class="connected-icon">✅</span>
						<span class="connected-text">Connected: {sessionInfo?.phoneNumber}</span>
					</div>
				{:else}
					<div class="compact-progress">
						<span class="progress-text">
							{progressSteps[currentStepIndex]?.label || 'Connecting'}...
						</span>
						<div class="compact-progress-bar">
							<div 
								class="compact-progress-fill"
								style="width: {$progressValue}%"
							/>
						</div>
					</div>
				{/if}
			</div>
		</FloatingCard>
		
	{:else if variant === 'modal'}
		<!-- Modal variant -->
		<div class="modal-overlay" on:click={() => dispatch('close')}>
			<div class="modal-content" on:click|stopPropagation>
				<button 
					class="modal-close"
					on:click={() => dispatch('close')}
				>
					×
				</button>
				
				<!-- Reuse full variant content -->
				<div class="whatsapp-connect whatsapp-connect-full">
					<!-- Same content as full variant -->
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.whatsapp-connect {
		width: 100%;
	}
	
	/* Full variant */
	.connect-container {
		max-width: 600px;
		margin: 0 auto;
	}
	
	.connect-header {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.connect-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin: 0 0 0.5rem 0;
	}
	
	.connect-subtitle {
		font-size: 1rem;
		color: var(--color-text-secondary);
		margin: 0;
	}
	
	/* Progress indicator */
	.progress-container {
		margin-top: 2rem;
	}
	
	.progress-track {
		height: 4px;
		background: var(--color-background-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
		margin-bottom: 1.5rem;
	}
	
	.progress-fill {
		height: 100%;
		background: var(--color-primary-base);
		transition: width var(--duration-medium);
	}
	
	.progress-steps {
		display: flex;
		justify-content: space-between;
	}
	
	.progress-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		opacity: 0.4;
		transition: all var(--duration-fast);
	}
	
	.progress-step.active {
		opacity: 1;
	}
	
	.progress-step.current {
		transform: scale(1.1);
	}
	
	.step-icon {
		font-size: 1.5rem;
	}
	
	.step-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}
	
	/* Content states */
	.connect-content {
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	/* Welcome state */
	.welcome-content {
		text-align: center;
		max-width: 400px;
	}
	
	.welcome-icon {
		font-size: 4rem;
		margin-bottom: 1.5rem;
	}
	
	.welcome-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 1rem 0;
	}
	
	.welcome-text {
		font-size: 1rem;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0 0 2rem 0;
	}
	
	/* Phone input state */
	.phone-content,
	.verification-content,
	.connecting-content,
	.connected-content,
	.error-content {
		max-width: 400px;
		width: 100%;
	}
	
	.state-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0 0 0.5rem 0;
		text-align: center;
	}
	
	.state-description {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0 0 2rem 0;
		text-align: center;
		line-height: 1.5;
	}
	
	.phone-input-group {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.country-select {
		width: 120px;
		padding: 0.75rem;
		background: var(--color-background-primary);
		border: 2px solid var(--color-border-secondary);
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.country-select:hover:not(:disabled) {
		border-color: var(--color-border-primary);
	}
	
	.country-select:focus {
		outline: none;
		border-color: var(--color-primary-base);
		box-shadow: 0 0 0 3px var(--color-primary-subtle);
	}
	
	.country-select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.phone-input {
		flex: 1;
		padding: 0.75rem 1rem;
		background: var(--color-background-primary);
		border: 2px solid var(--color-border-secondary);
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-weight: 500;
		transition: all var(--duration-fast);
	}
	
	.phone-input:hover:not(:disabled) {
		border-color: var(--color-border-primary);
	}
	
	.phone-input:focus {
		outline: none;
		border-color: var(--color-primary-base);
		box-shadow: 0 0 0 3px var(--color-primary-subtle);
	}
	
	.phone-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: var(--color-background-secondary);
	}
	
	.privacy-note {
		font-size: 0.8125rem;
		color: var(--color-text-tertiary);
		text-align: center;
		margin: 1.5rem 0 0 0;
	}
	
	/* Verification state */
	.code-inputs {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		margin-bottom: 2rem;
	}
	
	.code-input {
		width: 3rem;
		height: 3.5rem;
		text-align: center;
		font-size: 1.5rem;
		font-weight: 600;
		background: var(--color-background-primary);
		border: 2px solid var(--color-border-secondary);
		border-radius: var(--radius-md);
		transition: all var(--duration-fast);
	}
	
	.code-input:hover {
		border-color: var(--color-border-primary);
	}
	
	.code-input:focus {
		outline: none;
		border-color: var(--color-primary-base);
		box-shadow: 0 0 0 3px var(--color-primary-subtle);
		transform: scale(1.05);
	}
	
	.resend-section {
		text-align: center;
		margin-bottom: 1rem;
	}
	
	.resend-timer {
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
		margin: 0;
	}
	
	.resend-button {
		background: none;
		border: none;
		color: var(--color-primary-base);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: underline;
		transition: opacity var(--duration-fast);
	}
	
	.resend-button:hover {
		opacity: 0.8;
	}
	
	.change-number-button {
		display: block;
		width: 100%;
		padding: 0.5rem;
		background: none;
		border: none;
		color: var(--color-text-secondary);
		font-size: 0.8125rem;
		cursor: pointer;
		transition: color var(--duration-fast);
		text-decoration: underline;
	}
	
	.change-number-button:hover {
		color: var(--color-text-primary);
	}
	
	/* Connecting state */
	.connecting-content {
		text-align: center;
	}
	
	.connecting-animation {
		position: relative;
		width: 80px;
		height: 80px;
		margin: 0 auto 2rem;
	}
	
	.spinner-ring {
		position: absolute;
		inset: 0;
		border: 3px solid var(--color-border-tertiary);
		border-top-color: var(--color-primary-base);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.whatsapp-icon {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 2.5rem;
	}
	
	/* Connected state */
	.connected-content {
		text-align: center;
	}
	
	.success-icon {
		font-size: 4rem;
		margin-bottom: 1.5rem;
	}
	
	.session-info {
		background: var(--color-background-secondary);
		border-radius: var(--radius-md);
		padding: 1rem;
		margin: 1.5rem 0;
		text-align: left;
	}
	
	.info-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		font-size: 0.875rem;
	}
	
	.info-item + .info-item {
		border-top: 1px solid var(--color-border-tertiary);
	}
	
	.info-label {
		color: var(--color-text-secondary);
	}
	
	.info-value {
		font-weight: 500;
		color: var(--color-text-primary);
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}
	
	/* Error state */
	.error-content {
		text-align: center;
	}
	
	.error-icon {
		font-size: 3rem;
		margin-bottom: 1.5rem;
	}
	
	.error-description {
		font-size: 0.875rem;
		color: var(--color-error-base);
		margin: 0 0 2rem 0;
		line-height: 1.5;
	}
	
	.error-message {
		font-size: 0.8125rem;
		color: var(--color-error-base);
		margin: 0.5rem 0;
		text-align: center;
	}
	
	/* Compact variant */
	.compact-connect {
		padding: 0.5rem;
	}
	
	.compact-start {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--color-primary-subtle);
		border: 1px solid var(--color-primary-base);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	
	.compact-start:hover {
		background: var(--color-primary-base);
		color: white;
		transform: translateY(-1px);
		box-shadow: var(--shadow-subtle);
	}
	
	.start-icon {
		font-size: 1.25rem;
	}
	
	.start-text {
		flex: 1;
		font-weight: 500;
		text-align: left;
	}
	
	.start-arrow {
		font-size: 1.125rem;
		opacity: 0.7;
	}
	
	.compact-connected {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-success-base);
		font-size: 0.875rem;
	}
	
	.connected-icon {
		font-size: 1rem;
	}
	
	.compact-progress {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.progress-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}
	
	.compact-progress-bar {
		height: 4px;
		background: var(--color-background-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
	}
	
	.compact-progress-fill {
		height: 100%;
		background: var(--color-primary-base);
		transition: width var(--duration-medium);
	}
	
	/* Modal variant */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
		padding: 2rem;
	}
	
	.modal-content {
		position: relative;
		background: var(--color-background-primary);
		border-radius: var(--radius-xl);
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow: auto;
		box-shadow: var(--shadow-floating);
	}
	
	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-background-secondary);
		border: none;
		border-radius: var(--radius-full);
		font-size: 1.25rem;
		cursor: pointer;
		transition: all var(--duration-fast);
		z-index: 10;
	}
	
	.modal-close:hover {
		background: var(--color-background-tertiary);
		transform: scale(1.1);
	}
	
	/* Responsive */
	@media (max-width: 640px) {
		.connect-container {
			padding: 0 1rem;
		}
		
		.phone-input-group {
			flex-direction: column;
		}
		
		.country-select {
			width: 100%;
		}
		
		.code-inputs {
			gap: 0.25rem;
		}
		
		.code-input {
			width: 2.5rem;
			height: 3rem;
			font-size: 1.25rem;
		}
		
		.modal-overlay {
			padding: 1rem;
		}
	}
	
	/* Accessibility */
	@media (prefers-reduced-motion: reduce) {
		* {
			animation: none !important;
			transition: none !important;
		}
	}
	
	/* High contrast */
	@media (prefers-contrast: high) {
		.phone-input,
		.country-select,
		.code-input {
			border-width: 3px;
		}
	}
</style>