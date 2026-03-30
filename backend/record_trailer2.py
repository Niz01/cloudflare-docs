import asyncio
from playwright.async_api import async_playwright

async def record_trailer_with_sound():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 630, "height": 500},
            record_video_dir="/app/backend/trailer_tmp/",
            record_video_size={"width": 630, "height": 500}
        )
        page = await context.new_page()
        
        # Scene 1: Home screen
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Scene 2: Start a local game
        await page.goto("http://localhost:3000/game/local", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        
        # Make moves by clicking on board squares
        board_left = 65
        board_top = 60
        sq = 50
        
        # e2 -> e4
        await page.mouse.click(board_left + 4*sq + sq/2, board_top + 6*sq + sq/2)
        await page.wait_for_timeout(800)
        await page.mouse.click(board_left + 4*sq + sq/2, board_top + 4*sq + sq/2)
        await page.wait_for_timeout(1500)
        
        # d7 -> d5
        await page.mouse.click(board_left + 3*sq + sq/2, board_top + 1*sq + sq/2)
        await page.wait_for_timeout(800)
        await page.mouse.click(board_left + 3*sq + sq/2, board_top + 3*sq + sq/2)
        await page.wait_for_timeout(1500)
        
        # e4 x d5 capture
        await page.mouse.click(board_left + 4*sq + sq/2, board_top + 4*sq + sq/2)
        await page.wait_for_timeout(800)
        await page.mouse.click(board_left + 3*sq + sq/2, board_top + 3*sq + sq/2)
        await page.wait_for_timeout(2000)
        
        # Opening explorer
        await page.goto("http://localhost:3000/learn", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Puzzles
        await page.goto("http://localhost:3000/puzzles", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        
        # Home
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        
        await context.close()
        await browser.close()
        
        video = page.video
        if video:
            path = await video.path()
            print(f"Video saved at: {path}")

asyncio.run(record_trailer_with_sound())
