SSE Real-time Patch
-------------------
Wire these in server/index.ts:

import stream from "./realtime/stream";
import assignments from "./routes/assignments";
import archive from "./routes/archive"; // (patched version that emits)

app.use("/api", stream);        // GET /api/stream (SSE endpoint)
app.use("/api", assignments);   // PATCH /api/{employees|equipment}/:id/assignment
app.use("/api", archive);       // archive/restore/remove + GET /api/history

Notes
- INTERNAL_BASE_URL should point at your own server base (default http://localhost:PORT).
- These routes forward to your existing CRUD endpoints, then broadcast events.
- You can also call broadcast({type: "...", ...}) from any other route.
