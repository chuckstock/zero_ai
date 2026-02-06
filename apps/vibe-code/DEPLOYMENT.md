# Vibe Code - Deployment Guide

## Production Deployment

### Prerequisites

- Convex account (free tier available)
- Vercel account (free tier available)
- OpenRouter API key with credits (from https://openrouter.ai)
- Replicate API key with credits

---

## Step 1: Deploy Convex Backend

### 1.1 Create Production Deployment

```bash
cd vibe-code

# Deploy to production
npx convex deploy --prod
```

This will:
- Create a new production deployment
- Upload all functions
- Generate production URL

**Save the production URL:** `https://your-app.convex.cloud`

### 1.2 Configure Environment Variables

```bash
# Set API keys in production
npx convex env set OPENROUTER_API_KEY "sk-or-v1-..." --prod
npx convex env set REPLICATE_API_TOKEN "r8_..." --prod
```

### 1.3 Verify Deployment

```bash
# View production logs
npx convex logs --prod

# Open production dashboard
npx convex dashboard --prod
```

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect Repository

```bash
# Initialize git if needed
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/your-org/vibe-code.git
git push -u origin main
```

### 2.2 Import to Vercel

1. Visit [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repo
4. Configure project:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 2.3 Set Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
VITE_CONVEX_URL = https://your-app.convex.cloud
```

### 2.4 Deploy

Click "Deploy"

Vercel will:
- Install dependencies
- Build with Vite
- Deploy to CDN
- Give you a URL: `https://vibe-code.vercel.app`

---

## Step 3: Custom Domain (Optional)

### 3.1 Add Domain in Vercel

1. Go to project settings
2. Domains → Add
3. Enter your domain: `vibe.remix.gg`
4. Follow DNS configuration steps

### 3.2 Configure DNS

Add DNS records (example for Cloudflare):

```
Type: CNAME
Name: vibe
Target: cname.vercel-dns.com
```

### 3.3 Enable SSL

Vercel auto-provisions SSL certificates. Wait 5-10 minutes for activation.

---

## Step 4: Post-Deployment Checks

### 4.1 Smoke Test

Visit your production URL and test:

- [ ] App loads
- [ ] Can create a game
- [ ] Can send chat message
- [ ] AI responds
- [ ] Game preview works
- [ ] (Optional) Image generation works

### 4.2 Check Logs

```bash
# Convex logs
npx convex logs --prod --tail

# Vercel logs
vercel logs
```

### 4.3 Monitor Errors

Set up error tracking:

- Sentry (recommended)
- LogRocket
- Convex built-in monitoring

---

## Step 5: Environment Management

### Development vs. Production

| Environment | Convex | Frontend | API Keys |
|-------------|--------|----------|----------|
| **Development** | `npx convex dev` | `npm run dev` | Local `.env.local` |
| **Production** | `npx convex deploy --prod` | Vercel | Convex env vars |

### Switching Between Environments

```bash
# Use development
VITE_CONVEX_URL=<dev-url> npm run dev

# Use production
VITE_CONVEX_URL=<prod-url> npm run dev
```

---

## Rollback Strategy

### Rollback Frontend

```bash
# Vercel auto-keeps all deployments
# Go to vercel.com → Deployments → Click old version → "Promote to Production"
```

### Rollback Backend

```bash
# Convex keeps function history
# In Convex dashboard → Functions → History → Revert
```

---

## Scaling Considerations

### Convex Limits (Free Tier)

- 1 million function calls/month
- 1 GB storage
- 1 GB bandwidth/month

Upgrade to Pro:
- 10M+ function calls
- 10 GB+ storage
- Custom limits

### Vercel Limits (Hobby Tier)

- 100 GB bandwidth/month
- Unlimited deployments
- 6 hour build time/month

Upgrade to Pro:
- 1 TB bandwidth
- Team collaboration
- Advanced analytics

### Cost Estimates

**For 1000 active users:**

- Convex: ~$20/month (Pro plan)
- Vercel: Free (Hobby) or $20/month (Pro)
- OpenAI: ~$50-200/month (depends on usage)
- Replicate: ~$50-100/month (depends on images)

**Total: ~$120-340/month**

---

## Monitoring & Alerts

### Convex Dashboard

Monitor:
- Function call volume
- Error rates
- Storage usage
- Bandwidth

Set up alerts for:
- High error rate (>5%)
- Near quota limits (>80%)
- Slow functions (>5s)

### Vercel Analytics

Monitor:
- Page views
- Load times
- Core Web Vitals
- Error tracking

---

## Backup & Recovery

### Database Backups

Convex automatically backs up data. To export:

```bash
# Export all data
npx convex export --prod > backup.json
```

To restore:

```bash
# Import data
npx convex import backup.json --prod
```

### Code Backups

- Git repository (GitHub)
- Vercel deployments (immutable)
- Convex function history (versioned)

---

## Security Checklist

Pre-production:

- [ ] All API keys in environment variables (not code)
- [ ] Convex functions have proper auth checks
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all mutations
- [ ] File upload size limits set
- [ ] XSS protection enabled
- [ ] HTTPS enforced
- [ ] Error messages don't leak sensitive data

---

## Performance Optimization

### Frontend

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'phaser': ['phaser'],
          'convex': ['convex/react'],
        },
      },
    },
  },
});
```

### Backend

```typescript
// Add indexes for common queries
// Already done in schema.ts:
// - by_user for games
// - by_game for messages and assets
```

### CDN

- Vercel Edge Network (automatic)
- Cache static assets (automatic)
- Compress images (Cloudflare/Vercel)

---

## CI/CD Pipeline (Optional)

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx convex deploy --prod
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

---

## Troubleshooting

### Issue: "Convex connection failed"

**Solution:**
- Check `VITE_CONVEX_URL` in Vercel
- Verify Convex deployment is active
- Check Convex dashboard for errors

### Issue: "OpenRouter API error"

**Solution:**
- Verify API key in Convex env: `npx convex env get OPENROUTER_API_KEY --prod`
- Check OpenRouter account has credits at https://openrouter.ai
- Review available models at https://openrouter.ai/models

### Issue: "Build failed on Vercel"

**Solution:**
- Check build logs
- Verify all dependencies in package.json
- Test build locally: `npm run build`

### Issue: "Images not loading"

**Solution:**
- Check Convex storage quota
- Verify Replicate API key
- Check browser console for CORS errors

---

## Post-Launch Checklist

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Error tracking configured
- [ ] Backups scheduled
- [ ] Documentation updated
- [ ] Team has access
- [ ] Alerts configured
- [ ] Load tested
- [ ] Security audit complete

---

**Ready to deploy? Let's ship it! 🚀**

For issues: Check Convex logs, Vercel logs, browser console.
