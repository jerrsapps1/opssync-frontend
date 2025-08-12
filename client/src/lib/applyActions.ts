type Action =
  | { type: "move_employee"; employee_query: string; project: string }
  | { type: "assign_equipment"; equipment_query: string; project: string }
  | { type: "list_unassigned"; date?: string };

export function applyActions({
  actions,
  findEmployeeByQuery,
  findEquipmentByQuery,
  moveEmployee,
  assignEquipment,
  showUnassigned,
}: {
  actions: Action[];
  findEmployeeByQuery: (q: string) => { id: string } | undefined;
  findEquipmentByQuery: (q: string) => { id: string } | undefined;
  moveEmployee: (employeeId: string, projectName: string) => Promise<void> | void;
  assignEquipment: (equipmentId: string, projectName: string) => Promise<void> | void;
  showUnassigned: (date?: string) => void;
}) {
  for (const a of actions) {
    if (a.type === "move_employee") {
      const e = findEmployeeByQuery(a.employee_query);
      if (e) moveEmployee(e.id, a.project);
    } else if (a.type === "assign_equipment") {
      const eq = findEquipmentByQuery(a.equipment_query);
      if (eq) assignEquipment(eq.id, a.project);
    } else if (a.type === "list_unassigned") {
      showUnassigned(a.date);
    }
  }
}