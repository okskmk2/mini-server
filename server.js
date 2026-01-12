import { Database } from "bun:sqlite";
import { GoogleGenAI } from "@google/genai";

const db = new Database("./database.db");
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

const reports = [
  { name: "판매실적", reportType: "MSTR" },
  { name: "실시간 마케팅", reportType: "WEB" },
  { name: "리포트3", reportType: "HYBRID" },
];

const insertReport = db.prepare(`
  INSERT OR IGNORE INTO reports (name, reportType) 
  VALUES ($name, $reportType)
`);

const insertMany = db.transaction((data) => {
  for (const report of data) {
    insertReport.run({
      $name: report.name,
      $reportType: report.reportType,
    });
  }
});

insertMany(reports);
console.log("초기 리포트 데이터 로드 완료");

const PORT = process.env.PORT || 3000;

// API 키는 환경변수로 관리
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;

    // CORS 설정
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Content-Type": "application/json",
    };

    // OPTIONS 요청 처리 (CORS Preflight)
    if (method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // --- 라우팅 ---

    // GET /reports
    if (method === "GET" && url.pathname === "/reports") {
      const allReports = db.prepare("SELECT * FROM reports").all();
      return Response.json(allReports, { headers });
    }

    // GET /reports/:id
    if (method === "GET" && url.pathname.startsWith("/reports/")) {
      const id = url.pathname.split("/").pop();
      if (!id) {
        return Response.json(
          {
            error: {
              message: "path :id 값이 없습니다.",
            },
          },
          {
            headers,
            status: 400,
          }
        );
      }
      const report = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);

      if (!report) {
        return new Response(JSON.stringify({ error: "Not Found" }), {
          status: 404,
          headers,
        });
      }
      return Response.json(report, { headers });
    }

    // POST /chat
    if (method === "POST" && url.pathname === "/chat") {
      const { contents } = await req.json();
      if (!contents) {
        return Response.json(
          {
            error: {
              message: "body contents 값이 없습니다.",
            },
          },
          {
            headers,
            status: 400,
          }
        );
      }
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents,
        });
        return Response.json({ output: response.text }, { headers });
      } catch (error) {
        console.log(error.message);
        const errorObj = JSON.parse(error.message);
        return Response.json(
          {
            error: {
              message: errorObj.error.message,
            },
          },
          {
            headers,
            status: errorObj.error.code,
          }
        );
      }
    }

    // POST /chat/save
    if (method === "POST" && url.pathname === "/chat/save") {
      const { chatType, text } = await req.json();
      const query = db.prepare(
        "INSERT INTO chats (chatType, text) VALUES (?, ?)"
      );
      const result = query.run(chatType, text);
      return Response.json(
        { id: result.lastInsertRowid },
        { status: 201, headers }
      );
    }

    // GET /chats
    if (method === "GET" && url.pathname === "/chats") {
      const rows = db.prepare("SELECT * FROM chats").all();
      return Response.json(rows, { headers });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Bun server is running on http://localhost:${PORT}`);
