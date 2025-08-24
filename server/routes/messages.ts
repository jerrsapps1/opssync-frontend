import { Router } from "express";
import { storage } from "../storage";
import { insertMessageThreadSchema, insertMessageSchema } from "@shared/schema";

const router = Router();

// Get all message threads
router.get("/threads", async (req, res) => {
  try {
    const threads = await storage.getMessageThreads();
    res.json(threads);
  } catch (error) {
    console.error("Get message threads error:", error);
    res.status(500).json({ error: "Failed to fetch message threads" });
  }
});

// Create a new message thread
router.post("/threads", async (req, res) => {
  try {
    const validatedData = insertMessageThreadSchema.parse(req.body);
    const thread = await storage.createMessageThread(validatedData);
    res.status(201).json(thread);
  } catch (error) {
    console.error("Create message thread error:", error);
    res.status(500).json({ error: "Failed to create message thread" });
  }
});

// Get messages for a specific thread
router.get("/threads/:threadId/messages", async (req, res) => {
  try {
    const { threadId } = req.params;
    const messages = await storage.getMessagesByThread(threadId);
    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Create a new message in a thread
router.post("/threads/:threadId/messages", async (req, res) => {
  try {
    const { threadId } = req.params;
    const messageData = {
      ...req.body,
      threadId
    };
    const validatedData = insertMessageSchema.parse(messageData);
    const message = await storage.createMessage(validatedData);
    
    // Update thread timestamp
    await storage.updateMessageThreadTimestamp(threadId);
    
    res.status(201).json(message);
  } catch (error) {
    console.error("Create message error:", error);
    res.status(500).json({ error: "Failed to create message" });
  }
});

// Search messages by content or date
router.get("/search", async (req, res) => {
  try {
    const { query, date } = req.query;
    const results = await storage.searchMessages(query as string, date as string);
    res.json(results);
  } catch (error) {
    console.error("Search messages error:", error);
    res.status(500).json({ error: "Failed to search messages" });
  }
});

export default router;