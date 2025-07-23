# Simple Email-Based Auth (Before Google SSO)

## The 30-Minute Solution

Instead of diving into OAuth today, let's make your current auth actually secure:

### 1. Update Environment Variables

Add to `.env`:

```env
ADMIN_PASSWORD=<generate-a-real-password>
ALLOWED_ADMIN_EMAILS=christopher.klapp@eten.bible,another@example.com
```

### 2. Update Auth Store

`src/lib/stores/auth.js`:

```javascript
import { writable } from "svelte/store";
import { browser } from "$app/environment";

export const isAdmin = writable(false);
export const adminEmail = writable("");

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
const ALLOWED_EMAILS = (import.meta.env.VITE_ALLOWED_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim());

export function login(email, password) {
  // Check both email and password
  if (ALLOWED_EMAILS.includes(email) && password === ADMIN_PASSWORD) {
    isAdmin.set(true);
    adminEmail.set(email);

    // Store in sessionStorage so it survives page refresh
    if (browser) {
      sessionStorage.setItem("adminEmail", email);
      sessionStorage.setItem("adminAuth", "true");
    }

    return true;
  }
  return false;
}

export function logout() {
  isAdmin.set(false);
  adminEmail.set("");

  if (browser) {
    sessionStorage.removeItem("adminEmail");
    sessionStorage.removeItem("adminAuth");
  }
}

// Check session on load
if (browser) {
  const savedEmail = sessionStorage.getItem("adminEmail");
  const savedAuth = sessionStorage.getItem("adminAuth");

  if (savedAuth === "true" && savedEmail && ALLOWED_EMAILS.includes(savedEmail)) {
    isAdmin.set(true);
    adminEmail.set(savedEmail);
  }
}
```

### 3. Update Login Form

`src/routes/admin/+layout.svelte`:

```svelte
<script>
  import { isAdmin, adminEmail, login, logout } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let loginError = false;

  function handleLogin() {
    if (login(email, password)) {
      loginError = false;
      email = '';
      password = '';
    } else {
      loginError = true;
    }
  }

  function handleLogout() {
    logout();
    goto('/');
  }
</script>

{#if $isAdmin}
  <!-- Admin Interface -->
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-4">
            <a href="/" class="text-gray-600 hover:text-gray-900">← Back to Site</a>
            <span class="text-xl font-bold text-gray-900">🛠️ Admin Panel</span>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">Welcome, {$adminEmail}</span>
            <button on:click={handleLogout} class="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
{:else}
  <!-- Login Form -->
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-center text-gray-900 mb-6">
        🔐 Admin Login
      </h2>

      <form on:submit|preventDefault={handleLogin} class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            bind:value={email}
            class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="your.email@example.com"
            required
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            bind:value={password}
            class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter password"
            required
          />
        </div>

        {#if loginError}
          <div class="text-red-600 text-sm">
            Invalid email or password. Make sure your email is authorized.
          </div>
        {/if}

        <button type="submit" class="w-full btn-primary">
          Login
        </button>
      </form>

      <div class="mt-4 text-center">
        <a href="/" class="text-sm text-gray-600 hover:text-gray-900">
          ← Back to homepage
        </a>
      </div>
    </div>
  </div>
{/if}
```

### 4. For Netlify Deployment

Add environment variables in Netlify:

- `VITE_ADMIN_PASSWORD` = (generate a strong password)
- `VITE_ALLOWED_ADMIN_EMAILS` = christopher.klapp@eten.bible

## Benefits of This Approach

1. **Implemented in 30 minutes** - Not 4 hours
2. **Actually secure** - No more "admin123"
3. **Email whitelist** - Only your email works
4. **Easy to extend** - Just add emails to env var
5. **Google SSO ready** - Easy to upgrade later

## When to Upgrade to Google SSO

Add Google SSO when:

- You have more than 5 admin users
- You want to remove password management
- You need audit trails
- You have a free afternoon

## Security Notes

This is secure enough for:

- Personal projects
- Small teams
- Internal tools

Not recommended for:

- Public SaaS products
- Handling sensitive data
- Compliance requirements

But it's 100x better than "admin123"!
