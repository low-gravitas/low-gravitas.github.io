#!/usr/bin/env python3
"""Local overlay dev server for the Low Gravitas site.

Serves the hub repo and sibling project repos under a single origin at the
same sub-paths they use in production, so root-relative asset paths resolve
identically locally and on GitHub Pages.

Usage:
    python3 scripts/dev-server.py [--port 4747] [--host 127.0.0.1] [--no-reload]
"""

from __future__ import annotations

import argparse
import mimetypes
import os
import posixpath
import sys
import urllib.parse
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HUB_ROOT = Path(__file__).resolve().parent.parent

MOUNTS: dict[str, str] = {
    "/low-gravitas-zen-theme":   "../low-gravitas-zen-theme/docs",
    "/low-gravitas-symbol-font": "../low-gravitas-symbol-font/site",
    "/blog":                     "../blog/_site",
    "/":                         ".",
}

RELOAD_EXTS = {".html", ".css", ".js", ".ttf", ".webmanifest", ".png", ".svg", ".json"}
RELOAD_SNIPPET = b"""
<script>
(function () {
  var last = null;
  setInterval(function () {
    fetch('/__dev/mtime', { cache: 'no-store' })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        if (last === null) { last = t; return; }
        if (t !== last) { location.reload(); }
      })
      .catch(function () {});
  }, 800);
})();
</script>
"""

mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("font/ttf", ".ttf")
mimetypes.add_type("font/woff2", ".woff2")


def resolved_mounts() -> list[tuple[str, Path]]:
    out = []
    for prefix, rel in MOUNTS.items():
        root = (HUB_ROOT / rel).resolve()
        out.append((prefix, root))
    out.sort(key=lambda p: len(p[0]), reverse=True)
    return out


class OverlayHandler(SimpleHTTPRequestHandler):
    mounts: list[tuple[str, Path]] = []
    inject_reload: bool = True

    def do_GET(self) -> None:  # noqa: N802
        if self.path.split("?", 1)[0] == "/__dev/mtime":
            self._serve_mtime()
            return
        super().do_GET()

    def _serve_mtime(self) -> None:
        latest = 0.0
        for _prefix, root in self.mounts:
            if not root.is_dir():
                continue
            for dirpath, _dirnames, filenames in os.walk(root):
                for name in filenames:
                    ext = os.path.splitext(name)[1].lower()
                    if ext not in RELOAD_EXTS:
                        continue
                    try:
                        mt = os.path.getmtime(os.path.join(dirpath, name))
                    except OSError:
                        continue
                    if mt > latest:
                        latest = mt
        body = f"{latest:.3f}".encode("ascii")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/plain; charset=ascii")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _resolve(self, url_path: str) -> tuple[Path, Path] | None:
        path = url_path.split("?", 1)[0].split("#", 1)[0]
        path = urllib.parse.unquote(path)
        if not path.startswith("/"):
            path = "/" + path
        path = posixpath.normpath(path)
        if path == ".":
            path = "/"

        for prefix, root in self.mounts:
            if prefix == "/":
                remainder = path.lstrip("/")
                matched = True
            elif path == prefix or path.startswith(prefix + "/"):
                remainder = path[len(prefix):].lstrip("/")
                matched = True
            else:
                matched = False
            if not matched:
                continue
            candidate = (root / remainder).resolve() if remainder else root
            return root, candidate
        return None

    def translate_path(self, path: str) -> str:
        resolved = self._resolve(path)
        if resolved is None:
            return str(HUB_ROOT / "__missing__")
        root, candidate = resolved
        try:
            candidate.relative_to(root)
        except ValueError:
            self._forbidden = True  # type: ignore[attr-defined]
            return str(root / "__forbidden__")
        return str(candidate)

    def send_head(self):
        self._forbidden = False  # type: ignore[attr-defined]
        path = self.translate_path(self.path)
        if getattr(self, "_forbidden", False):
            self.send_error(HTTPStatus.FORBIDDEN, "Path traversal blocked")
            return None

        p = Path(path)
        if p.is_dir():
            parsed = urllib.parse.urlsplit(self.path)
            if not parsed.path.endswith("/"):
                self.send_response(HTTPStatus.MOVED_PERMANENTLY)
                new_parts = list(parsed)
                new_parts[2] = parsed.path + "/"
                self.send_header("Location", urllib.parse.urlunsplit(new_parts))
                self.send_header("Content-Length", "0")
                self.end_headers()
                return None
            index = p / "index.html"
            if index.is_file():
                p = index
            else:
                self.send_error(HTTPStatus.NOT_FOUND, "Directory listing disabled")
                return None

        if not p.is_file():
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return None

        ctype = self.guess_type(str(p))
        try:
            raw = p.read_bytes()
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return None

        if self.inject_reload and ctype.startswith("text/html"):
            lower = raw.lower()
            idx = lower.rfind(b"</body>")
            if idx == -1:
                raw = raw + RELOAD_SNIPPET
            else:
                raw = raw[:idx] + RELOAD_SNIPPET + raw[idx:]

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        from io import BytesIO
        return BytesIO(raw)

    def log_message(self, format: str, *args) -> None:  # noqa: A002
        sys.stderr.write("[dev] %s - %s\n" % (self.address_string(), format % args))


def main() -> int:
    parser = argparse.ArgumentParser(description="Low Gravitas overlay dev server")
    parser.add_argument("--port", type=int, default=4747)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--no-reload", dest="reload", action="store_false")
    args = parser.parse_args()

    mounts = resolved_mounts()
    OverlayHandler.mounts = mounts
    OverlayHandler.inject_reload = args.reload

    print("Low Gravitas dev server")
    print(f"  http://{args.host}:{args.port}/   (direct)")
    print(f"  https://lowgravitas.test/          (via puma-dev, if configured)")
    print()
    print("Mounts:")
    width = max(len(p) for p, _ in mounts)
    for prefix, root in sorted(mounts, key=lambda x: (x[0] != "/", x[0])):
        marker = "" if root.is_dir() else "  [MISSING]"
        print(f"  {prefix.ljust(width)} -> {root}{marker}")
    if args.reload:
        print()
        print("Live reload: ON (poll /__dev/mtime every 800ms)")
    print()

    server = ThreadingHTTPServer((args.host, args.port), OverlayHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
