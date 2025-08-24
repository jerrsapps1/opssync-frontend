import express from "express";
import path from "path";
import billingRoutes from "./routes/billing";
import inviteRoutes from "./routes/invites";
import authRoutes from "./routes/auth";
import { ensureSchema, createDefaultOrgAndOwner } from "./startup";

const app = express();
app.use(express.json());

ensureSchema().then(createDefaultOrgAndOwner).catch(err => {
  console.error("Startup error:", err);
});

app.use("/api/billing", billingRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/auth", authRoutes);

const clientDist = path.join(process.cwd(), "dist", "client");
app.use(express.static(clientDist));
app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(PORT, () => console.log(`[express] serving on port ${PORT}`));