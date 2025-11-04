<script>
  import { onMount } from "svelte";
  import { register, isAuthenticated } from "$lib/stores/user-auth.js";
  import { goto } from "$app/navigation";

  let email = "";
  let password = "";
  let confirmPassword = "";
  let error = "";
  let loading = false;
  let isAuth = false;
  
  // Field-specific errors
  let emailError = "";
  let passwordError = "";
  let confirmPasswordError = "";

  // Check if already authenticated
  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe((value) => {
      isAuth = value;
      if (value) {
        goto("/dashboard");
      }
    });
    return unsubscribe;
  });

  function validateEmail(email) {
    if (!email) {
      return "Email is required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }
    return "";
  }

  function validatePassword(password) {
    if (!password) {
      return "Password is required.";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return "";
  }

  function validateConfirmPassword(confirmPassword, password) {
    if (!confirmPassword) {
      return "Please confirm your password.";
    }
    if (confirmPassword !== password) {
      return "Passwords do not match.";
    }
    return "";
  }

  async function handleRegister(e) {
    e.preventDefault();
    
    // Clear all errors
    error = "";
    emailError = "";
    passwordError = "";
    confirmPasswordError = "";

    // Validate each field
    emailError = validateEmail(email);
    passwordError = validatePassword(password);
    confirmPasswordError = validateConfirmPassword(confirmPassword, password);

    // If any field has an error, stop
    if (emailError || passwordError || confirmPasswordError) {
      return;
    }

    loading = true;

    try {
      await register(email, password);
      goto("/dashboard");
    } catch (err) {
      error = err.message || "Registration failed. Please try again.";
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
  <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
    <h1 class="text-3xl font-bold text-center mb-8 text-gray-900">Create Account</h1>

    {#if error}
      <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    {/if}

    <form on:submit={handleRegister} novalidate class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="text"
          autocomplete="email"
          bind:value={email}
          class="w-full px-4 py-3 text-gray-900 placeholder-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {emailError ? 'border-red-500' : 'border-gray-300'}"
          placeholder="your@email.com"
          disabled={loading}
        />
        {#if emailError}
          <p class="mt-1 text-xs text-red-600">{emailError}</p>
        {:else}
          <p class="mt-1 text-xs text-gray-500">Enter your email address</p>
        {/if}
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="new-password"
          bind:value={password}
          on:input={() => {
            // Clear errors when user/Safari changes password
            // Use setTimeout to handle Safari autofill which fills both fields
            setTimeout(() => {
              if (password === confirmPassword && password.length >= 6) {
                passwordError = "";
                confirmPasswordError = "";
              }
            }, 50);
          }}
          class="w-full px-4 py-3 text-gray-900 placeholder-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {passwordError ? 'border-red-500' : 'border-gray-300'}"
          placeholder="????????"
          disabled={loading}
        />
        {#if passwordError}
          <p class="mt-1 text-xs text-red-600">{passwordError}</p>
        {:else}
          <p class="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
        {/if}
      </div>

      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autocomplete="new-password"
          bind:value={confirmPassword}
          on:input={() => {
            // Clear errors when user/Safari changes confirm password
            // Use setTimeout to handle Safari autofill which fills both fields
            setTimeout(() => {
              if (password === confirmPassword && password.length >= 6) {
                passwordError = "";
                confirmPasswordError = "";
              }
            }, 50);
          }}
          class="w-full px-4 py-3 text-gray-900 placeholder-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {confirmPasswordError ? 'border-red-500' : 'border-gray-300'}"
          placeholder="????????"
          disabled={loading}
        />
        {#if confirmPasswordError}
          <p class="mt-1 text-xs text-red-600">{confirmPasswordError}</p>
        {:else}
          <p class="mt-1 text-xs text-gray-500">Re-enter your password</p>
        {/if}
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Creating account..." : "Register"}
      </button>
    </form>

    <div class="mt-6 text-center">
      <p class="text-sm text-gray-600">
        Already have an account?
        <a href="/login" class="text-blue-600 hover:text-blue-700 font-medium">
          Login
        </a>
      </p>
    </div>
  </div>
</div>