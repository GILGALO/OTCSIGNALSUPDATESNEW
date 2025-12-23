import os
import time
from threading import Thread
from flask import Flask

# ---- BOT IMPORT ----
# Adjust ONLY if ImportError happens
from server import start_bot


app = Flask(__name__)

@app.route("/")
def home():
    return "OTC Signal Bot is running"


def run_web():
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)


if __name__ == "__main__":
    Thread(target=run_web, daemon=True).start()
    time.sleep(2)
    start_bot()
