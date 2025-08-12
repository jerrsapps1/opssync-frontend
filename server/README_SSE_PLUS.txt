SSE Real-time (IDs + Replay)
----------------------------
Wire-up in server/index.ts:
  import stream from "./realtime/stream";
  import assignments from "./routes/assignments";
  import archive from "./routes/archive";

  app.use("/api", stream);        // GET /api/stream  and GET /api/events?since=ID
  app.use("/api", assignments);   // assignment routes (broadcasting)
  app.use("/api", archive);       // archive/restore/remove (broadcasting)

Features:
- Event IDs with ring buffer (env EVENT_LOG_CAP, default 1000)
- Replay missed events via:
  * SSE:  Last-Event-ID header handled automatically on reconnect
  * Query: /api/stream?since=123 to seed from a known last ID
  * REST:  /api/events?since=123 as a fallback JSON fetch
