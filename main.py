import os
import time
from threading import Thread
from http.server import BaseHTTPRequestHandler, HTTPServer

from server import start_bot


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OTC Signal Bot is running")


def run_web():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    server.serve_forever()


if __name__ == "__main__":
    Thread(target=run_web, daemon=True).start()
    time.sleep(2)
    start_bot()
