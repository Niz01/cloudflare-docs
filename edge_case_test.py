#!/usr/bin/env python3
"""
Additional Edge Case Tests for Chess Master Backend API
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://tactics-throne.preview.emergentagent.com/api"
SESSION_TOKEN = "test_session_owner_123"
HEADERS = {
    "Authorization": f"Bearer {SESSION_TOKEN}",
    "Content-Type": "application/json"
}

def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def test_edge_cases():
    """Test edge cases and error conditions"""
    log("Starting Edge Case Tests")
    
    # Test invalid game ID
    log("\n=== TESTING INVALID GAME ID ===")
    response = requests.get(f"{BASE_URL}/games/invalid_game_id", headers=HEADERS)
    if response.status_code == 404:
        log("✅ PASS: Invalid game ID returns 404")
    else:
        log(f"❌ FAIL: Expected 404, got {response.status_code}")
    
    # Test invalid puzzle ID
    log("\n=== TESTING INVALID PUZZLE ID ===")
    response = requests.get(f"{BASE_URL}/puzzles/invalid_puzzle", headers=HEADERS)
    if response.status_code == 404:
        log("✅ PASS: Invalid puzzle ID returns 404")
    else:
        log(f"❌ FAIL: Expected 404, got {response.status_code}")
    
    # Test invalid match ID
    log("\n=== TESTING INVALID MATCH ID ===")
    response = requests.get(f"{BASE_URL}/matchmaking/status/invalid_match", headers=HEADERS)
    if response.status_code == 404:
        log("✅ PASS: Invalid match ID returns 404")
    else:
        log(f"❌ FAIL: Expected 404, got {response.status_code}")
    
    # Test unauthorized access (no token)
    log("\n=== TESTING UNAUTHORIZED ACCESS ===")
    no_auth_headers = {"Content-Type": "application/json"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=no_auth_headers)
    if response.status_code == 401:
        log("✅ PASS: No auth token returns 401")
    else:
        log(f"❌ FAIL: Expected 401, got {response.status_code}")
    
    # Test invalid session token
    log("\n=== TESTING INVALID SESSION TOKEN ===")
    invalid_headers = {
        "Authorization": "Bearer invalid_token_123",
        "Content-Type": "application/json"
    }
    response = requests.get(f"{BASE_URL}/auth/me", headers=invalid_headers)
    if response.status_code == 401:
        log("✅ PASS: Invalid session token returns 401")
    else:
        log(f"❌ FAIL: Expected 401, got {response.status_code}")
    
    # Test AI level restrictions (owner should have access to all levels)
    log("\n=== TESTING AI LEVEL ACCESS FOR OWNER ===")
    ai_levels = ["beginner", "intermediate", "advanced", "master"]
    for level in ai_levels:
        response = requests.post(f"{BASE_URL}/games", 
                               headers=HEADERS, 
                               json={"mode": "computer", "ai_level": level})
        if response.status_code == 200:
            log(f"✅ PASS: Owner can access {level} AI level")
        else:
            log(f"❌ FAIL: Owner cannot access {level} AI level - {response.status_code}")
    
    # Test puzzle daily limits (owner should have unlimited)
    log("\n=== TESTING PUZZLE LIMITS FOR OWNER ===")
    for i in range(10):  # Try to get 10 random puzzles
        response = requests.get(f"{BASE_URL}/puzzles/random?difficulty=easy", headers=HEADERS)
        if response.status_code == 200:
            if i == 9:  # If we got 10 puzzles successfully
                log("✅ PASS: Owner has unlimited puzzle access")
        else:
            log(f"❌ FAIL: Owner hit puzzle limit at attempt {i+1}")
            break
    
    # Test membership tier info
    log("\n=== TESTING MEMBERSHIP TIER INFO ===")
    response = requests.get(f"{BASE_URL}/users/me", headers=HEADERS)
    if response.status_code == 200:
        data = response.json()
        tier_info = data.get('tier_info', {})
        if tier_info.get('name') == 'Owner':
            log("✅ PASS: Owner tier info correct")
            log(f"AI Levels: {tier_info.get('ai_levels', [])}")
            log(f"Puzzle Limit: {tier_info.get('puzzle_limit', 0)}")
            log(f"Analysis: {tier_info.get('analysis', False)}")
        else:
            log(f"❌ FAIL: Incorrect tier info: {tier_info}")
    else:
        log(f"❌ FAIL: Could not get user profile - {response.status_code}")
    
    log("\nEdge case testing completed!")

if __name__ == "__main__":
    test_edge_cases()