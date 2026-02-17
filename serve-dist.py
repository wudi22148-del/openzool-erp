# Simple HTTP Server to serve dist.zip
# Run this script, then download from server

import http.server
import socketserver
import os

PORT = 8888
DIRECTORY = r"e:\Claude code test\erp-admin\apps\web-antd"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

os.chdir(DIRECTORY)

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print("=" * 50)
    print("  HTTP Server Started")
    print("=" * 50)
    print(f"\nServing files from: {DIRECTORY}")
    print(f"Server running at: http://localhost:{PORT}")
    print(f"\nTo download on server, run:")
    print(f"  wget http://YOUR_LOCAL_IP:{PORT}/dist.zip -O /tmp/dist.zip")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    print()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
