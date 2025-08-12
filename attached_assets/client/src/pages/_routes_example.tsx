import React from "react";
import { Routes, Route } from "react-router-dom";

// Replace with your actual components:
const Dashboard = React.lazy(() => import("@/pages/dashboard"));
const EmployeesPage = React.lazy(() => import("@/pages/employees.filter"));
const EquipmentPage = React.lazy(() => import("@/pages/equipment.filter"));
const ProjectProfile = React.lazy(() => import("@/pages/project-profile"));
const EmployeeProfile = React.lazy(() => import("@/pages/employee-profile"));   // ensure this exists
const EquipmentProfile = React.lazy(() => import("@/pages/equipment-profile")); // ensure this exists

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/equipment" element={<EquipmentPage />} />
      <Route path="/projects/:id" element={<ProjectProfile />} />
      <Route path="/employees/:id" element={<EmployeeProfile />} />
      <Route path="/equipment/:id" element={<EquipmentProfile />} />
    </Routes>
  );
}
