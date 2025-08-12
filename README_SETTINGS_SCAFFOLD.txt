Settings Subpages + Details + Import/Export
-------------------------------------------
Files added:
- client/src/pages/settings/index.tsx           (Settings shell with sub-tabs)
- client/src/pages/settings/projects.tsx        (Project Details + Contact Persons)
- client/src/pages/settings/equipment.tsx       (Import/Export + equipment table)
- client/src/pages/settings/employees.tsx       (Import/Export + employee table)
- client/src/components/settings/ImportExportPanel.tsx
- client/src/pages/equipment-detail.tsx         (Equipment profile page)
- client/src/pages/employee-detail.tsx          (Employee profile page)

Router wiring (client/src/App.tsx):
----------------------------------
import SettingsIndex from "@/pages/settings";
import ProjectSettings from "@/pages/settings/projects";
import SettingsEquipment from "@/pages/settings/equipment";
import SettingsEmployees from "@/pages/settings/employees";
import EquipmentDetail from "@/pages/equipment-detail";
import EmployeeDetail from "@/pages/employee-detail";

// inside <Route element={<AppLayout />}> block:
<Route path="/settings" element={<SettingsIndex />}>
  <Route path="projects" element={<ProjectSettings />} />
  <Route path="equipment" element={<SettingsEquipment />} />
  <Route path="employees" element={<SettingsEmployees />} />
</Route>

<Route path="/equipment/:id" element={<EquipmentDetail />} />
<Route path="/employees/:id" element={<EmployeeDetail />} />

Dashboard double-click to open details:
---------------------------------------
- In equipment-list.tsx Draggable Card, add:
  import { useNavigate } from "react-router-dom";
  const nav = useNavigate();
  ...
  <Card onDoubleClick={() => nav(`/equipment/${eq.id}`)} ... />

- In employee-list.tsx Draggable Card, add:
  const nav = useNavigate();
  <Card onDoubleClick={() => nav(`/employees/${emp.id}`)} ... />

Server endpoints expected (adjust if different):
------------------------------------------------
GET /api/projects
GET /api/projects/:id/contacts
POST /api/projects/:id/contacts   (body: { name, role, phone, email })

GET /api/equipment
GET /api/equipment/:id
PATCH /api/equipment/:id
POST /api/equipment/import        (multipart form-data: file)
GET /api/equipment/export         (download)

GET /api/employees
GET /api/employees/:id
PATCH /api/employees/:id
POST /api/employees/import        (multipart form-data: file)
GET /api/employees/export         (download)
