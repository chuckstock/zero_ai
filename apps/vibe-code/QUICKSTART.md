# Vibe Code - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- OpenRouter API key (from https://openrouter.ai - supports GPT-4, Claude, etc.)
- Replicate API key (for image generation)

## 5-Minute Setup

### 1. Install Dependencies

```bash
cd vibe-code
npm install
```

### 2. Start Convex

```bash
npx convex dev
```

This will:
- Prompt you to create a Convex account (free)
- Create a new project
- Generate API files
- Give you a deployment URL (save this!)

### 3. Configure Environment

Create `.env.local`:

```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

Add secrets to Convex:

```bash
npx convex env set OPENROUTER_API_KEY "sk-or-v1-..."
npx convex env set REPLICATE_API_TOKEN "r8_..."
```

**Note:** OpenRouter gives you access to multiple models (GPT-4, Claude, Llama, etc.) through one API key.

### 4. Start Frontend

```bash
# In a new terminal
npm run dev
```

Visit: http://localhost:3000

## First Steps

1. **Create your first game:**
   - Type: "Create a simple game with a bouncing ball"
   - Watch the AI generate code
   - See it appear in the preview

2. **Add visuals:**
   - Type: "Add a space background"
   - AI will generate an image via Replicate
   - Game updates automatically

3. **Iterate:**
   - "Make the ball bounce faster"
   - "Add a score counter"
   - "Change the background to a forest"

## Troubleshooting

### Issue: Convex connection error

**Solution:** Make sure `npx convex dev` is running in another terminal

### Issue: AI not responding

**Solution:** Check your OpenRouter API key:
```bash
npx convex env get OPENROUTER_API_KEY
```
Also verify you have credits at https://openrouter.ai

### Issue: Image generation failing

**Solution:** Check your Replicate token:
```bash
npx convex env get REPLICATE_API_TOKEN
```

### Issue: Game not updating

**Solution:** Check browser console for errors. Most common: invalid Phaser.js syntax.

## Next Steps

- Read [README.md](./README.md) for full documentation
- Read [VIBE_CODE_ARCHITECTURE.md](../VIBE_CODE_ARCHITECTURE.md) for system design
- Check Convex dashboard for database inspection
- Deploy to production (see README)

## Key Commands

```bash
# Development
npx convex dev          # Start backend
npm run dev             # Start frontend

# Logs
npx convex logs         # View Convex function logs

# Database
npx convex dashboard    # Open database viewer

# Deploy
npx convex deploy --prod  # Deploy backend
npm run build             # Build frontend
```

## Getting Help

- Convex Docs: https://docs.convex.dev
- Phaser Docs: https://photonstorm.github.io/phaser3-docs/
- OpenRouter Docs: https://openrouter.ai/docs
- OpenRouter Models: https://openrouter.ai/models

---

**Built by zer0 for remix.gg**
