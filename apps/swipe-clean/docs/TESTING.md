# SwipeClean Testing Guide

Comprehensive testing guide for SwipeClean.

## Testing Overview

Testing covers:
1. Core functionality (swipe, delete, keep)
2. In-app purchases
3. Permissions
4. Edge cases
5. Performance

## Manual Testing

### 1. Onboarding Flow

**Test Cases:**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Launch app (first time) | See onboarding screen |
| 2 | Read onboarding content | Clear explanation of app |
| 3 | Tap "Get Started" | Request photo permission |
| 4 | Grant permission | Navigate to swipe screen |
| 5 | Deny permission | See alert, option to open Settings |

**Edge Cases:**
- Permission already granted (skip request)
- Permission denied, then granted in Settings
- Return to app after granting permission

### 2. Photo Loading

**Test Cases:**

| Scenario | Expected Behavior |
|----------|------------------|
| Empty library | Show "No photos" message |
| 1-50 photos | Load all photos |
| 100+ photos | Load in batches, smooth scroll |
| 1000+ photos | Good performance, no lag |

**Performance Checks:**
- Initial load time < 2 seconds
- Smooth scrolling, no jank
- Memory usage reasonable
- No crashes with large libraries

### 3. Swipe Gestures

**Test Cases:**

| Action | Expected Result |
|--------|----------------|
| Swipe left (fast) | Photo animates off, deleted |
| Swipe right (fast) | Photo animates off, kept |
| Swipe left (slow) | Visual feedback, returns to center |
| Swipe right (slow) | Visual feedback, returns to center |
| Partial swipe | Returns to center with spring |

**Visual Feedback:**
- DELETE indicator visible when swiping left
- KEEP indicator visible when swiping right
- Rotation animation during swipe
- Smooth spring animation

### 4. Button Controls

**Test Cases:**

| Button | Action | Expected Result |
|--------|--------|----------------|
| Delete | Tap | Same as swipe left |
| Keep | Tap | Same as swipe right |
| Undo | Tap (after action) | Previous photo returns |
| Undo | Tap (disabled) | Nothing happens |

**Undo Testing:**
- Undo after delete → Photo back in queue
- Undo after keep → Photo back in queue
- Multiple undos in a row
- Undo button disabled when no history

### 5. Stats Tracking

**Test Cases:**

| Metric | How to Verify |
|--------|--------------|
| Photos Reviewed | Count increases on each action |
| Photos Deleted | Increases only on delete/swipe left |
| Photos Kept | Increases only on keep/swipe right |
| Storage Saved | Shows reasonable estimate |

**Stats Screen:**
- Tap "Stats" button → Opens stats screen
- Shows correct numbers
- Performance metrics accurate
- Delete rate percentage correct
- Back button works

### 6. Free Limit

**Test Cases:**

| Scenario | Expected Behavior |
|----------|------------------|
| Review 1-49 photos | Normal operation |
| Review 50th photo | Normal operation |
| Review 51st photo (free user) | Paywall appears |
| Swipe with paywall | Buttons disabled |

**Visual Indicators:**
- Progress bar shows free limit
- Warning at 40 photos (80% of limit)
- Clear message when limit reached

### 7. In-App Purchase

**Setup:**
```bash
# On device:
# Settings → App Store → Sandbox Account
# Sign in with sandbox tester
```

**Test Cases:**

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Reach free limit | Paywall appears |
| 2 | Tap "Unlock Now" | iOS payment sheet |
| 3 | Complete purchase (sandbox) | Success message |
| 4 | Continue swiping | No limit |
| 5 | Close and reopen app | Still premium |

**Purchase Scenarios:**
- ✅ Successful purchase
- ❌ User cancels
- ❌ Payment fails
- ❌ Network error

**Restore Purchase:**
1. Delete app
2. Reinstall
3. Reach limit
4. Tap "Restore Purchase"
5. Verify: Premium restored

### 8. Photo Deletion

**Safety Check:**

```bash
# After deleting photos in app:
# 1. Open iOS Photos app
# 2. Go to Albums → Recently Deleted
# 3. Verify photos are there
# 4. Can restore photos within 30 days
```

**Test Scenarios:**
- Delete 1 photo → In Recently Deleted
- Delete 10 photos → All in Recently Deleted
- Delete 100 photos → All successfully moved

### 9. Permissions Edge Cases

**Test Cases:**

| Scenario | Expected Behavior |
|----------|------------------|
| Grant then revoke in Settings | Show permission required alert |
| Limited photo access | Only show selected photos |
| No photo access | Cannot proceed, show alert |

## Automated Testing (Future)

### Unit Tests

```typescript
// Example tests to add:

describe('photoService', () => {
  it('should load photos in batches');
  it('should delete photos successfully');
  it('should handle permission errors');
});

describe('useStats', () => {
  it('should track photos reviewed');
  it('should calculate delete rate');
  it('should undo actions');
});

describe('usePurchase', () => {
  it('should detect premium status');
  it('should handle purchase flow');
  it('should restore purchases');
});
```

### Integration Tests

```typescript
// Example integration tests:

describe('Swipe Flow', () => {
  it('should complete full swipe left → delete');
  it('should complete full swipe right → keep');
  it('should undo action and restore state');
});

describe('Purchase Flow', () => {
  it('should show paywall at free limit');
  it('should unlock after purchase');
  it('should persist premium status');
});
```

## Performance Testing

### Benchmarks

**Photo Loading:**
- 100 photos: < 1 second
- 1,000 photos: < 3 seconds
- 10,000 photos: < 5 seconds

**Swipe Performance:**
- 60 FPS during gestures
- Smooth animations
- No dropped frames

**Memory Usage:**
- Idle: < 50 MB
- Active swiping: < 100 MB
- Large library (10k+): < 150 MB

### Tools

```bash
# Use Xcode Instruments:
# 1. Xcode → Product → Profile
# 2. Select "Time Profiler"
# 3. Record while using app
# 4. Check for bottlenecks

# Monitor memory:
# Use "Allocations" instrument
```

## Regression Testing

Before each release, test:

- [ ] Fresh install flow
- [ ] Onboarding
- [ ] Photo loading (small and large libraries)
- [ ] Swipe gestures (all directions)
- [ ] Button controls
- [ ] Stats tracking
- [ ] Free limit enforcement
- [ ] IAP flow
- [ ] Restore purchases
- [ ] Photo deletion safety
- [ ] Permissions handling
- [ ] Undo functionality

## Device Testing Matrix

Test on multiple devices:

- [ ] iPhone SE (small screen)
- [ ] iPhone 14 (standard)
- [ ] iPhone 14 Pro Max (large)
- [ ] iOS 15 (minimum supported)
- [ ] iOS 16
- [ ] iOS 17 (latest)

## Bug Reporting Template

```markdown
**Device:** iPhone 14, iOS 16.0
**Build:** 1.0.0 (1)
**Issue:** Description of bug

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected:** What should happen
**Actual:** What actually happened

**Screenshots:** (attach if applicable)
**Frequency:** Always / Sometimes / Rare
```

## Known Issues & Workarounds

### Issue: Photos Not Loading
**Cause:** Permission not granted or limited access
**Fix:** Check Settings → Photos → SwipeClean

### Issue: IAP Not Working in Development
**Cause:** Sandbox account not configured
**Fix:** Sign in with sandbox tester in Settings

### Issue: Gestures Not Responsive
**Cause:** Reanimated not properly configured
**Fix:** Reinstall app, clear cache

## TestFlight Testing

### Beta Testing Checklist

- [ ] Upload build to TestFlight
- [ ] Create test group
- [ ] Invite beta testers (10-20 people)
- [ ] Provide testing instructions
- [ ] Collect feedback
- [ ] Monitor crash reports
- [ ] Fix critical bugs
- [ ] Release next beta

### Tester Instructions

Send to beta testers:

```
Welcome to SwipeClean Beta!

What to test:
1. Onboarding experience
2. Photo loading performance
3. Swipe gestures (smoothness)
4. Free limit (review 50 photos)
5. Purchase flow (use real payment - will be refunded)
6. Stats accuracy
7. Any bugs or issues

Please provide feedback on:
- What you liked
- What felt confusing
- Any crashes or bugs
- Performance issues
- Feature suggestions

Thank you for testing!
```

## App Store Review Preparation

Before submitting:

1. **Test on multiple devices**
   - Different screen sizes
   - Different iOS versions

2. **Video recording for review**
   - Show full user flow
   - Demonstrate IAP
   - Show photo deletion (safe)

3. **Screenshots**
   - Take on largest device
   - Include all required sizes
   - Show key features

4. **Review notes**
   - Explain app purpose
   - Provide test credentials
   - Mention safe deletion

## Post-Launch Monitoring

After release:

1. **Monitor crash reports**
   - Check daily for first week
   - Fix critical issues ASAP

2. **Track metrics**
   - Downloads
   - Conversion rate (free → paid)
   - Reviews and ratings
   - User feedback

3. **Performance**
   - Monitor battery usage
   - Check memory usage reports
   - Watch for ANRs (Application Not Responding)

## Next Steps

1. Complete manual testing
2. Set up TestFlight
3. Recruit beta testers
4. Iterate based on feedback
5. Prepare for App Store submission

---

Happy testing! 🎉
