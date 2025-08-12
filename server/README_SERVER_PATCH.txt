Server patch installed.

Wire these routes in server/index.ts:
------------------------------------
import importExport from "./routes/importExport";
import projectContacts from "./routes/projectContacts";
import notes from "./routes/notes";

app.use(express.json());
app.use("/api", importExport);
app.use("/api", projectContacts);
app.use("/api", notes);

Optional:
- Set INTERNAL_BASE_URL if your server isn't localhost:PORT.
- The contacts & notes are stored in /data/*.json (on-disk). Replace with DB as needed.
