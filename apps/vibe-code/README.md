# Vibe Code v2.0

AI-powered game development studio. Create games through natural language conversation.

## Features

✅ **3-Panel Interface**
- AI Chat (describe what you want)
- Live Game Preview (Phaser.js)
- Asset Management (images, audio)

✅ **AI Integration**
- OpenAI GPT-4 with tool calling
- Code generation & modification
- AI-powered image generation (Replicate FLUX)

✅ **Real-time Everything**
- Convex reactive queries
- Instant preview updates (<100ms)
- Live asset management

## Tech Stack

- **Frontend:** Vite + React + TypeScript + Tailwind
- **Backend:** Convex (database + serverless functions + storage)
- **Game Engine:** Phaser.js
- **AI:** OpenAI GPT-4, Replicate FLUX

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Convex

```bash
# Initialize Convex
npx convex dev

# This will:
# - Create a new Convex project
# - Generate convex/_generated files
# - Give you a deployment URL
```

### 3. Set Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:
- `VITE_CONVEX_URL` - from `npx convex dev`
- `OPENAI_API_KEY` - from OpenAI dashboard
- `REPLICATE_API_TOKEN` - from replicate.com

### 4. Add Convex Environment Variables

```bash
npx convex env set OPENAI_API_KEY "sk-..."
npx convex env set REPLICATE_API_TOKEN "r8_..."
```

### 5. Start Development

```bash
# Terminal 1: Convex dev server
npx convex dev

# Terminal 2: Vite dev server
npm run dev
```

Open http://localhost:3000

## Usage

### Basic Flow

1. Type a message: "Create a space shooter game"
2. AI generates code + assets
3. Game preview updates instantly
4. Iterate: "Add more enemies" / "Make it faster"

### Example Prompts

- "Create a platformer with pixel art style"
- "Add a futuristic city background"
- "Make the player jump when I press spacebar"
- "Add enemy ships that move left to right"
- "Generate an explosion effect"

## Architecture

See [VIBE_CODE_ARCHITECTURE.md](../VIBE_CODE_ARCHITECTURE.md) for detailed documentation.

### Key Files

```
convex/
├── schema.ts          - Database tables
├── games.ts           - Game CRUD operations
├── messages.ts        - Chat functionality
├── assets.ts          - Asset management
├── ai.ts              - AI processing
└── ai/
    ├── prompts.ts     - System prompts & tool definitions
    └── tools.ts       - Tool implementations

src/
├── components/
│   ├── chat/          - Chat interface
│   ├── preview/       - Phaser.js game preview
│   ├── assets/        - Asset management
│   └── layout/        - Layout components
└── App.tsx            - Main application
```

## Deployment

### Production Build

```bash
# Deploy Convex
npx convex deploy --prod

# Build frontend
npm run build

# Deploy to Vercel
vercel --prod
```

### Environment Variables (Production)

Set in Vercel dashboard:
- `VITE_CONVEX_URL` - Production Convex URL

Set in Convex dashboard:
- `OPENAI_API_KEY`
- `REPLICATE_API_TOKEN`

## Troubleshooting

### "Convex client not initialized"
- Make sure `npx convex dev` is running
- Check `.env.local` has correct `VITE_CONVEX_URL`

### "Game code execution error"
- Check browser console for details
- Verify Phaser.js syntax
- Make sure assets are loaded before use

### AI not responding
- Check `OPENAI_API_KEY` in Convex env
- Verify API key has credits
- Check Convex logs: `npx convex logs`

### Image generation failing
- Check `REPLICATE_API_TOKEN` in Convex env
- Verify account has credits
- Check Convex logs for error details

## Development

### Adding New AI Tools

1. Define tool in `convex/ai/prompts.ts`
2. Implement in `convex/ai/tools.ts`
3. Add case in `convex/ai.ts` switch statement

### Modifying Game Engine

Edit `src/components/preview/GamePreview.tsx` to:
- Change Phaser config
- Add physics options
- Modify scene lifecycle

## Performance

### Frontend Optimization
- Code splitting for Monaco Editor
- Virtual scrolling for long chats
- Memoized components for asset cards

### Backend Optimization
- Indexed queries (by_game, by_user)
- Paginated results
- Cached AI responses

## Roadmap

### Near-term
- [ ] Streaming AI responses
- [ ] Drag-and-drop asset upload
- [ ] Code editor (Monaco)
- [ ] Asset preview modal
- [ ] Game templates

### Long-term
- [ ] Multiplayer collaboration
- [ ] Voice input
- [ ] 3D game support (Three.js)
- [ ] Mobile preview
- [ ] Game marketplace

## Contributing

Built by zer0 for remix.gg

## License

MIT
