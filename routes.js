import { GoogleGenAI } from "@google/genai";

// API 키는 환경변수로 관리
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const AI_MODEL_NAME = "gemini-2.5-flash"; // 참고 https://ai.google.dev/gemini-api/docs/models?hl=ko

export const createRoutes = (db, headers) => {
  return {
    // 1. 단순 상태 확인
    "/api/status": new Response("OK", { headers }),

    // 2. 리포트 관련 라우트
    "/reports": {
      GET: () => {
        const allReports = db.prepare("SELECT * FROM reports").all();
        return Response.json(allReports, { headers });
      },
    },

    // 3. 동적 파라미터 리포트 조회 (/reports/1)
    "/reports/:id": {
      GET: (req) => {
        const id = req.params.id;
        const report = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
        if (!report) return new Response("Not Found", { status: 404, headers });
        return Response.json(report, { headers });
      },
    },

    // 4. 채팅 관련 라우트
    "/chat": {
      POST: async (req) => {
        const { contents } = await req.json();
        if (!contents)
          return Response.json(
            { error: "No contents" },
            { status: 400, headers }
          );

        try {
          const response = await ai.models.generateContent({
            model: AI_MODEL_NAME,
            // contents,
            contents:
              contents + "\n 최대한 간결하게 대답해줘. 최대 100자 이내.",
          });
          return Response.json({ output: response.text }, { headers });
        } catch (error) {
          return Response.json(
            { error: error.message },
            { status: 500, headers }
          );
        }
      },
    },

    "/chat/save": {
      POST: async (req) => {
        const { chatType, text } = await req.json();
        const result = db
          .prepare("INSERT INTO chats (chatType, text) VALUES (?, ?)")
          .run(chatType, text);
        return Response.json(
          { id: result.lastInsertRowid },
          { status: 201, headers }
        );
      },
    },

    "/chats": {
      GET: () => {
        const rows = db.prepare("SELECT * FROM chats").all();
        return Response.json(rows, { headers });
      },
    },

    // 5. 차트 데이터 (쿼리 파라미터는 req.url에서 추출)
    "/chart-data": {
      GET: (req) => {
        const url = new URL(req.url);
        const startDt = url.searchParams.get("startDt");
        const endDt = url.searchParams.get("endDt");

        let query = "SELECT sale_date, amount FROM daily_sales";
        const params = [];

        if (startDt && endDt) {
          query += " WHERE sale_date BETWEEN ? AND ?";
          params.push(startDt, endDt);
        } else if (startDt) {
          query += " WHERE sale_date >= ?";
          params.push(startDt);
        }
        query += " ORDER BY sale_date ASC";

        const data = db.query(query).all(...params);
        return Response.json(data, { headers });
      },
    },

    // 6. 모든 매칭되지 않는 /api/* 요청 처리
    "/api/*": Response.json({ error: "Not found" }, { status: 404, headers }),
  };
};
