const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const db = new sqlite3.Database("./db.sqlite");

app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: "super-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

const HASH = "$2b$10$wQ9KZ1w6uH1XyX2hKk8b8eYwz7k3k3H9QpXkYz6qX5bXq0z5XrY5G";

db.run(`CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  offlineMsg TEXT
)`);

db.get("SELECT * FROM settings WHERE id=1", (err, row) => {
  if (!row) {
    db.run("INSERT INTO settings VALUES (1, '서버가 재부팅중입니다')");
  }
});

app.post("/login", async (req, res) => {
  const { password } = req.body;
  const ok = await bcrypt.compare(password, HASH);
  if (ok) {
    req.session.auth = true;
    return res.json({ success: true });
  }
  res.json({ success: false });
});

app.get("/message", (req, res) => {
  db.get("SELECT offlineMsg FROM settings WHERE id=1", (err, row) => {
    res.json({ msg: row.offlineMsg });
  });
});

app.post("/message", (req, res) => {
  if (!req.session.auth) return res.status(403).end();
  const { msg } = req.body;
  db.run("UPDATE settings SET offlineMsg=? WHERE id=1", [msg]);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("running on", PORT));
