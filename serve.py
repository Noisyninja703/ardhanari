#!/usr/bin/env python3
"""Local dev server for testing on this machine and on your phone.

    python serve.py            # port 8000
    python serve.py 3000       # any other port

Prints both a localhost URL and a LAN URL. Open the LAN one on your phone
(same wifi) to test touch properly — the puzzles behave differently with a
finger than with a cursor, so this is not optional.

Why not just `python -m http.server`? Two reasons:

  1. It sends caching headers, and phone browsers honour them aggressively.
     You end up staring at a stale page convinced your change didn't work.
     This one sends no-cache on everything.
  2. It guesses some MIME types wrong depending on the machine's registry,
     and a .js file served as text/plain makes every ES module fail to load.
     This one pins the types we care about.

Stop it with Ctrl+C.
"""

import http.server
import mimetypes
import os
import socket
import socketserver
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PORT = 8000

# Pin the types that matter. On Windows these are read from the registry and
# are wrong often enough to waste an afternoon — a module served as
# text/plain is rejected outright by the browser.
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/javascript", ".mjs")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("audio/mpeg", ".mp3")


def lan_ip():
    """This machine's address on the local network.

    Opens a UDP socket toward a public address and asks the OS which local
    interface it would use. Nothing is actually sent — it's just the
    cleanest way to find the right interface when a machine has several
    (wifi, ethernet, VPN, WSL, Docker all show up otherwise).
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return None
    finally:
        sock.close()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # Never cache anything. This is a dev server; correctness beats speed.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Default logging prints a line per request, which buries anything
        # useful. Only surface failures.
        status = str(args[1]) if len(args) > 1 else ""
        if status.startswith(("4", "5")):
            sys.stderr.write(f"  {status}  {args[0]}\n")


class Server(socketserver.ThreadingTCPServer):
    daemon_threads = True

    # On Linux/macOS this lets you restart immediately instead of waiting for
    # the old socket to leave TIME_WAIT. On Windows the same option means
    # something different and worse: a second server is allowed to bind a
    # port that's already in use, so two servers end up fighting over it and
    # you get whichever one Windows feels like. We want a clean error there.
    allow_reuse_address = os.name != "nt"

    def server_bind(self):
        if os.name == "nt":
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def main():
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            sys.exit(f"'{sys.argv[1]}' is not a port number.")

    try:
        server = Server(("0.0.0.0", port), Handler)
    except OSError as err:
        sys.exit(f"Can't serve on port {port}: {err}\nTry another: python serve.py {port + 1}")

    ip = lan_ip()

    print()
    # ASCII only in the banner: the Windows console falls back to cp1252 and
    # turns anything fancier into mojibake.
    print("  ardhanari - serving locally")
    print()
    print(f"  This machine   http://localhost:{port}")
    if ip:
        print(f"  Your phone     http://{ip}:{port}")
        print()
        print("  Phone must be on the same wifi. If it won't connect, Windows")
        print("  Firewall is blocking Python - allow it on private networks.")
    else:
        print("  Your phone     unavailable (couldn't find a network address)")
    print()
    print("  Ctrl+C to stop.")
    print()
    # Python block-buffers stdout when it isn't a terminal, which hides this
    # banner if you ever pipe or redirect the output.
    sys.stdout.flush()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped.\n")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
