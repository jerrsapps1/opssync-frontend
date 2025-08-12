import express from "express";
import { EventEmitter } from "events";

export const bus = new EventEmitter();
const router = express.Router();

// Helpful helper to broadcast consistently
export function broadcast(evt: any) {
  try {
    bus.emit("broadcast", evt);
  } catch (e) {
    // swallow
  }
}

router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Initial hello so browsers mark the connection as open
  res.write(`event: hello\n` + `data: {"ok":true}\n\n`);

  // Keepalive for proxies
  const keepalive = setInterval(() => {
    res.write(`:keepalive\n\n`);
  }, 25000);

  const onEvent = (msg: any) => {
    const type = msg?.type || "message";
    res.write(`event: ${type}\n` + `data: ${JSON.stringify(msg)}\n\n`);
  };

  bus.on("broadcast", onEvent);

  req.on("close", () => {
    clearInterval(keepalive);
    bus.off("broadcast", onEvent);
  });
});

export default router;
