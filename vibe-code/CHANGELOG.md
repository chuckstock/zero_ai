# Changelog

All notable changes to Vibe Code will be documented in this file.

## [2.0.0] - 2026-02-06

### 🎉 Initial MVP Build

Complete rewrite from v1 (custom backend) to v2 (Vite + Convex).

### Added

**Backend (Convex)**
- Database schema with 4 tables (games, messages, assets, users)
- Real-time reactive queries
- Game CRUD operations
- Message management with AI integration
- Asset storage and management
- AI tool calling system (OpenAI GPT-4)
- Image generation via Replicate FLUX
- Scheduled actions for background AI processing

**Frontend (React + Vite)**
- 3-panel layout (Chat | Preview | Assets)
- Chat interface with message history
- Live game preview with Phaser.js
- Asset panel with grid display
- Real-time updates via Convex subscriptions
- TypeScript throughout
- Tailwind CSS styling

**AI Capabilities**
- Natural language game creation
- Code generation and modification
- Game configuration updates
- AI image generation
- Tool call visualization

**Developer Experience**
- Hot module replacement (HMR)
- TypeScript type safety
- Environment variable templates
- Comprehensive documentation
- Quick start guide

### Technical Details

**Stack:**
- Frontend: Vite 5.1 + React 18 + TypeScript + Tailwind
- Backend: Convex (all-in-one platform)
- Game Engine: Phaser.js 3.80
- AI: OpenAI GPT-4 Turbo
- Image Gen: Replicate FLUX Schnell

**Architecture:**
- Reactive data flow (Convex queries)
- Serverless functions (Convex actions/mutations)
- Real-time sync (<100ms updates)
- File storage (Convex storage)

### Known Issues

- [ ] No authentication (Clerk integration TODO)
- [ ] Asset upload UI not functional
- [ ] No code editor (Monaco TODO)
- [ ] Limited error handling
- [ ] No loading indicators
- [ ] Mobile not optimized

### Documentation

- README.md - Full documentation
- QUICKSTART.md - 5-minute setup guide
- STATUS.md - Build status and roadmap
- TESTING.md - Test scenarios and checklist
- VIBE_CODE_ARCHITECTURE.md - System design

---

## [Unreleased]

### Planned Features

**Near-term (Phase 2)**
- Clerk authentication
- Drag-and-drop asset upload
- Monaco code editor
- Loading states
- Toast notifications
- Game templates

**Long-term (Phase 3)**
- Multiplayer collaboration
- Voice input
- 3D game support (Three.js)
- Streaming AI responses
- Mobile app
- Game marketplace

---

## Version History

- **v2.0.0** - MVP rebuild (2026-02-06)
- **v1.0.0** - Original version (deprecated)

---

**Maintained by:** zer0 for remix.gg
