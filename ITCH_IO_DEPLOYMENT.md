# Chess Master - itch.io Deployment Guide

## Overview
This guide explains how to deploy Chess Master to itch.io as an HTML5 web game (FREE to publish!).

## Step 1: Build the Web Version

In your local development environment (after downloading the code), run:

```bash
cd frontend

# Install dependencies
yarn install

# Build for web (creates dist/ folder)
npx expo export --platform web
```

This creates a `dist/` folder with all the static files needed.

## Step 2: Prepare for itch.io

1. **Compress the dist folder:**
```bash
cd dist
zip -r ../chess-master-web.zip .
```

2. **The zip should contain:**
   - index.html
   - _expo/ folder
   - assets/ folder
   - Other static files

## Step 3: Upload to itch.io

1. **Create an itch.io account** at https://itch.io (FREE)

2. **Create a new project:**
   - Go to https://itch.io/game/new
   - Fill in:
     - **Title:** Chess Master
     - **Kind of project:** HTML (for web games)
     - **Pricing:** Free (or set your price)

3. **Upload the game:**
   - Upload `chess-master-web.zip`
   - Check "This file will be played in the browser"
   - Set viewport: 800x600 or "Let the game decide"
   - Enable "Mobile friendly" if you want phone support

4. **Configure:**
   - Add screenshots
   - Write description
   - Add tags: chess, puzzle, strategy, html5

5. **Publish!**

## Step 4: Backend Hosting (Required)

Since itch.io only hosts static files, you need to host the backend separately:

### Option A: Railway (Recommended, has free tier)
1. Create account at https://railway.app
2. Create new project > Deploy from GitHub
3. Add MongoDB plugin
4. Set environment variables
5. Get your backend URL

### Option B: Render (Free tier available)
1. Create account at https://render.com
2. Create new Web Service
3. Connect to your repo
4. Add MongoDB connection

### Option C: Fly.io (Free tier)
1. Install flyctl
2. `fly launch`
3. Deploy backend

## Step 5: Update Frontend API URL

Before building, update the API URL in `frontend/.env`:

```
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.railway.app
```

Then rebuild and re-upload to itch.io.

## Alternative: Fully Static Version

For a simpler deployment (no backend needed), you can:
1. Remove online multiplayer features
2. Store puzzles locally in the app
3. Use localStorage for all data
4. This makes it fully playable offline!

## itch.io Benefits

- **FREE** to publish (unlike Google Play's $25 fee)
- No app review process
- Instant updates
- Built-in analytics
- Community features
- Can accept donations/payments
- Embed on other websites

## Game Page Settings

Recommended itch.io settings:
- **Frame Options:**
  - Fullscreen button: Enabled
  - Mobile-friendly: Yes
  - Scrollbars: Hidden
  - Viewport: 800x600 (or auto)

- **Release Status:** Released

- **Tags:** chess, strategy, puzzle, browser, multiplayer

## Embedding

After publishing, you can embed Chess Master on any website:

```html
<iframe 
  src="https://YOUR-USERNAME.itch.io/chess-master" 
  width="800" 
  height="600"
  frameborder="0">
</iframe>
```

## Support

For issues:
- itch.io docs: https://itch.io/docs/creators/
- Expo web: https://docs.expo.dev/workflow/web/
