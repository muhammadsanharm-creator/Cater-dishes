import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("catering.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    wage_rate REAL NOT NULL,
    qr_id TEXT UNIQUE NOT NULL,
    payment_method TEXT DEFAULT 'Cash',
    email TEXT,
    phone TEXT,
    aadhaar TEXT,
    is_admin INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    date DATETIME NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_id INTEGER,
    FOREIGN KEY (event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER,
    check_in DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_out DATETIME,
    total_wage REAL,
    status TEXT DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    ingredients TEXT,
    price REAL,
    photo_url TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (name, role, wage_rate, qr_id) VALUES (?, ?, ?, ?)");
  insertUser.run("John Captain", "Captain", 50, "QR-CAP-001");
  insertUser.run("Sam Supervisor", "Supervisor", 40, "QR-SUP-001");
  insertUser.run("Mike Mainboy", "Mainboy", 30, "QR-MB-001");
  insertUser.run("Junior Joe", "Juniorboy", 20, "QR-JB-001");

  const insertCat = db.prepare("INSERT INTO categories (name) VALUES (?)");
  ["Service", "Kitchen", "Cleaning", "Logistics"].forEach(cat => insertCat.run(cat));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { name, role = 'Juniorboy', wage_rate = 20, payment_method = 'Cash', email, phone, aadhaar, is_admin = false } = req.body;
    const qr_id = `QR-${role.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
    const info = db.prepare("INSERT INTO users (name, role, wage_rate, qr_id, payment_method, email, phone, aadhaar, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(name, role, wage_rate, qr_id, payment_method, email, phone, aadhaar, is_admin ? 1 : 0);
    res.json({ id: info.lastInsertRowid, qr_id });
  });

  app.patch("/api/users/:id", (req, res) => {
    const { name, role, wage_rate, payment_method, email, phone, aadhaar, is_admin } = req.body;
    const { id } = req.params;
    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name), 
          role = COALESCE(?, role), 
          wage_rate = COALESCE(?, wage_rate), 
          payment_method = COALESCE(?, payment_method), 
          email = COALESCE(?, email), 
          phone = COALESCE(?, phone), 
          aadhaar = COALESCE(?, aadhaar), 
          is_admin = COALESCE(?, is_admin)
      WHERE id = ?
    `).run(name, role, wage_rate, payment_method, email, phone, aadhaar, is_admin !== undefined ? (is_admin ? 1 : 0) : null, id);
    res.json({ message: "User updated" });
  });

  app.get("/api/events", (req, res) => {
    const events = db.prepare("SELECT * FROM events ORDER BY date DESC").all();
    res.json(events);
  });

  app.post("/api/events", (req, res) => {
    const { name, location, date, description } = req.body;
    const info = db.prepare("INSERT INTO events (name, location, date, description) VALUES (?, ?, ?, ?)").run(name, location, date, description);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/announcements", (req, res) => {
    const announcements = db.prepare(`
      SELECT a.*, e.name as event_name 
      FROM announcements a 
      LEFT JOIN events e ON a.event_id = e.id 
      ORDER BY a.created_at DESC
    `).all();
    res.json(announcements);
  });

  app.post("/api/announcements", (req, res) => {
    const { title, content, event_id } = req.body;
    const info = db.prepare("INSERT INTO announcements (title, content, event_id) VALUES (?, ?, ?)").run(title, content, event_id);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/users/:id/payment-method", (req, res) => {
    const { payment_method } = req.body;
    const { id } = req.params;
    db.prepare("UPDATE users SET payment_method = ? WHERE id = ?").run(payment_method, id);
    res.json({ message: "Payment method updated" });
  });

  app.post("/api/attendance/:id/pay", (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE attendance SET status = 'Paid' WHERE id = ?").run(id);
    res.json({ message: "Payment marked as completed" });
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    const { name } = req.body;
    const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/categories/:id", (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, id);
    res.json({ message: "Category updated" });
  });

  app.delete("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM dishes WHERE category_id = ?").run(id);
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    res.json({ message: "Category and associated dishes deleted" });
  });

  app.get("/api/dishes", (req, res) => {
    const dishes = db.prepare("SELECT d.*, c.name as category_name FROM dishes d JOIN categories c ON d.category_id = c.id").all();
    res.json(dishes);
  });

  app.post("/api/dishes", (req, res) => {
    const { category_id, name, description, ingredients, price, photo_url } = req.body;
    const info = db.prepare("INSERT INTO dishes (category_id, name, description, ingredients, price, photo_url) VALUES (?, ?, ?, ?, ?, ?)").run(category_id, name, description, ingredients, price, photo_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/dishes/:id", (req, res) => {
    const { category_id, name, description, ingredients, price, photo_url } = req.body;
    const { id } = req.params;
    db.prepare("UPDATE dishes SET category_id = ?, name = ?, description = ?, ingredients = ?, price = ?, photo_url = ? WHERE id = ?").run(category_id, name, description, ingredients, price, photo_url, id);
    res.json({ message: "Dish updated" });
  });

  app.delete("/api/dishes/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM dishes WHERE id = ?").run(id);
    res.json({ message: "Dish deleted" });
  });

  app.post("/api/check-in", (req, res) => {
    const { qr_id, event_id, scanner_qr_id } = req.body;
    
    // Verify scanner
    if (!scanner_qr_id) return res.status(401).json({ error: "Scanner authorization required" });
    const scanner = db.prepare("SELECT * FROM users WHERE qr_id = ?").get() as any;
    if (!scanner || (scanner.role !== 'Captain' && scanner.role !== 'Supervisor' && scanner.role !== 'Admin')) {
      return res.status(403).json({ error: "Only Captains, Supervisors or Admins can perform scans" });
    }

    const user = db.prepare("SELECT * FROM users WHERE qr_id = ?").get() as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if already checked in
    const active = db.prepare("SELECT * FROM attendance WHERE user_id = ? AND check_out IS NULL").get();
    if (active) return res.status(400).json({ error: "Already checked in" });

    db.prepare("INSERT INTO attendance (user_id, event_id) VALUES (?, ?)").run(user.id, event_id || null);
    res.json({ message: "Checked in successfully", user });
  });

  app.post("/api/check-out", (req, res) => {
    const { qr_id, scanner_qr_id } = req.body;

    // Verify scanner
    if (!scanner_qr_id) return res.status(401).json({ error: "Scanner authorization required" });
    const scanner = db.prepare("SELECT * FROM users WHERE qr_id = ?").get() as any;
    if (!scanner || (scanner.role !== 'Captain' && scanner.role !== 'Supervisor' && scanner.role !== 'Admin')) {
      return res.status(403).json({ error: "Only Captains, Supervisors or Admins can perform scans" });
    }

    const user = db.prepare("SELECT * FROM users WHERE qr_id = ?").get() as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    const active = db.prepare("SELECT * FROM attendance WHERE user_id = ? AND check_out IS NULL").get() as any;
    if (!active) return res.status(400).json({ error: "No active session" });

    const checkOutTime = new Date().toISOString();
    const checkInTime = new Date(active.check_in);
    const hours = (new Date(checkOutTime).getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    const totalWage = hours * user.wage_rate;

    db.prepare("UPDATE attendance SET check_out = ?, total_wage = ? WHERE id = ?").run(checkOutTime, totalWage, active.id);
    res.json({ message: "Checked out successfully", totalWage });
  });

  app.get("/api/attendance", (req, res) => {
    const history = db.prepare(`
      SELECT a.*, u.name, u.role, e.name as event_name
      FROM attendance a 
      JOIN users u ON a.user_id = u.id 
      LEFT JOIN events e ON a.event_id = e.id
      ORDER BY a.check_in DESC
    `).all();
    res.json(history);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
