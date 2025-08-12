import fs from "fs";
import path from "path";

const DATA = path.join(process.cwd(), "data");
const FILE = path.join(DATA, "history.json");

type HistoryItem = {
  id: string;
  entity: "employee" | "equipment" | "project";
  entityId: string;
  action: "create" | "update" | "archive" | "restore" | "delete";
  at: string;
  payload?: any;
};

export function appendHistory(item: HistoryItem) {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  let list: HistoryItem[] = [];
  if (fs.existsSync(FILE)) {
    try { list = JSON.parse(fs.readFileSync(FILE, "utf-8")); } catch {}
  }
  list.push(item);
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf-8");
}
