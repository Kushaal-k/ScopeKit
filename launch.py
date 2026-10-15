"""Start the local workbench and an available Ollama runtime."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
from urllib.request import Request
import webbrowser

import app


def ollama_running():
    try:
        with app.HTTP.open(Request(app.OLLAMA + "/api/version"), timeout=1) as response:
            return bool(json.load(response).get("version"))
    except (OSError, ValueError):
        return False


def start_available_ollama():
    if ollama_running():
        return None
    portable = app.ROOT.parent.parent / "work" / "ollama-runtime" / "cpu" / "ollama.exe"
    installed = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Ollama" / "ollama.exe"
    found = shutil.which("ollama")
    executable = Path(found) if found else installed if installed.is_file() else portable
    if not executable.is_file():
        print("Ollama is not installed. You can try the sample now; see the app's setup guide for AI.")
        return None
    env = os.environ.copy()
    env["OLLAMA_HOST"] = "127.0.0.1:11434"
    env["OLLAMA_NO_CLOUD"] = "1"
    if executable == portable:
        env["OLLAMA_MODELS"] = str(portable.parent.parent / "models")
    flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    process = subprocess.Popen([str(executable), "serve"], env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=flags)
    for _ in range(30):
        if process.poll() is not None or ollama_running():
            break
        time.sleep(0.2)
    if not ollama_running():
        print("Ollama did not start. Run 'ollama serve' to see its error; the sample remains available.")
    return process


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    try:
        server = app.ThreadingHTTPServer(("127.0.0.1", args.port), app.Handler)
    except OSError as exc:
        raise SystemExit(f"Cannot start on port {args.port}: {exc}. Try python launch.py --port 8766.")
    runtime = start_available_ollama()
    address = f"http://127.0.0.1:{args.port}"
    print(f"ScopeKit is ready at {address}\nKeep this window open. Ctrl+C stops the app.", flush=True)
    webbrowser.open(address)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        if runtime and runtime.poll() is None:
            runtime.terminate()
            try:
                runtime.wait(timeout=5)
            except subprocess.TimeoutExpired:
                runtime.kill()
