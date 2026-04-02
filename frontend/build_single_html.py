#!/usr/bin/env python3
"""
Single-File HTML Builder for itch.io
Inlines JS bundle, CSS, and Base64 fonts into a single index.html
with deferred execution to prevent itch.io Black Screen.
"""
import base64
import os
import glob

DIST_DIR = os.path.join(os.path.dirname(__file__), 'dist')

def find_js_bundle():
    """Find the JS bundle in dist/_expo/static/js/web/"""
    pattern = os.path.join(DIST_DIR, '_expo', 'static', 'js', 'web', '*.js')
    files = glob.glob(pattern)
    if not files:
        raise FileNotFoundError(f"No JS bundle found at {pattern}")
    return files[0]

def find_ionicons_font():
    """Find the Ionicons TTF font file"""
    pattern = os.path.join(DIST_DIR, 'assets', '**', 'Ionicons*.ttf')
    files = glob.glob(pattern, recursive=True)
    if not files:
        raise FileNotFoundError("No Ionicons font found")
    return files[0]

def find_all_fonts():
    """Find all TTF font files for base64 embedding"""
    pattern = os.path.join(DIST_DIR, 'assets', '**', '*.ttf')
    return glob.glob(pattern, recursive=True)

def get_font_face_css(fonts):
    """Generate @font-face CSS rules with base64 embedded fonts"""
    css_parts = []
    for font_path in fonts:
        font_name = os.path.basename(font_path).split('.')[0]
        with open(font_path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('ascii')
        css_parts.append(
            f"@font-face {{ font-family: '{font_name}'; "
            f"src: url('data:font/ttf;base64,{b64}') format('truetype'); "
            f"font-weight: normal; font-style: normal; }}"
        )
    return '\n'.join(css_parts)

def build():
    print("=== Single-File HTML Builder ===")

    # 1. Read JS bundle
    js_path = find_js_bundle()
    print(f"JS Bundle: {js_path} ({os.path.getsize(js_path) / 1024:.0f}KB)")
    with open(js_path, 'r', encoding='utf-8') as f:
        js_content = f.read()

    # 2. Find and encode only essential fonts (Ionicons is the only one we actually use)
    ionicons_path = find_ionicons_font()
    print(f"Ionicons Font: {ionicons_path} ({os.path.getsize(ionicons_path) / 1024:.0f}KB)")

    # Only embed Ionicons - the rest are not used by the app
    with open(ionicons_path, 'rb') as f:
        ionicons_b64 = base64.b64encode(f.read()).decode('ascii')

    # Also get the original font filename hash from the JS to do replacement
    ionicons_filename = os.path.basename(ionicons_path)

    font_css = (
        f"@font-face {{ font-family: 'Ionicons'; "
        f"src: url('data:font/ttf;base64,{ionicons_b64}') format('truetype'); "
        f"font-weight: normal; font-style: normal; }}"
    )

    # 3. Build the single-file HTML
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<base href="./">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,shrink-to-fit=no">
<meta name="theme-color" content="#1a1a2e">
<meta name="description" content="Chess Master - Play chess, solve puzzles, learn openings">
<title>Chess Master</title>
<style>
/* Critical Path CSS - renders BEFORE JS loads */
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{height:100%;overflow:hidden;background:#1a1a2e;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}}
#root{{display:flex;height:100%;flex:1}}
/* Loading screen - visible immediately */
#tt-loader{{position:fixed;top:0;left:0;right:0;bottom:0;background:#1a1a2e;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999}}
#tt-loader .crown{{font-size:64px;animation:pulse 1.5s ease infinite}}
#tt-loader .title{{color:#FFD700;font-size:24px;font-weight:bold;margin-top:16px}}
#tt-loader .sub{{color:#888;font-size:14px;margin-top:8px}}
#tt-loader .bar{{width:200px;height:3px;background:#333;border-radius:2px;margin-top:24px;overflow:hidden}}
#tt-loader .bar-fill{{height:100%;background:linear-gradient(90deg,#FFD700,#FF6B35);width:0;border-radius:2px;animation:load 2s ease forwards}}
@keyframes pulse{{0%,100%{{transform:scale(1)}}50%{{transform:scale(1.1)}}}}
@keyframes load{{0%{{width:0}}50%{{width:60%}}100%{{width:95%}}}}
@keyframes ttshake{{0%,100%{{transform:translate(0)}}25%{{transform:translate(-3px,2px)}}50%{{transform:translate(3px,-2px)}}75%{{transform:translate(-2px,3px)}}}}
/* Base64 Font Embedding */
{font_css}
</style>
</head>
<body>
<noscript>You need JavaScript to play Chess Master.</noscript>
<div id="root"></div>
<div id="tt-loader">
<div class="crown">&#x1F451;</div>
<div class="title">Chess Master</div>
<div class="sub">Loading game engine...</div>
<div class="bar"><div class="bar-fill"></div></div>
</div>
<script>
// Deferred bundle execution to prevent itch.io Black Screen
// The CSS paints the loading screen FIRST, then JS executes.
(function(){{
  var loader=document.getElementById('tt-loader');
  function hideLoader(){{
    if(loader){{
      loader.style.transition='opacity 0.3s';
      loader.style.opacity='0';
      setTimeout(function(){{
        if(loader&&loader.parentNode)loader.parentNode.removeChild(loader);
      }},350);
    }}
  }}
  // Remove loader after app mounts or after timeout
  var _origCreateElement=document.createElement.bind(document);
  var checkCount=0;
  function checkMounted(){{
    checkCount++;
    var root=document.getElementById('root');
    if(root&&root.childNodes.length>0){{hideLoader();return;}}
    if(checkCount<100)requestAnimationFrame(checkMounted);
    else hideLoader();
  }}
  // Defer JS execution with requestAnimationFrame + setTimeout
  requestAnimationFrame(function(){{
    setTimeout(function(){{
      try{{
        // Execute the bundle
        {js_content}
      }}catch(e){{
        console.error('Bundle execution error:',e);
        if(loader){{
          loader.querySelector('.sub').textContent='Error loading game. Please refresh.';
          loader.querySelector('.bar-fill').style.background='#E74C3C';
        }}
      }}
      // Start checking if app mounted
      requestAnimationFrame(checkMounted);
    }},50);
  }});
}})();
</script>
</body>
</html>'''

    # 4. Write the final index.html
    out_path = os.path.join(DIST_DIR, 'index.html')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)

    file_size = os.path.getsize(out_path)
    print(f"\n=== BUILD COMPLETE ===")
    print(f"Output: {out_path}")
    print(f"Size: {file_size / 1024:.0f}KB ({file_size / 1024 / 1024:.2f}MB)")
    print(f"Single file: YES")
    print(f"External CDN: NONE")
    print(f"Deferred execution: YES")
    print(f"Base64 fonts: Ionicons embedded")

if __name__ == '__main__':
    build()
