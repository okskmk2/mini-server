import { createRoutes } from "./routes";
import { initializeDatabase } from "./setup";

const db = initializeDatabase("./database.db");

const PORT = process.env.PORT || 3000;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

Bun.serve({
  port: PORT,
  routes: createRoutes(db, headers),

  // routes에 명시되지 않은 경로 및 OPTIONS 요청 처리
  async fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    return new Response("Not Found", { status: 404, headers });
  },
});

console.log(`Bun server is running on http://localhost:${PORT}`);
