import subprocess
import os

# Generate individual sound effects using ffmpeg
sounds_dir = "/app/backend/trailer_tmp/sounds"
os.makedirs(sounds_dir, exist_ok=True)

# Game start sound (2 tones) - plays at ~3s
subprocess.run([
    "ffmpeg", "-y", "-f", "lavfi", "-i",
    "sine=frequency=523:duration=0.15,volume=0.15[s1];sine=frequency=659:duration=0.2:sample_rate=44100,adelay=120|120,volume=0.15[s2];[s1][s2]amix=inputs=2:duration=longest",
    f"{sounds_dir}/game_start.wav"
], capture_output=True)

# Move sound (short click) 
subprocess.run([
    "ffmpeg", "-y", "-f", "lavfi", "-i",
    "sine=frequency=800:duration=0.06,volume=0.12",
    f"{sounds_dir}/move.wav"
], capture_output=True)

# Select sound (tiny click)
subprocess.run([
    "ffmpeg", "-y", "-f", "lavfi", "-i",
    "sine=frequency=1200:duration=0.04,volume=0.08",
    f"{sounds_dir}/select.wav"
], capture_output=True)

# Capture sound (sharper)
subprocess.run([
    "ffmpeg", "-y", "-f", "lavfi", "-i",
    "sine=frequency=400:duration=0.08,volume=0.15",
    f"{sounds_dir}/capture.wav"
], capture_output=True)

# Now create a timeline audio track
# Video timeline (approx):
# 0-3s: Home screen
# 3s: Navigate to game (game start sound)
# 5s: Select e2 
# 5.8s: Move e4
# 7.3s: Select d7
# 8.1s: Move d5
# 9.6s: Select e4
# 10.4s: Capture exd5
# 12.5s: Navigate to openings
# 15.5s: Navigate to puzzles
# 18.5s: Navigate home

# Get video duration
result = subprocess.run([
    "ffprobe", "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    "/app/backend/trailer_tmp/32f9903164dce9b55b5c74f90483922a.webm"
], capture_output=True, text=True)
duration = float(result.stdout.strip())
print(f"Video duration: {duration}s")

# Build complex ffmpeg filter to place sounds at specific times
# Create silent base track matching video duration
cmd = [
    "ffmpeg", "-y",
    "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono,atrim=0:{duration}",
    "-i", f"{sounds_dir}/game_start.wav",
    "-i", f"{sounds_dir}/select.wav",
    "-i", f"{sounds_dir}/move.wav",
    "-i", f"{sounds_dir}/select.wav",
    "-i", f"{sounds_dir}/move.wav",
    "-i", f"{sounds_dir}/select.wav",
    "-i", f"{sounds_dir}/capture.wav",
    "-filter_complex",
    "[1]adelay=3000|3000[g];"
    "[2]adelay=5000|5000[s1];"
    "[3]adelay=5800|5800[m1];"
    "[4]adelay=7300|7300[s2];"
    "[5]adelay=8100|8100[m2];"
    "[6]adelay=9600|9600[s3];"
    "[7]adelay=10400|10400[c1];"
    "[0][g][s1][m1][s2][m2][s3][c1]amix=inputs=8:duration=first:dropout_transition=0",
    "-t", str(duration),
    f"{sounds_dir}/audio_track.wav"
]
result = subprocess.run(cmd, capture_output=True, text=True)
print("Audio track result:", result.returncode)
if result.stderr:
    print("stderr:", result.stderr[-200:])

# Now merge video + audio
cmd2 = [
    "ffmpeg", "-y",
    "-i", "/app/backend/trailer_tmp/32f9903164dce9b55b5c74f90483922a.webm",
    "-i", f"{sounds_dir}/audio_track.wav",
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-shortest",
    "/app/backend/chess-master-trailer.mp4"
]
result2 = subprocess.run(cmd2, capture_output=True, text=True)
print("Final merge result:", result2.returncode)
if result2.stderr:
    print("stderr:", result2.stderr[-200:])

# Check output
size = os.path.getsize("/app/backend/chess-master-trailer.mp4")
print(f"Final trailer: {size/1024:.0f} KB")
