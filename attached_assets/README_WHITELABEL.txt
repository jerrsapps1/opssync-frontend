Instructions:

1) Sidebar
- Adds a "White Label Config" link to the side nav (keeps Settings there as well).
- If you want to remove header Settings/hamburger, delete those buttons in your header component or dashboard.tsx.

2) Route
In your client router (likely client/src/App.tsx), add:
  import WhiteLabelPage from "@/pages/white-label";
  <Route path="/white-label" element={<WhiteLabelPage />} />

3) Server
These endpoints are used:
- GET/PATCH /api/auth/brand-config
- POST /api/logo/upload-url
Adjust paths in pages/white-label.tsx if your API differs.
