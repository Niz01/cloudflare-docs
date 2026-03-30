#!/usr/bin/env python3
"""
Chess Master Backend API Test Suite
Tests all critical endpoints with owner account authentication
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://tactics-throne.preview.emergentagent.com/api"
SESSION_TOKEN = "test_session_owner_123"
HEADERS = {
    "Authorization": f"Bearer {SESSION_TOKEN}",
    "Content-Type": "application/json"
}

class ChessAPITester:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_endpoint(self, method, endpoint, data=None, expected_status=200, description=""):
        """Test a single endpoint"""
        url = f"{BASE_URL}{endpoint}"
        self.log(f"Testing {method} {endpoint} - {description}")
        
        try:
            if method == "GET":
                response = requests.get(url, headers=HEADERS, timeout=10)
            elif method == "POST":
                response = requests.post(url, headers=HEADERS, json=data, timeout=10)
            elif method == "PUT":
                response = requests.put(url, headers=HEADERS, json=data, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, headers=HEADERS, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            if response.status_code == expected_status:
                self.log(f"✅ PASS: {description} (Status: {response.status_code})")
                self.passed += 1
                return response.json() if response.content else {}
            else:
                error_msg = f"❌ FAIL: {description} - Expected {expected_status}, got {response.status_code}"
                if response.content:
                    try:
                        error_detail = response.json()
                        error_msg += f" - {error_detail}"
                    except:
                        error_msg += f" - {response.text[:200]}"
                self.log(error_msg, "ERROR")
                self.errors.append(error_msg)
                self.failed += 1
                return None
                
        except requests.exceptions.RequestException as e:
            error_msg = f"❌ FAIL: {description} - Network error: {str(e)}"
            self.log(error_msg, "ERROR")
            self.errors.append(error_msg)
            self.failed += 1
            return None
        except Exception as e:
            error_msg = f"❌ FAIL: {description} - Unexpected error: {str(e)}"
            self.log(error_msg, "ERROR")
            self.errors.append(error_msg)
            self.failed += 1
            return None

    def run_tests(self):
        """Run all backend API tests"""
        self.log("Starting Chess Master Backend API Tests")
        self.log(f"Base URL: {BASE_URL}")
        self.log(f"Session Token: {SESSION_TOKEN}")
        
        # 1. Health Check Tests
        self.log("\n=== HEALTH CHECK TESTS ===")
        self.test_endpoint("GET", "/", description="Root endpoint health check")
        self.test_endpoint("GET", "/health", description="Health check endpoint")
        
        # 2. Authentication Tests
        self.log("\n=== AUTHENTICATION TESTS ===")
        auth_response = self.test_endpoint("GET", "/auth/me", description="Get current user profile")
        
        if auth_response:
            self.log(f"User authenticated as: {auth_response.get('name', 'Unknown')} ({auth_response.get('membership', 'Unknown')})")
            if auth_response.get('is_owner'):
                self.log("✅ Owner status confirmed")
            else:
                self.log("⚠️  Warning: User is not owner")
        
        # 3. Membership Tests
        self.log("\n=== MEMBERSHIP TESTS ===")
        tiers = self.test_endpoint("GET", "/membership/tiers", description="Get membership tiers")
        
        if tiers:
            self.log(f"Available tiers: {list(tiers.keys())}")
            
        # Test membership update (should stay owner)
        self.test_endpoint("PUT", "/users/me/membership", 
                          data={"membership": "gold"}, 
                          description="Try to change membership (should stay owner)")
        
        # 4. Game Tests
        self.log("\n=== GAME TESTS ===")
        
        # Test game creation with different modes
        game_modes = [
            {"mode": "computer", "ai_level": "beginner"},
            {"mode": "computer", "ai_level": "master"},  # Should work for owner
            {"mode": "local"},
            {"mode": "online"}
        ]
        
        created_games = []
        for game_data in game_modes:
            game_response = self.test_endpoint("POST", "/games", 
                                             data=game_data,
                                             description=f"Create {game_data['mode']} game")
            if game_response:
                created_games.append(game_response['game_id'])
        
        # Test game retrieval
        if created_games:
            game_id = created_games[0]
            self.test_endpoint("GET", f"/games/{game_id}", description="Get game details")
            
            # Test making a move
            move_data = {
                "move": "e2e4",
                "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
            }
            self.test_endpoint("PUT", f"/games/{game_id}/move", 
                             data=move_data,
                             description="Make a move in game")
            
            # Test ending game
            end_data = {"status": "checkmate", "winner": "test-owner-123"}
            self.test_endpoint("PUT", f"/games/{game_id}/end", 
                             data=end_data,
                             description="End game")
        
        # Test game history
        self.test_endpoint("GET", "/games/history/me", description="Get game history")
        
        # 5. Puzzle Tests
        self.log("\n=== PUZZLE TESTS ===")
        
        # Test puzzle listing
        self.test_endpoint("GET", "/puzzles", description="Get all puzzles")
        
        # Test puzzles by difficulty
        difficulties = ["easy", "medium", "hard", "impossible"]
        for difficulty in difficulties:
            self.test_endpoint("GET", f"/puzzles?difficulty={difficulty}", 
                             description=f"Get {difficulty} puzzles")
            
            # Test random puzzle for each difficulty
            random_puzzle = self.test_endpoint("GET", f"/puzzles/random?difficulty={difficulty}", 
                                             description=f"Get random {difficulty} puzzle")
            
            if random_puzzle:
                puzzle_id = random_puzzle.get('puzzle_id')
                if puzzle_id:
                    # Test specific puzzle retrieval
                    self.test_endpoint("GET", f"/puzzles/{puzzle_id}", 
                                     description=f"Get specific puzzle {puzzle_id}")
                    
                    # Test puzzle attempt
                    attempt_data = {
                        "solved": True,
                        "moves_made": ["e2e4", "e7e5"],
                        "time_taken": 30
                    }
                    self.test_endpoint("POST", f"/puzzles/{puzzle_id}/attempt", 
                                     data=attempt_data,
                                     description=f"Submit puzzle attempt for {puzzle_id}")
        
        # Test puzzle stats
        self.test_endpoint("GET", "/puzzles/stats/me", description="Get puzzle statistics")
        
        # 6. Matchmaking Tests
        self.log("\n=== MATCHMAKING TESTS ===")
        
        # Test joining queue
        queue_response = self.test_endpoint("POST", "/matchmaking/queue", 
                                          description="Join matchmaking queue")
        
        if queue_response:
            match_id = queue_response.get('match_id')
            if match_id:
                # Test match status
                self.test_endpoint("GET", f"/matchmaking/status/{match_id}", 
                                 description="Get match status")
                
                # Test leaving queue
                self.test_endpoint("DELETE", "/matchmaking/queue", 
                                 description="Leave matchmaking queue")
        
        # 7. User Profile Tests
        self.log("\n=== USER PROFILE TESTS ===")
        self.test_endpoint("GET", "/users/me", description="Get user profile with tier info")
        
        # 8. Logout Test
        self.log("\n=== LOGOUT TEST ===")
        self.test_endpoint("POST", "/auth/logout", description="Logout user")
        
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        
        self.log("\n" + "="*60)
        self.log("TEST SUMMARY")
        self.log("="*60)
        self.log(f"Total Tests: {total}")
        self.log(f"Passed: {self.passed}")
        self.log(f"Failed: {self.failed}")
        self.log(f"Success Rate: {success_rate:.1f}%")
        
        if self.errors:
            self.log("\nFAILED TESTS:")
            for i, error in enumerate(self.errors, 1):
                self.log(f"{i}. {error}")
        
        if self.failed == 0:
            self.log("\n🎉 ALL TESTS PASSED!")
        else:
            self.log(f"\n⚠️  {self.failed} TESTS FAILED")
            
        return self.failed == 0

if __name__ == "__main__":
    tester = ChessAPITester()
    success = tester.run_tests()
    sys.exit(0 if success else 1)