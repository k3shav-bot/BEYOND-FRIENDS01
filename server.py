import json
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "opinions.db"


def init_db() -> None:
    connection = sqlite3.connect(DB_PATH)
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.commit()
    finally:
        connection.close()


def fetch_feedback() -> list[dict]:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        rows = connection.execute(
            """
            SELECT id, name, role, message, created_at
            FROM feedback
            ORDER BY id DESC
            LIMIT 50
            """
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        connection.close()


def save_feedback(payload: dict) -> None:
    connection = sqlite3.connect(DB_PATH)
    try:
        connection.execute(
            """
            INSERT INTO feedback (name, role, message, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                payload["name"],
                payload["role"],
                payload["message"],
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        connection.commit()
    finally:
        connection.close()


class FeedbackHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, payload: object) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        if body:
            self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path == "/api/feedback":
            self._send_json(200, fetch_feedback())
            return

        self._send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path != "/api/feedback":
            self._send_json(404, {"error": "Not found"})
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON payload"})
            return

        name = str(payload.get("name", "")).strip()
        role = str(payload.get("role", "Student")).strip() or "Student"
        message = str(payload.get("message", "")).strip()

        if not name or not message:
            self._send_json(400, {"error": "Name and message are required"})
            return

        save_feedback({
            "name": name,
            "role": role,
            "message": message,
        })
        self._send_json(201, {"success": True})


def run() -> None:
    init_db()
    server = ThreadingHTTPServer(("127.0.0.1", 8000), FeedbackHandler)
    print("Beyond Friends feedback server is running on http://127.0.0.1:8000")
    server.serve_forever()


if __name__ == "__main__":
    run()
