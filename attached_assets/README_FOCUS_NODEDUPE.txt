
FOCUS NODEDUPE PATCH v3

Features:
1. Project Focus - Show only assigned employees & equipment for a selected project.
2. No Duplicates - Once assigned, assets/employees are removed from unassigned lists.
3. Double-Click Project Card - Opens project profile with duration & % complete.
4. Asset Numbers - Visible on dashboard mini cards for equipment.
5. Inline Editing - Project profile allows start/end date and % complete edits.
6. Quick Counts Bar - Shows Employees & Equipment count for focused project.
7. Auto-Calculated % Complete - If start and end dates are set, % complete is calculated based on elapsed days / total days.
   - Still allows manual override by clicking 'Override %' toggle in the UI.

Install Instructions:
- Copy 'src' folder contents into your project client/src directory.
- Ensure SelectionProvider wraps your app in main.tsx or App.tsx.
- Add new routes for ProjectProfile, EmployeesPage, EquipmentPage.
- Update imports in dashboard to use the new focused lists.

See included component and state files for details.
