import { Router } from "express";

const router = Router();

// Simple test endpoint
router.get("/test", (req, res) => {
  console.log("Message test endpoint hit!");
  res.json({ status: "working", timestamp: new Date().toISOString() });
});

// Get all message threads - Direct database query
router.get("/threads", async (req, res) => {
  try {
    console.log("Getting message threads...");
    const result = await db.execute(sql`SELECT * FROM message_threads ORDER BY updated_at DESC`);
    console.log("Message threads result:", result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("Get message threads error:", error);
    res.status(500).json({ error: "Failed to fetch message threads" });
  }
});

// Create a new message thread - Direct database query
router.post("/threads", async (req, res) => {
  try {
    console.log("Creating message thread with data:", req.body);
    const { topic, createdBy } = req.body;
    
    const result = await db.execute(sql`
      INSERT INTO message_threads (topic, created_by, created_at, updated_at) 
      VALUES (${topic}, ${createdBy}, NOW(), NOW()) 
      RETURNING *
    `);
    
    console.log("Created thread:", result.rows[0]);
    res.status(201).json(result.rows[0]);
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