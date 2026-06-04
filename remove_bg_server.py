#!/usr/bin/env python3
"""
remove_bg_server.py — Local AI background removal server for the KI-Produkt-Tool.

Listens on http://localhost:5001/remove-bg
Accepts: POST { "image": "data:image/...;base64,..." }
Returns: JSON { "result": "data:image/png;base64,..." }

The result is a transparent PNG at the EXACT same resolution as the input.
rembg processes pixels directly — no downscaling.

INSTALL (once):
    pip install rembg onnxruntime Pillow

RUN:
    python3 remove_bg_server.py
    # or via the Claude Code launch panel → "rembg (BG Removal Server)"
"""

import http.server
import json
import base64
import sys
import os
from io import BytesIO

PORT = 5001

# ── Load rembg ────────────────────────────────────────────────────────────────
try:
    from rembg import remove, new_session
    from PIL import Image, ImageEnhance
except ImportError as e:
    print(f"ERROR: {e}")
    print("Run:  pip install rembg onnxruntime Pillow")
    sys.exit(1)

MODEL = os.environ.get('REMBG_MODEL', 'birefnet-general')
print(f"Loading model '{MODEL}' (downloads on first use — birefnet-general ~350 MB)…", flush=True)
session = new_session(MODEL)
print(f"rembg ready — listening on http://localhost:{PORT}", flush=True)


# ── Request handler ───────────────────────────────────────────────────────────

class Handler(http.server.BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        """Pre-flight CORS — browser sends this before the actual POST."""
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path != '/remove-bg':
            self.send_response(404)
            self.end_headers()
            return

        try:
            length = int(self.headers.get('Content-Length', 0))
            body   = json.loads(self.rfile.read(length)) if length else {}

            # Health-check ping (no image field) → return 200 immediately
            if 'image' not in body:
                self.send_response(200)
                self._cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"ok","model":"' + MODEL.encode() + b'"}')
                return

            img_data_url = body['image']

            # Strip the data-URL prefix to get raw base64
            raw_b64 = img_data_url.split(',', 1)[-1]
            img_bytes = base64.b64decode(raw_b64)

            orig = Image.open(BytesIO(img_bytes))

            # ── Contrast-enhanced matting ──────────────────────────────────
            # Generate the alpha mask from a contrast-boosted copy of the image.
            # High contrast makes narrow/pointed product shapes (tips, thin tubes)
            # stand out clearly against gradient backgrounds, so the model traces
            # the full silhouette. Original pixel values are preserved in the output.
            enhanced = ImageEnhance.Contrast(orig).enhance(2.0)
            enhanced = ImageEnhance.Sharpness(enhanced).enhance(1.5)
            buf_enh = BytesIO()
            enhanced.save(buf_enh, 'PNG')

            # Run rembg on the enhanced image to get a high-quality mask
            result_enhanced = remove(buf_enh.getvalue(), session=session)
            mask = Image.open(BytesIO(result_enhanced)).split()[3]  # alpha channel only

            # Apply that mask to the ORIGINAL (un-enhanced) image
            orig_rgba = orig.convert('RGBA')
            if mask.size != orig_rgba.size:
                mask = mask.resize(orig_rgba.size, Image.LANCZOS)
            orig_rgba.putalpha(mask)

            buf_out = BytesIO()
            orig_rgba.save(buf_out, 'PNG')
            result_bytes = buf_out.getvalue()
            result = orig_rgba

            result_b64   = base64.b64encode(result_bytes).decode('ascii')
            response_obj = json.dumps({'result': 'data:image/png;base64,' + result_b64})
            response_raw = response_obj.encode('utf-8')

            self.send_response(200)
            self._cors_headers()
            self.send_header('Content-Type',   'application/json')
            self.send_header('Content-Length',  str(len(response_raw)))
            self.end_headers()
            self.wfile.write(response_raw)

            w, h = result.size
            kb   = len(result_bytes) // 1024
            print(f"  ✓  {w}×{h}px  {kb} KB → client", flush=True)

        except Exception as e:
            import traceback
            print(f"  ✗  {e}", flush=True)
            traceback.print_exc()   # print full traceback so we can see the ROOT cause
            try:
                err = json.dumps({'error': str(e)}).encode('utf-8')
                self.send_response(500)
                self._cors_headers()
                self.send_header('Content-Type',  'application/json')
                self.send_header('Content-Length', str(len(err)))
                self.end_headers()
                self.wfile.write(err)
            except BrokenPipeError:
                pass  # client already disconnected — nothing to do

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, fmt, *args):
        pass  # silence default access log


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    import socketserver

    # Threaded server: health-check pings answer instantly even while a
    # remove-bg request is being processed, so the client never falsely
    # marks the server "offline" during a long inference.
    class ThreadedServer(socketserver.ThreadingTCPServer):
        daemon_threads      = True   # threads die with the process
        allow_reuse_address = True   # restart without "address in use"

    with ThreadedServer(('', PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nServer stopped.')
