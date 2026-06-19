from __future__ import annotations

import sqlite3


class EvidenceVault:
    def __init__(self, db_path: str = ":memory:"):
        self._c = sqlite3.connect(db_path)
        self._c.execute("CREATE TABLE IF NOT EXISTS links(figure_id TEXT, document_id TEXT, clause_id TEXT)")
        self._c.execute(
            "CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, "
            "actor TEXT, action TEXT, payload_hash TEXT)"
        )
        self._c.commit()

    def link(self, figure_id: str, document_id: str, clause_id: str) -> None:
        self._c.execute("INSERT INTO links VALUES(?,?,?)", (figure_id, document_id, clause_id))
        self._c.commit()

    def links_for(self, figure_id: str) -> list[tuple]:
        return [
            (d, c)
            for d, c in self._c.execute(
                "SELECT document_id,clause_id FROM links WHERE figure_id=?", (figure_id,)
            )
        ]

    def log_action(self, actor: str, action: str, payload_hash: str) -> None:
        self._c.execute(
            "INSERT INTO audit(actor,action,payload_hash) VALUES(?,?,?)",
            (actor, action, payload_hash),
        )
        self._c.commit()

    def audit_trail(self) -> list[dict]:
        rows = self._c.execute("SELECT actor,action,payload_hash FROM audit ORDER BY id")
        return [{"actor": a, "action": ac, "payload_hash": h} for a, ac, h in rows]
