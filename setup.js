// setup.js
import { Database } from "bun:sqlite";

export function initializeDatabase(dbPath = "./database.db") {
  const db = new Database(dbPath);

  // 테이블 생성
  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chatType TEXT,
      text TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      reportType TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_sales (
        sale_date DATE PRIMARY KEY,
        amount INT NOT NULL
    );
  `);

  // 초기 데이터 삽입 (INSERT OR IGNORE)
  db.run(`
      INSERT OR IGNORE INTO daily_sales (sale_date, amount) VALUES 
      ('2026-01-01', 150), ('2026-01-02', 230), ('2026-01-03', 180),
      ('2026-01-04', 400), ('2026-01-05', 310), ('2026-01-06', 520),
      ('2026-01-07', 480);
  `);

  db.run(`
      INSERT OR IGNORE INTO reports (name, reportType) 
      VALUES 
          ('판매실적', 'MSTR'),
          ('실시간 마케팅', 'WEB'),
          ('리포트3', 'HYBRID');
  `);

  console.log("✅ Database initialized successfully.");
  return db;
}
