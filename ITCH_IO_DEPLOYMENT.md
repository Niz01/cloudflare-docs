# Chess Master - itch.io Deployment Guide 🎮

## Quick Start (5 Steps to Publish!)

### Step 1: Download Your Code from Emergent
1. In Emergent, click **"Download"** or **"Export"** to get your project files
2. Extract the ZIP to a folder on your computer

### Step 2: Install Dependencies
Open terminal/command prompt in the `frontend` folder:

```bash
cd frontend
npm install
# or
yarn install
```

### Step 3: Build for Web
```bash
npx expo export --platform web
```

This creates a `dist/` folder with your game!

### Step 4: Prepare for Upload
```bash
# Go into the dist folder
cd dist

# Create a ZIP file
# On Mac/Linux:
zip -r ../chess-master.zip .

# On Windows (PowerShell):
Compress-Archive -Path * -DestinationPath ../chess-master.zip
```

### Step 5: Upload to itch.io

1. **Create itch.io account**: https://itch.io/register (FREE!)

2. **Create new game**: https://itch.io/game/new

3. **Fill in details**:
   - **Title**: Chess Master
   - **Project URL**: chess-master (or your choice)
   - **Kind of project**: HTML
   - **Pricing**: Free (or set price)
   - **Uploads**: Upload `chess-master.zip`
   - ✅ Check "This file will be played in the browser"
   - **Viewport dimensions**: 800 x 600
   - ✅ Enable "Mobile friendly"

4. **Save & View Page** → Your game is live! 🎉

---

## Backend Hosting (For Full Features)

Your game needs a backend for:
- User accounts & login
- Online multiplayer
- Cloud save games
- Puzzle tracking

### Free Backend Options:

#### Option A: Railway (Recommended)
1. Go to https://railway.app
2. Sign up (free tier available)
3. Click "New Project" → "Deploy from GitHub"
4. Upload your `backend` folder
5. Add MongoDB: Click "New" → "Database" → "MongoDB"
6. Copy your Railway URL

#### Option B: Render
1. Go to https://render.com
2. Create "New Web Service"
3. Connect your backend code
4. Add environment variables
5. Get your URL

#### Option C: Fly.io
1. Install flyctl: `brew install flyctl` or see https://fly.io/docs/hands-on/install-flyctl/
2. `fly launch` in backend folder
3. Follow prompts

### Update Frontend for Backend
Before building, edit `frontend/.env`:
```
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.railway.app
```

Then rebuild and re-upload to itch.io.

---

## Offline/Standalone Version

Want to publish WITHOUT a backend? You can make it fully offline!

The game already works offline for:
- ✅ Play vs Computer (all AI levels)
- ✅ Local 2-player
- ✅ Opening Explorer (all 46 openings)
- ✅ Chess puzzles (stored locally)

Just skip the backend hosting - users won't have cloud saves or online play, but everything else works!

---

## itch.io Settings Cheatsheet

**Recommended Game Settings:**
- Frame options: ✅ Fullscreen button
- ✅ Mobile friendly
- ✅ Automatically start on page load
- Scrollbars: Hidden

**Tags to add:**
`chess`, `puzzle`, `strategy`, `html5`, `multiplayer`, `free`, `browser`, `mobile-friendly`

**Description Template:**
```
🎯 Chess Master - Play, Learn, Master!

♟️ FEATURES:
• Play vs AI (4 difficulty levels)
• Local 2-player mode
• 100+ chess puzzles (Easy to Impossible)
• 46 opening variations to learn
• Game analysis
• Mobile & Desktop support

💰 MEMBERSHIP (Optional):
• Free: Beginner AI, 5 puzzles/day
• Gold ($2.99): Intermediate AI, 25 puzzles/day  
• Platinum ($5.99): Advanced AI, unlimited puzzles, analysis
• Diamond ($9.99): Master AI, all features!

Made with ❤️ using Expo & React Native
```

---

## Common Issues

**"Game shows blank screen"**
- Make sure you zipped the CONTENTS of dist/, not the dist folder itself
- The index.html should be at the root of the ZIP

**"API errors / Login not working"**
- You need to host the backend separately
- Or use the offline version

**"Slow to load"**
- Normal for first load, Expo bundles are large
- Consider enabling gzip on your backend

---

## Updating Your Game

1. Make changes in code
2. Run `npx expo export --platform web`
3. Create new ZIP from `dist/`
4. On itch.io: Dashboard → Your Game → Edit → Upload new file
5. Delete old file, make new one primary

---

## Support

- itch.io Help: https://itch.io/docs/creators/
- Expo Web: https://docs.expo.dev/workflow/web/
- Community: https://itch.io/community

**Your game URL will be**: `https://YOUR-USERNAME.itch.io/chess-master`

Good luck with your game! 🏆
