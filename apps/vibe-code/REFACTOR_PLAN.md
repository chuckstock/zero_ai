# AI Code Generation Refactor Plan

## Current Issues
- Direct OpenAI API calls (not using Convex Agent)
- No streaming responses to user
- Manual tool call handling
- No conversation threading
- Monolithic code generation

## New Architecture (Convex Agent Pattern)

### 1. Install Dependencies
```bash
npm install @convex-dev/agent @ai-sdk/openai ai zod
```

### 2. Add Agent Component
```bash
npx convex run components:add @convex-dev/agent
```

### 3. File Structure
```
convex/
├── agent/
│   ├── gameAgent.ts          # Main Agent definition
│   ├── tools/
│   │   ├── codeGeneration.ts # Code gen tool
│   │   ├── imageGeneration.ts # Image gen tool
│   │   ├── gameConfig.ts     # Config tool
│   │   └── assetManagement.ts # Asset tools
│   └── prompts.ts            # System prompts
├── ai.ts                     # Public actions (createThread, continueThread)
└── messages.ts               # Message streaming queries
```

### 4. Key Improvements

#### A. Tool-Based Architecture
- Each tool is self-contained with `createTool()`
- Tools have access to Convex context (db, storage, etc.)
- Proper TypeScript types and Zod validation

#### B. Streaming Support
- Use `agent.streamText()` with delta streaming
- Clients subscribe to real-time message updates
- Live code preview as AI generates

#### C. Thread-Based Conversations
- Each game has a thread
- Persistent message history
- Multi-turn tool calling
- Context automatically managed

#### D. Modular Code Generation
Tools can compose:
1. `generateGameStructure` - Base HTML/JS/CSS
2. `addGameFeature` - Add specific features incrementally
3. `improveCode` - Refactor/optimize existing code
4. `addStyling` - Visual improvements
5. `generateTests` - Add test code

### 5. Implementation Steps

**Phase 1: Core Agent Setup** ✅
- [ ] Install dependencies
- [ ] Add agent component to convex.config.ts
- [ ] Create gameAgent.ts with basic config
- [ ] Create tool structure

**Phase 2: Tool Migration**
- [ ] Refactor updateGameCode → createTool
- [ ] Refactor generateImage → createTool
- [ ] Refactor updateGameConfig → createTool
- [ ] Add new modular tools

**Phase 3: Streaming Integration**
- [ ] Add streaming queries
- [ ] Update frontend to subscribe to deltas
- [ ] Add useUIMessages hook
- [ ] Add SmoothText for live updates

**Phase 4: Thread Management**
- [ ] Update schema to link threads to games
- [ ] Add createThread action
- [ ] Add continueThread action
- [ ] Migrate existing messages

**Phase 5: Enhanced Tools**
- [ ] Add multi-step code generation
- [ ] Add code validation tool
- [ ] Add asset optimization tool
- [ ] Add deployment preview tool

## Benefits

### Developer Experience
- ✅ Type-safe tool definitions
- ✅ Automatic tool call handling
- ✅ Built-in message persistence
- ✅ Easy to add new tools

### User Experience
- ✅ Live streaming responses
- ✅ See code as it's generated
- ✅ Better error handling
- ✅ Conversation continuity

### Architecture
- ✅ Composable tools
- ✅ Testable components
- ✅ Better separation of concerns
- ✅ Scalable for new features

## Migration Path

1. **Parallel Implementation** - Build new system alongside old
2. **Feature Flag** - Toggle between old/new system
3. **Gradual Migration** - Move tools one at a time
4. **Remove Old Code** - Clean up once stable

## Next: Start Implementation?

Ready to build this. Shall I:
1. Install dependencies and set up the Agent?
2. Create the new tool structure?
3. Update the frontend for streaming?

All three in sequence?
