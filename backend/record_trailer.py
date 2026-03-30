import asyncio
from playwright.async_api import async_playwright

async def record_trailer():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 630, "height": 500},
            record_video_dir="/app/backend/",
            record_video_size={"width": 630, "height": 500}
        )
        page = await context.new_page()
        
        # Scene 1: Home screen
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Scene 2: Navigate to Play
        await page.goto("http://localhost:3000/game/local", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(4000)
        
        # Scene 3: Opening Explorer
        await page.goto("http://localhost:3000/learn", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Scene 4: Puzzles
        await page.goto("http://localhost:3000/puzzles", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Scene 5: Back to home
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        
        await context.close()
        await browser.close()
        
        # Get the video path
        video = page.video
        if video:
            path = await video.path()
            print(f"Video saved at: {path}")

asyncio.run(record_trailer())
