# Vibe Code - Testing Guide

## Test Scenarios

### Scenario 1: First-Time User Experience

**Goal:** User creates their first game from scratch

**Steps:**
1. Visit app (no games exist)
2. App auto-creates "My First Game"
3. See default "Hello World!" game in preview
4. Type: "Create a bouncing ball game"
5. AI generates code with physics
6. Ball appears and bounces in preview

**Expected Result:**
- ✅ Game auto-created
- ✅ Default game renders
- ✅ AI responds in <10 seconds
- ✅ New game code executes without errors
- ✅ Ball visibly bounces

**Test Data:**
```
Prompt: "Create a bouncing ball game"

Expected AI response:
- Calls updateGameCode
- Code includes: Phaser physics, ball sprite, bounce logic
- Ball appears in center, bounces on ground
```

---

### Scenario 2: AI Image Generation

**Goal:** User asks for a visual asset

**Steps:**
1. Type: "Add a space background"
2. AI recognizes image request
3. Calls generateImage tool
4. Replicate generates image
5. Image uploads to Convex storage
6. Asset appears in right panel
7. Game code updated to use image
8. Preview shows new background

**Expected Result:**
- ✅ AI calls generateImage (check tool calls)
- ✅ Image generates (30-60 seconds)
- ✅ Asset appears in Assets panel
- ✅ Game preview updates with background
- ✅ Background is space-themed

**Test Data:**
```
Prompt: "Add a space background"

Expected flow:
1. AI message: "I'll generate a space background..."
2. Tool call: generateImage({ prompt: "space stars nebula...", name: "background" })
3. Asset created: type=image, source=generated
4. Code updated: this.add.image(400, 300, 'background')
5. Preview: Shows starry space background
```

---

### Scenario 3: Iterative Development

**Goal:** User makes multiple changes

**Steps:**
1. Start with simple game
2. Type: "Make it 1024x768"
3. AI calls updateGameConfig
4. Preview resizes
5. Type: "Change background to blue"
6. AI updates config
7. Preview changes color
8. Type: "Add a score counter"
9. AI adds text element
10. Preview shows score

**Expected Result:**
- ✅ Each change applies immediately
- ✅ No crashes or errors
- ✅ Previous changes persist
- ✅ Messages show tool calls

---

### Scenario 4: Error Handling

**Goal:** Graceful error handling

**Test 4a: Invalid code**
```
User: "Add a banana"
AI: Generates code with typo

Expected: 
- Preview shows "Error in game code"
- Console shows error details
- App doesn't crash
- User can send another message
```

**Test 4b: Network failure**
```
Action: Disconnect internet
User: Send message

Expected:
- Error message appears
- Chat input remains functional
- Message can retry when online
```

**Test 4c: API rate limit**
```
Action: Rapid-fire 10 messages

Expected:
- Messages queue
- No duplicate processing
- OpenAI errors handled
- User notified if rate limited
```

---

### Scenario 5: Asset Management

**Goal:** Work with multiple assets

**Steps:**
1. Generate 3 images (background, player, enemy)
2. All appear in Assets panel
3. Click asset to preview
4. Delete one asset
5. Game code still works (doesn't reference deleted asset)

**Expected Result:**
- ✅ Assets displayed as grid
- ✅ Thumbnails visible
- ✅ Names and sizes shown
- ✅ Delete removes from DB and storage

---

## Performance Tests

### Load Time
- [ ] App loads in <2 seconds
- [ ] First game creation <3 seconds
- [ ] Convex connection <1 second

### AI Response Time
- [ ] Simple request: <5 seconds
- [ ] Code generation: <10 seconds
- [ ] Image generation: <60 seconds

### Preview Updates
- [ ] Code change → preview update: <500ms
- [ ] New asset → appears: <1 second
- [ ] Config change → applies: <200ms

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Mobile:
- [ ] iPhone Safari
- [ ] Android Chrome

---

## Convex Function Tests

### games.create
```javascript
Input: { name: "Test Game" }
Expected: Returns gameId, game created in DB
```

### messages.send
```javascript
Input: { gameId, content: "test" }
Expected: Message stored, AI action scheduled
```

### assets.create
```javascript
Input: { gameId, name: "test.png", ... }
Expected: Asset stored, URL generated
```

### ai.processMessage (internal)
```javascript
Input: { gameId, messageId }
Expected: 
- Fetches game context
- Calls OpenAI
- Executes tools
- Stores response
```

---

## Security Tests

### Authentication (TODO)
- [ ] Unauthenticated users redirected
- [ ] Users only see their games
- [ ] Users can't modify others' games

### Input Validation
- [ ] Empty messages rejected
- [ ] XSS in messages sanitized
- [ ] File upload size limits
- [ ] Code injection prevented

### API Keys
- [ ] Keys not exposed to client
- [ ] Keys loaded from env only
- [ ] Keys rotatable without code change

---

## Edge Cases

### Empty States
- [ ] No games: Shows welcome
- [ ] No messages: Shows suggestions
- [ ] No assets: Shows empty state

### Limits
- [ ] 1000+ messages in chat
- [ ] 100+ assets in game
- [ ] Very long code (10k+ lines)
- [ ] Large image uploads (>10MB)

### Concurrent Users
- [ ] Multiple users same game (future)
- [ ] Rapid updates don't conflict
- [ ] Optimistic updates work

---

## Debugging Tools

### Convex Dashboard
```bash
npx convex dashboard
```
- View all tables
- Inspect documents
- See function logs
- Monitor performance

### Browser DevTools
- Network tab: Check Convex requests
- Console: Check for errors
- React DevTools: Inspect component state
- Phaser DevTools: Inspect game state

### Convex Logs
```bash
npx convex logs --tail
```
- See real-time function calls
- Check AI responses
- Monitor errors

---

## Test Automation (Future)

### Unit Tests (Vitest)
```typescript
describe('ChatInput', () => {
  it('sends message on Enter', () => {
    // ...
  });
  
  it('adds newline on Shift+Enter', () => {
    // ...
  });
});
```

### Integration Tests (Playwright)
```typescript
test('user creates game', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('[placeholder*="Describe"]', 'Create a game');
  await page.click('button:has-text("Send")');
  await expect(page.locator('.message')).toContainText('game');
});
```

---

## Regression Tests

Before each release:
- [ ] All scenarios pass
- [ ] No console errors
- [ ] Performance within targets
- [ ] All browsers work
- [ ] Mobile responsive

---

## Known Issues to Test

1. **Phaser scene reload timing**
   - Sometimes flickers
   - Test: Rapid code changes

2. **Image generation timeout**
   - Replicate can be slow
   - Test: Multiple concurrent generations

3. **Large asset handling**
   - No size validation yet
   - Test: Upload 50MB image

4. **Chat scroll behavior**
   - Auto-scroll might miss
   - Test: Send 100 messages rapidly

---

## Success Criteria

### MVP Ready When:
- ✅ All Scenario 1-3 tests pass
- ✅ Error handling works (Scenario 4)
- ✅ Performance within targets
- ✅ No critical bugs
- ✅ Chrome + Firefox working

### Production Ready When:
- ✅ All scenarios pass
- ✅ All browsers supported
- ✅ Security tests pass
- ✅ Load tested (100+ users)
- ✅ Monitoring in place
- ✅ Error tracking integrated
- ✅ Backup/recovery tested

---

**Test often. Break things. Fix them. Ship it.** 🚀
