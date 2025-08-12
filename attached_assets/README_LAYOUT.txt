App Layout Shell (Sidebar on Every Page)
-----------------------------------------
This adds a global layout so the Sidebar renders on ALL app pages.

Files included:
- client/src/components/layout/AppLayout.tsx

How to wire it:
1) Ensure your Sidebar is at: client/src/components/dashboard/sidebar.tsx
   (If the path differs, update the import in AppLayout.tsx.)

2) Update your router (usually in client/src/App.tsx) to nest routes:
   ---------------------------------------------------------------
   import { Routes, Route, Navigate } from "react-router-dom";
   import AppLayout from "@/components/layout/AppLayout";
   import DashboardPage from "@/pages/dashboard";
   // import other pages like WhiteLabelPage, Settings, etc.

   export default function App() {
     return (
       <Routes>
         <Route element={<AppLayout />}>             {/* App shell with sidebar */}
           <Route path="/" element={<Navigate to="/dashboard" replace />} />
           <Route path="/dashboard" element={<DashboardPage />} />
           {/* <Route path="/white-label" element={<WhiteLabelPage />} /> */}
           {/* <Route path="/settings" element={<SettingsPage />} /> */}
           {/* add other routes here */}
         </Route>

         {/* Public routes (e.g., login) can live outside the layout */}
         {/* <Route path="/login" element={<LoginPage />} /> */}
       </Routes>
     );
   }
   ---------------------------------------------------------------

3) That’s it. All nested routes will render inside <Outlet /> with the Sidebar visible.

Notes:
- If you already use a custom router file, perform the same nesting there.
- If you previously had layout wrappers on a per-page basis, remove them to avoid double headers.
