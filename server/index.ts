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

// Add basic API endpoints that the dashboard expects
app.get("/api/conflicts", (_req, res) => {
  res.json({ employeeConflicts: [], equipmentConflicts: [] });
});

app.get("/api/projects", (_req, res) => {
  res.json([
    { id: "1", name: "Vehicle Maintenance", description: "Monthly vehicle inspections and repairs" },
    { id: "2", name: "Equipment Overhaul", description: "Complete equipment maintenance cycle" },
    { id: "3", name: "Emergency Repairs", description: "Priority repairs for operational equipment" }
  ]);
});

app.get("/api/employees", (_req, res) => {
  res.json([
    { id: "1", name: "Mike Johnson", currentProjectId: "1" },
    { id: "2", name: "Sarah Chen", currentProjectId: null },
    { id: "3", name: "David Rodriguez", currentProjectId: "2" },
    { id: "4", name: "Lisa Thompson", currentProjectId: null }
  ]);
});

app.get("/api/equipment", (_req, res) => {
  res.json([
    { id: "1", name: "Hydraulic Lift #1", type: "Automotive", status: "available", currentProjectId: null },
    { id: "2", name: "Diagnostic Scanner", type: "Diagnostic", status: "maintenance", currentProjectId: "1" },
    { id: "3", name: "Air Compressor", type: "Pneumatic", status: "available", currentProjectId: null },
    { id: "4", name: "Tire Machine", type: "Automotive", status: "broken", currentProjectId: null },
    { id: "5", name: "Hydraulic Lift #2", type: "Automotive", status: "available", currentProjectId: "2" }
  ]);
});

app.use("/api/billing", billingRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/auth", authRoutes);

const clientDist = path.join(process.cwd(), "dist", "public");
app.use(express.static(clientDist));
app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(PORT, () => console.log(`[express] serving on port ${PORT}`));