# Supervisor Routes Wire-Up Helper

This helper **adds the import + app.use** lines to your `server/routes.ts` automatically.

## Quick Start
```bash
# From project root
node scripts/insert_supervisor_route.js
```

What it does:
- Ensures this import exists at the top:
  ```ts
  import supervisorRouter from "./routes/supervisor";
  ```
- Ensures this mount is inside `registerRoutes(app)` **before** `return httpServer;`:
  ```ts
  app.use("/api/supervisor", supervisorRouter);
  ```

If both are already present, it does nothing.

## Postman Collection
Import `collections/supervisor_portal.postman_collection.json` into Postman to test endpoints quickly.
