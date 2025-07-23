# Google SSO Implementation Plan for OBT Helper GPT

## Overview

Replace the current simple password authentication with Google SSO to:

- Improve security
- Enable specific user access (starting with christopher.klapp@eten.bible)
- Allow easy addition of admin users later
- Remove hardcoded passwords

## Current State

- Simple password auth: "admin123"
- Session stored in browser (not server-side)
- No user management or permissions

## Implementation Approach

Given our stack (SvelteKit + Netlify Functions), we have several options:

### Option 1: Auth.js (Recommended)

- **Pros**: Built for Next/SvelteKit, extensive OAuth support, session management
- **Cons**: Additional dependency, some complexity

### Option 2: Lucia Auth

- **Pros**: Lightweight, TypeScript-first, flexible
- **Cons**: Requires database for sessions, more setup

### Option 3: DIY with Google OAuth2

- **Pros**: No dependencies, full control
- **Cons**: More code to maintain, security considerations

### Option 4: Netlify Identity

- **Pros**: Built into Netlify, easy setup
- **Cons**: Vendor lock-in, limited customization

## Recommended Solution: Auth.js with Serverless Adapter

### Why Auth.js?

1. Mature, well-tested OAuth implementation
2. Works great with serverless (Netlify Functions)
3. Built-in session management
4. Easy to add more providers later
5. Good TypeScript support

### Implementation Steps

#### 1. Install Dependencies

```bash
npm install @auth/sveltekit @auth/core
```

#### 2. Environment Variables

```env
AUTH_SECRET=<generate-random-32-char-string>
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
AUTHORIZED_EMAILS=christopher.klapp@eten.bible,other@example.com
```

#### 3. Create Auth Configuration

`src/auth.ts`:

```typescript
import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/core/providers/google";
import type { Handle } from "@sveltejs/kit";

const authorizedEmails = (process.env.AUTHORIZED_EMAILS || "").split(",");

export const handle = SvelteKitAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow specific emails
      const email = user.email || profile?.email;
      return authorizedEmails.includes(email);
    },
    async session({ session, token }) {
      // Add admin flag to session
      if (session?.user?.email && authorizedEmails.includes(session.user.email)) {
        session.user.isAdmin = true;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
}) satisfies Handle;
```

#### 4. Update Hooks

`src/hooks.server.ts`:

```typescript
import { handle as authHandle } from "./auth";
import { sequence } from "@sveltejs/kit/hooks";

export const handle = sequence(authHandle);
```

#### 5. Update Types

`src/app.d.ts`:

```typescript
declare global {
  namespace App {
    interface Session {
      user?: {
        email?: string;
        name?: string;
        image?: string;
        isAdmin?: boolean;
      };
    }
  }
}
```

#### 6. Update Login Page

`src/routes/login/+page.svelte`:

```svelte
<script>
  import { signIn, signOut } from "@auth/sveltekit/client";
  import { page } from '$app/stores';

  $: session = $page.data.session;
</script>

{#if session?.user}
  <div>
    <p>Signed in as {session.user.email}</p>
    <button on:click={() => signOut()}>Sign out</button>
  </div>
{:else}
  <div>
    <h1>Admin Login</h1>
    <button on:click={() => signIn('google')}>
      Sign in with Google
    </button>
  </div>
{/if}
```

#### 7. Protect Admin Routes

`src/routes/admin/+layout.server.ts`:

```typescript
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.getSession();

  if (!session?.user?.isAdmin) {
    throw redirect(303, "/login");
  }

  return {
    session,
  };
};
```

#### 8. Google Cloud Console Setup

1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins:
     - http://localhost:5173
     - https://your-app.netlify.app
   - Authorized redirect URIs:
     - http://localhost:5173/auth/callback/google
     - https://your-app.netlify.app/auth/callback/google

### Migration Plan

1. **Phase 1**: Implement alongside existing auth
   - Keep password auth working
   - Add Google SSO as alternative
   - Test with your account

2. **Phase 2**: Transition period
   - Make Google SSO primary
   - Keep password as fallback
   - Add deprecation notice

3. **Phase 3**: Remove old auth
   - Remove password auth completely
   - Update documentation
   - Archive old auth code

### Security Considerations

1. **Email Whitelist**: Only authorized emails can access admin
2. **Session Security**: Sessions stored server-side (not in localStorage)
3. **HTTPS Only**: OAuth requires secure connections
4. **Token Rotation**: Auth.js handles token refresh automatically
5. **CSRF Protection**: Built into Auth.js

### Alternative: Simpler JWT Approach

If Auth.js feels too heavy, we could:

1. Use Google's OAuth2 directly
2. Generate JWT on successful auth
3. Store JWT in httpOnly cookie
4. Validate JWT in middleware

But this means more security code to maintain.

### Testing Plan

1. Local development with test Google account
2. Deploy to preview branch on Netlify
3. Test with your primary account
4. Add additional admin accounts
5. Remove password auth

### Maintenance

- Regularly update Auth.js
- Monitor Google OAuth deprecations
- Review authorized email list quarterly
- Consider adding audit logs

## Decision Required

Before proceeding, we need to decide:

1. Auth.js (recommended) vs. custom implementation?
2. Keep password auth as fallback initially?
3. How to handle existing sessions during migration?
4. Add user activity logging?

## Next Steps

1. Set up Google Cloud Console project
2. Install dependencies
3. Implement basic Google SSO
4. Test locally
5. Deploy to staging
6. Plan migration timeline
