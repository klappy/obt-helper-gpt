# Email Authentication Setup

## Quick Setup (5 minutes)

### 1. Create/Update Your `.env` File

Add these lines to your `.env` file:

```env
# Admin Authentication
VITE_ADMIN_PASSWORD=your-secure-password-here
VITE_ALLOWED_ADMIN_EMAILS=christopher.klapp@eten.bible
```

### 2. Generate a Secure Password

Use one of these methods:

- Password manager (recommended)
- Online generator: https://passwordsgenerator.net/
- Command line: `openssl rand -base64 32`

### 3. For Local Development

Your `.env` file is already set up! Just run:

```bash
netlify dev
```

### 4. For Netlify Production

1. Go to Netlify Dashboard
2. Site Settings → Environment Variables
3. Add these variables:
   - `VITE_ADMIN_PASSWORD` = (your secure password)
   - `VITE_ALLOWED_ADMIN_EMAILS` = christopher.klapp@eten.bible

### 5. Adding More Admins

Update the environment variable with comma-separated emails:

```env
VITE_ALLOWED_ADMIN_EMAILS=christopher.klapp@eten.bible,trusted.friend@example.com,another.admin@example.com
```

## Testing

1. Go to `/admin`
2. Enter your email: `christopher.klapp@eten.bible`
3. Enter your password
4. You should see "Welcome, christopher.klapp@eten.bible" in the nav

## Security Notes

- ✅ Password is never visible in the UI
- ✅ Only whitelisted emails can login
- ✅ Session persists until logout
- ✅ Password stored only in environment variables
- ✅ Easy to revoke access (remove email from list)

## Troubleshooting

**"Invalid email or password" error:**

- Check email is in VITE_ALLOWED_ADMIN_EMAILS
- Check for typos in email
- Make sure no extra spaces in environment variable

**Session lost on refresh:**

- This is normal in dev mode sometimes
- Just log in again

**Can't see environment variables:**

- Restart `netlify dev` after changing .env
- Make sure .env is in project root
- Check variable names start with VITE\_

## Migration from admin123

Old way:

- Password: admin123
- No email required

New way:

- Email: christopher.klapp@eten.bible
- Password: (your secure password)

## Future: Google SSO

When you're ready to upgrade to Google SSO:

1. The email whitelist stays the same
2. Remove password requirement
3. Add Google OAuth
4. Same security, better UX
