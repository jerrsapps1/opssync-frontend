import express from "express";
import { EventEmitter } from "events";

export const bus = new EventEmitter();
const router = express.Router();

router.get("/stream", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const keepalive = setInterval(() => res.write(`:keepalive\n\n`), 25000);
  const onEvent = (msg: any) => {
    res.write(`event: ${msg.type}\n`);
    res.write(`data: ${JSON.stringify(msg)}\n\n`);
  };

  bus.on("broadcast", onEvent);
  req.on("close", () => {
    clearInterval(keepalive);
    bus.off("broadcast", onEvent);
  });
});

export default router;
