import { QueryClient } from "@tanstack/react-query";

type Msg = {
  type: string;
  entity?: "employee" | "equipment" | "project";
  id?: string;
  currentProjectId?: string | null;
  [k: string]: any;
};

export function connectSSE(qc: QueryClient) {
  const es = new EventSource("/api/stream", { withCredentials: true });

  function setList(key: any[], fn: (prev: any[] | undefined) => any[] | undefined) {
    qc.setQueryData<any[]>(key, (prev) => fn(prev));
  }

  const assignHandler = (msg: Msg) => {
    if (!msg.entity || !msg.id) return;
    if (msg.entity === "employee") {
      setList(["employees"], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, currentProjectId: msg.currentProjectId } : e));
      setList(["dir-employees"], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, currentProjectId: msg.currentProjectId } : e));
    } else if (msg.entity === "equipment") {
      setList(["equipment"], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, currentProjectId: msg.currentProjectId } : e));
      setList(["dir-equipment"], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, currentProjectId: msg.currentProjectId } : e));
    }
  };

  const statusHandler = (msg: Msg, status: "archived"|"active"|"removed") => {
    if (!msg.entity || !msg.id) return;
    const key = msg.entity === "employee" ? "employees" : msg.entity;
    setList([key], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, status } : e));
    // Directory tables if present
    const dirKey = key === "employees" ? "dir-employees" : key === "equipment" ? "dir-equipment" : "dir-projects";
    setList([dirKey], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, status } : e));
  };

  es.addEventListener("assignment.updated", (ev: MessageEvent) => assignHandler(JSON.parse(ev.data)));
  es.addEventListener("entity.archived", (ev: MessageEvent) => statusHandler(JSON.parse(ev.data), "archived"));
  es.addEventListener("entity.restored", (ev: MessageEvent) => statusHandler(JSON.parse(ev.data), "active"));
  es.addEventListener("entity.removed", (ev: MessageEvent) => statusHandler(JSON.parse(ev.data), "removed"));

  es.onerror = () => {
    // Browser will auto-reconnect. You could close and recreate with backoff here.
  };

  return es;
}
