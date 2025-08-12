import { QueryClient } from "@tanstack/react-query";
import { toast } from "@/ui/toast";

type Msg = {
  type: string;
  entity?: "employee" | "equipment" | "project";
  id?: string;
  currentProjectId?: string | null;
  [k: string]: any;
};

export function connectSSE(qc: QueryClient) {
  let lastId = 0;
  let es: EventSource | null = null;
  let retry = 1000;

  const open = () => {
    const url = lastId ? `/api/stream?since=${lastId}` : "/api/stream";
    es = new EventSource(url, { withCredentials: true });

    function setList(key: any[], fn: (prev: any[] | undefined) => any[] | undefined) {
      qc.setQueryData<any[]>(key, (prev) => fn(prev));
    }

    const assignHandler = (msg: Msg) => {
      if (!msg.entity || !msg.id) return;
      if (msg.entity === "employee") {
        setList(["employees"], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, currentProjectId: msg.currentProjectId } : e));
        setList(["dir-employees"], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, currentProjectId: msg.currentProjectId } : e));
        toast(`Employee reassigned`, `Now on project ${msg.currentProjectId || "Unassigned"}`);
      } else if (msg.entity === "equipment") {
        setList(["equipment"], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, currentProjectId: msg.currentProjectId } : e));
        setList(["dir-equipment"], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, currentProjectId: msg.currentProjectId } : e));
        toast(`Equipment reassigned`, `Now on project ${msg.currentProjectId || "Unassigned"}`);
      }
    };

    const statusHandler = (msg: Msg, status: "archived"|"active"|"removed") => {
      if (!msg.entity || !msg.id) return;
      const key = msg.entity === "employee" ? "employees" : msg.entity;
      setList([key], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, status } : e));
      const dirKey = key === "employees" ? "dir-employees" : key === "equipment" ? "dir-equipment" : "dir-projects";
      setList([dirKey], (prev) => prev?.map((e) => e.id === msg.id ? { ...e, status } : e));
      toast(`Status changed`, `${msg.entity} is now ${status}`);
    };

    es.addEventListener("assignment.updated", (ev: MessageEvent) => {
      lastId = Number((ev as any).lastEventId || lastId);
      assignHandler(JSON.parse(ev.data));
    });
    es.addEventListener("entity.archived", (ev: MessageEvent) => {
      lastId = Number((ev as any).lastEventId || lastId);
      statusHandler(JSON.parse(ev.data), "archived");
    });
    es.addEventListener("entity.restored", (ev: MessageEvent) => {
      lastId = Number((ev as any).lastEventId || lastId);
      statusHandler(JSON.parse(ev.data), "active");
    });
    es.addEventListener("entity.removed", (ev: MessageEvent) => {
      lastId = Number((ev as any).lastEventId || lastId);
      statusHandler(JSON.parse(ev.data), "removed");
    });

    es.onopen = () => { retry = 1000; };
    es.onerror = () => {
      es?.close();
      setTimeout(open, retry);
      retry = Math.min(retry * 2, 15000);
    };
  };

  open();
  return { close: () => es?.close() };
}
