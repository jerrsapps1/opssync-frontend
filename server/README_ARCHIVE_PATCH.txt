Archive & History Patch
-----------------------
Wire this route in server/index.ts:
  import archive from "./routes/archive";
  app.use("/api", archive);

Endpoints:
  POST   /api/:entity/:id/archive   (entity: employees|equipment|projects)
  POST   /api/:entity/:id/restore
  DELETE /api/:entity/:id           (soft-delete -> status: 'removed')
  GET    /api/history               (returns history.json)

Notes:
- This implementation assumes your existing PATCH /api/{entity}/{id} updates records.
- All actions append to data/history.json for audit trail.
- You can later swap to a DB without changing the client.
