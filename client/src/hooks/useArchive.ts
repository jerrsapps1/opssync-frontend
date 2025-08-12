import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useArchive(entity: "employees"|"equipment"|"projects") {
  const qc = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const archive = useMutation({
    mutationFn: async (id: string) => {
      setPendingId(id);
      const r = await apiRequest("POST", `/api/${entity}/${id}/archive`, {});
      return r.json();
    },
    onSettled: () => {
      setPendingId(null);
      qc.invalidateQueries();
    }
  });

  const restore = useMutation({
    mutationFn: async (id: string) => {
      setPendingId(id);
      const r = await apiRequest("POST", `/api/${entity}/${id}/restore`, {});
      return r.json();
    },
    onSettled: () => {
      setPendingId(null);
      qc.invalidateQueries();
    }
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      setPendingId(id);
      const r = await apiRequest("DELETE", `/api/${entity}/${id}`, {});
      return r.json();
    },
    onSettled: () => {
      setPendingId(null);
      qc.invalidateQueries();
    }
  });

  return { archive, restore, remove, pendingId };
}
