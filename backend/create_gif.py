import asyncio
from playwright.async_api import async_playwright
import subprocess
import os

async def create_animated_screenshots():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 630, "height": 500})
        page = await context.new_page()
        
        frames_dir = "/app/backend/trailer_tmp/frames"
        os.makedirs(frames_dir, exist_ok=True)
        
        frame = 0
        
        # Scene 1: Home screen (hold for multiple frames)
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        for i in range(8):
            await page.screenshot(path=f"{frames_dir}/frame_{frame:04d}.png", full_page=False)
            frame += 1
            await page.wait_for_timeout(200)
        
        # Scene 2: Game board
        await page.goto("http://localhost:3000/game/local", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        for i in range(6):
            await page.screenshot(path=f"{frames_dir}/frame_{frame:04d}.png", full_page=False)
            frame += 1
            await page.wait_for_timeout(200)
        
        # Make moves on the board
        sq = 46
        board_left = 68
        board_top = 62
        
        # Click e2 (select)
        await page.mouse.click(board_left + 4*sq + sq/2, board_top + 6*sq + sq/2)
        await page.wait_for_timeout(500)
        for i in range(3):
            await page.screenshot(path=f"{frames_dir}/frame_{frame:04d}.png", full_page=False)
            frame += 1
            await page.wait_for_timeout(200)
        
        # Click e4 (move)
        await page.mouse.click(board_left + 4*sq + sq/2, board_top + 4*sq + sq/2)
        await page.wait_for_timeout(500)
        for i in range(4):
            await page.screenshot(path=f"{frames_dir}/frame_{frame:04d}.png", full_page=False)
            frame += 1
            await page.wait_for_timeout(200)
        
        # Click d7 (select)
        await page.mouse.click(board_left + 3*sq + sq/2, board_top + 1*sq + sq/2)
        await page.wait_for_timeout(500)
        for i in range(3):
            await page.screenshot(path=f"{frames_dir}/frame_{frame:04d}.png", full_page=False)
            frame += 1
            await page.wait_for_timeout(200)
        
        # Click d5 (move)
        await page.mouse.click(board_left + 3*sq + sq/2, board_top + 3*sq + sq/2)
        await page.wait_for_timeout(500)
        for i in range(4):
            await page.screenshot(path=f"{frames_dir}/frame_{frame:04d}.png", full_page=False)
            frame += 1
            await page.wait_for_timeout(200)
        
        # Click e4 (select for capture)
        await page.mouse.click(board_left + 4*sq + sq/2, board_top + 4*sq + sq/2)
        await page.wait_for_timeout(500)
        for i in range(3):
            await page.screenshot(path=f"{frames_dir}/frame_{frame:04d}.png", full_page=False)
            frame += 1
            await page.wait_for_timeout(200)
        
        # Click d5 (capture!)
        await page.mouse.click(board_left + 3*sq + sq/2, board_top + 3*sq + sq/2)
        await page.wait_for_timeout(500)
        for i in range(6):
            await page.screenshot(path=f"{frames_dir}/frame_{frame:04d}.png", full_page=False)
            frame += 1
            await page.wait_for_timeout(200)
        
        # Scene 3: Opening Explorer
        await page.goto("http://localhost:3000/learn", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        for i in range(8):
            await page.screenshot(path=f"{frames_dir}/frame_{frame:04d}.png", full_page=False)
            frame += 1
            await page.wait_for_timeout(200)
        
        # Scene 4: Puzzles
        await page.goto("http://localhost:3000/puzzles", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        for i in range(8):
            await page.screenshot(path=f"{frames_dir}/frame_{frame:04d}.png", full_page=False)
            frame += 1
            await page.wait_for_timeout(200)
        
        # Scene 5: Back to home
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1500)
        for i in range(6):
            await page.screenshot(path=f"{frames_dir}/frame_{frame:04d}.png", full_page=False)
            frame += 1
            await page.wait_for_timeout(200)
        
        await context.close()
        await browser.close()
        
        print(f"Total frames captured: {frame}")
        
        # Convert frames to animated GIF
        subprocess.run([
            "ffmpeg", "-y",
            "-framerate", "5",
            "-i", f"{frames_dir}/frame_%04d.png",
            "-vf", "scale=630:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
            "-loop", "0",
            "/app/backend/chess-master-gameplay.gif"
        ], check=True)
        
        size = os.path.getsize("/app/backend/chess-master-gameplay.gif")
        print(f"GIF created: {size/1024:.0f} KB")

asyncio.run(create_animated_screenshots())
