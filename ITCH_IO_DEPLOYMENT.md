# Chess Master - itch.io Deployment Guide

## Your Web Build

The file `chess-master-web.zip` (2.6 MB) has been generated at:
```
/app/frontend/chess-master-web.zip
```

## How to Download the Zip File

1. In the Emergent workspace file browser (left sidebar), navigate to: `frontend/chess-master-web.zip`
2. Right-click the file and select **Download**
3. Save it to your computer

## How to Publish on itch.io

### Step 1: Create an itch.io Account
- Go to [https://itch.io](https://itch.io)
- Click **Register** and create a free account

### Step 2: Create a New Project
- Go to [https://itch.io/game/new](https://itch.io/game/new)
- Fill in the details:
  - **Title**: Chess Master
  - **Project URL**: choose a slug (e.g., `chess-master`)
  - **Classification**: Game
  - **Kind of project**: HTML
  - **Release status**: Released (or In Development)

### Step 3: Upload Your Game
- Under **Uploads**, click **Upload files**
- Select the `chess-master-web.zip` file you downloaded
- **IMPORTANT**: Check the box **"This file will be played in the browser"**
- Set **Embed options**:
  - Width: **430** (mobile portrait)
  - Height: **900** (mobile portrait)
  - Or for desktop: Width **1200**, Height **800**

### Step 4: Configure Page Settings
- **Cover image**: Upload a screenshot of the chess board
- **Description**: Write a description, e.g.:
  > Play chess against AI, solve puzzles (easy to impossible), explore 160+ chess openings, and analyze your games. Features membership tiers with premium AI difficulty levels.
- **Tags**: chess, board-game, strategy, puzzle, ai
- **Genre**: Strategy, Puzzle

### Step 5: Publish
- Scroll down and change **Visibility** from "Draft" to **Public**
- Click **Save** at the bottom
- Your game is now live at `https://your-username.itch.io/chess-master`

## Important Notes

- This is a **frontend-only** static web build. The AI chess engine runs entirely in the browser.
- Features that require the backend (user accounts, saved games, puzzle tracking) will need a hosted backend server.
- The chess AI, puzzles display, opening explorer browsing, and core chess gameplay all work offline in the browser.
- **164 chess openings** and **191 puzzles** are included.

## Pricing on itch.io
- itch.io allows you to set your game as **Free**, **Paid**, or **Name Your Price**
- No $25 developer fee like Google Play!
- itch.io takes 0% by default (you can optionally share revenue)
