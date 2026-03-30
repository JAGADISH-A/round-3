# PLAN: Video Learning Hub (Neural_Cinema)

The user wants to implement a sleek, YouTube-like media player module for 4 educational videos (< 5MB each). This module will reside in the `Study Hub` (`/study`) and use direct MP4 playback with a Cyber-Terminal HUD aesthetic.

## 🛑 User Review Required

1.  **Video Placement**: Since the videos are small, we can store them in `frontend/public/videos/` for instant loading, or use Firebase Storage.
2.  **Naming**: Should the 4 videos be categorized or just listed as a "Foundational Series"?

## 🎯 Success Criteria
- [ ] `/study` route is active and accessible via Sidebar.
- [ ] Direct MP4 playback support with custom HUD controls.
- [ ] Smooth transitions between video selection and theater mode.
- [ ] "Cinema Mode" (dimmed background) for focused learning.

## 🛠️ Proposed Tech Stack
- **Frontend**: Next.js (Client Components), `video.js` or `hls.js` for custom playback engine.
- **Styling**: Vanilla CSS with Tailwind-compatible utility classes, Framer Motion for transitions.
- **Backend**: FastAPI endpoint for video metadata (titles, descriptions, categories).
- **Storage**: TBD (Firebase/S3/YouTube).

## 📂 Proposed File Structure
```
frontend/
├── app/(dashboard)/study/
│   └── page.tsx             # Main Learning Hub View
├── components/study/
│   ├── VideoPlayer.tsx      # Custom HLS Media Player
│   ├── VideoGrid.tsx        # Card layout for discovery
│   ├── CategoryFilter.tsx   # Sidebar filtering
│   └── VideoSidebar.tsx     # Up-Next / Playlist
backend/app/
└── services/
    └── library_service.py   # Video metadata management
```

## 📝 Task Breakdown

### Phase 1: Foundation & Navigation
- [ ] **P0**: Update `Sidebar.tsx` to activate the `/study` link (remove placeholder status).
- [ ] **P0**: Create the base `app/(dashboard)/study/page.tsx` with a dual-pane layout.
- [ ] **P1**: Define the `Video` type and initial mockup data (English/Tamil localized titles).

### Phase 2: Media Engine (Neural_Cinema)
- [ ] **P1**: Implement `VideoPlayer.tsx` using `hls.js` for adaptive streaming support.
- [ ] **P1**: Add HUD-style custom controls (Play/Pause, Seek, Quality, Speed).
- [ ] **P2**: Implement lazy loading for thumbnails using Next.js `Image`.

### Phase 3: Content Discovery
- [ ] **P2**: Build `VideoGrid.tsx` with hover-to-preview functionality.
- [ ] **P2**: Add Category filters (Interview, English, Technical, Career).

### Phase 4: Integration & Optimization
- [ ] **P3**: Connect to Firebase Storage or YouTube API based on user feedback.
- [ ] **P3**: Implement "Theater Mode" (widened player) and "Cinema Mode" (darkened surroundings).

---

## ✅ Phase X: Verification
- [ ] **Build Check**: `npm run build` in frontend.
- [ ] **Security Check**: `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- [ ] **Performance Audit**: `python .agent/skills/performance-profiling/scripts/lighthouse_audit.py http://localhost:3001/study`
- [ ] **UX Audit**: Verify that "Fitts's Law" is respected for player controls.
