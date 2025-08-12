import express from "express";
import { EventEmitter } from "events";

export const bus = new EventEmitter();
const router = express.Router();

// In-memory event log with a cap (simple ring buffer behaviour)
type Evt = { id: number; type: string; payload: any };
const LOG: Evt[] = [];
let NEXT_ID = 1;
const CAP = Number(process.env.EVENT_LOG_CAP || 1000);

export function broadcast(evt: any) {
  const full: Evt = { id: NEXT_ID++, type: evt?.type || "message", payload: evt };
  LOG.push(full);
  if (LOG.length > CAP) LOG.splice(0, LOG.length - CAP);
  bus.emit("broadcast", full);
}

function replaySince(sinceId: number) {
  return LOG.filter(e => e.id > sinceId);
}

router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Optional initial replay
  const since = Number(req.query.since || req.header("Last-Event-ID") || 0);
  if (since) {
    const missed = replaySince(since);
    for (const e of missed) {
      res.write(`id: ${e.id}\n` + `event: ${e.type}\n` + `data: ${JSON.stringify(e.payload)}\n\n`);
    }
  } else {
    res.write(`event: hello\n` + `data: {"ok":true}\n\n`);
  }

  const keepalive = setInterval(() => res.write(`:keepalive\n\n`), 25000);

  const onEvent = (msg: Evt) => {
    res.write(`id: ${msg.id}\n` + `event: ${msg.type}\n` + `data: ${JSON.stringify(msg.payload)}\n\n`);
  };

  bus.on("broadcast", onEvent);
  req.on("close", () => {
    clearInterval(keepalive);
    bus.off("broadcast", onEvent);
  });
});

// Optional JSON endpoint for diagnostics / manual catch-up
router.get("/events", (req, res) => {
  const since = Number(req.query.since || 0);
  const out = since ? replaySince(since) : LOG;
  res.json(out);
});

export default router;
