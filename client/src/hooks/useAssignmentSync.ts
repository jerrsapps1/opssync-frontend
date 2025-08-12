import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type Kind = "employees" | "equipment";

export function useAssignmentSync(kind: Kind) {
  const qc = useQueryClient();

  const patchAssignment = useMutation({
    mutationFn: async ({ id, currentProjectId }: { id: string; currentProjectId: string | null }) => {
      const r = await apiRequest("PATCH", `/api/${kind}/${id}/assignment`, { currentProjectId });
      return r.json();
    },
    onSuccess: (updated, vars) => {
      // Update primary lists immediately
      if (kind === "employees") {
        qc.setQueryData<any[]>(["employees"], (prev) => {
          if (!prev) return prev;
          return prev.map((e) => (e.id === vars.id ? { ...e, currentProjectId: vars.currentProjectId } : e));
        });
        qc.setQueryData<any[]>(["dir-employees"], (prev) => {
          if (!prev) return prev;
          return prev.map((e) => (e.id === vars.id ? { ...e, currentProjectId: vars.currentProjectId } : e));
        });
      } else {
        qc.setQueryData<any[]>(["equipment"], (prev) => {
          if (!prev) return prev;
          return prev.map((e) => (e.id === vars.id ? { ...e, currentProjectId: vars.currentProjectId } : e));
        });
        qc.setQueryData<any[]>(["dir-equipment"], (prev) => {
          if (!prev) return prev;
          return prev.map((e) => (e.id === vars.id ? { ...e, currentProjectId: vars.currentProjectId } : e));
        });
      }
      // Also invalidate in case other queries depend on it
      qc.invalidateQueries({ queryKey: [kind] });
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
  });

  return {
    setAssignment: (id: string, currentProjectId: string | null) => patchAssignment.mutate({ id, currentProjectId }),
    isUpdating: patchAssignment.isPending,
  };
}
