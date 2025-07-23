# Production Deployment Guide - v1.1.0

## 🚀 Deploying New Authentication to Netlify

Your code is pushing to GitHub and Netlify will auto-deploy. But you need to add the new environment variables first!

### 1. Add Environment Variables in Netlify

Go to: **Netlify Dashboard → Your Site → Site Settings → Environment Variables**

**Add these NEW variables:**

```
VITE_ADMIN_PASSWORD = [your-secure-password-from-local-env]
VITE_ALLOWED_ADMIN_EMAILS = christopher.klapp@eten.bible
```

**Existing variables (should already be there):**

```
OPENAI_API_KEY = [your-openai-key]
TWILIO_ACCOUNT_SID = [your-twilio-sid]
TWILIO_AUTH_TOKEN = [your-twilio-token]
TWILIO_PHONE_NUMBER = [your-whatsapp-number]
```

### 2. Check Deployment Status

1. Go to Netlify Dashboard → Your Site → Deploys
2. Look for the latest deploy (should show "Building" or "Published")
3. Click on it to see the build log

### 3. Test Production

Once deployed:

1. **Test Admin Access:**
   - Go to: `https://your-site.netlify.app/admin`
   - Email: `christopher.klapp@eten.bible`
   - Password: [your new password]
   - Should see "Welcome, christopher.klapp@eten.bible"

2. **Test Tool Editing:**
   - Edit a tool in admin
   - Check that changes persist
   - Test WhatsApp if configured

3. **Test Functions:**
   - Go to: `https://your-site.netlify.app/.netlify/functions/verify-sync`
   - Should see JSON with tool count and status

### 4. Troubleshooting

**If admin login fails:**

- Check environment variables are set correctly
- Look for typos in email address
- Verify password matches your local `.env`

**If tools don't save:**

- Check Netlify function logs
- Verify Netlify Blobs is enabled (should be automatic)

**If 404 on functions:**

- Check deploy completed successfully
- Functions should be in deploy log: "5 functions deployed"

### 5. Security Notes

✅ **What's now secure:**

- No more "admin123" password
- Only your email can access admin
- Password stored in environment variables
- Proper session management

✅ **Production checklist:**

- [ ] Environment variables added to Netlify
- [ ] Deploy completed successfully
- [ ] Admin login works with your email
- [ ] Tool editing persists changes
- [ ] WhatsApp integration (if using) works

### 6. Adding More Admins Later

To add more admins, update the environment variable:

```
VITE_ALLOWED_ADMIN_EMAILS = christopher.klapp@eten.bible,friend@example.com,admin@company.com
```

No code changes needed - just update the environment variable and redeploy.

### 7. Next Steps

- Monitor the deployment
- Test thoroughly
- Consider setting up Google SSO later (docs in GOOGLE_SSO_IMPLEMENTATION_PLAN.md)
- Set up monitoring/alerts for your functions

---

**Need help?** Check the Netlify deploy logs first, then the function logs in the Netlify dashboard.
