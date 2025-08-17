import type { Express } from "express";
import { 
  insertNotificationSchema,
  updateNotificationSchema,
  insertNotificationRecipientSchema,
  updateNotificationRecipientSchema,
  insertSystemSettingSchema,
  updateSystemSettingSchema,
} from "@shared/schema";
import { storage } from "../storage";
import { notificationService } from "../services/notificationService";

export function registerNotificationRoutes(app: Express) {
  // System Settings routes
  app.get("/api/system-settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ error: "Failed to fetch system settings" });
    }
  });

  app.get("/api/system-settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSystemSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: "System setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching system setting:", error);
      res.status(500).json({ error: "Failed to fetch system setting" });
    }
  });

  app.post("/api/system-settings", async (req, res) => {
    try {
      const validatedData = insertSystemSettingSchema.parse(req.body);
      
      // Check if setting already exists, if so update it
      const existingSetting = await storage.getSystemSetting(validatedData.key);
      if (existingSetting) {
        const updatedSetting = await storage.updateSystemSetting(validatedData.key, {
          value: validatedData.value,
          description: validatedData.description,
          updatedBy: validatedData.updatedBy,
        });
        return res.json(updatedSetting);
      }
      
      const setting = await storage.createSystemSetting(validatedData);
      res.json(setting);
    } catch (error) {
      console.error("Error creating system setting:", error);
      res.status(500).json({ error: "Failed to create system setting" });
    }
  });

  app.patch("/api/system-settings/:key", async (req, res) => {
    try {
      const validatedData = updateSystemSettingSchema.parse(req.body);
      const setting = await storage.updateSystemSetting(req.params.key, validatedData);
      res.json(setting);
    } catch (error) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ error: "Failed to update system setting" });
    }
  });

  app.delete("/api/system-settings/:key", async (req, res) => {
    try {
      await storage.deleteSystemSetting(req.params.key);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting system setting:", error);
      res.status(500).json({ error: "Failed to delete system setting" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const { userId } = req.query;
      const notifications = await storage.getNotifications(userId as string);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/:id", async (req, res) => {
    try {
      const notification = await storage.getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error fetching notification:", error);
      res.status(500).json({ error: "Failed to fetch notification" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      
      // Send email notifications for work order approval requests
      if (validatedData.type === "work_order_approval") {
        try {
          const recipients = await storage.getNotificationRecipients();
          const activeEmails = recipients
            .filter(r => r.isActive && r.email)
            .map(r => r.email)
            .filter(Boolean) as string[];
            
          if (activeEmails.length > 0) {
            const approvalThreshold = await storage.getSystemSetting("approval_threshold");
            const threshold = approvalThreshold ? parseFloat(JSON.parse(approvalThreshold.value)) : 1000;
            
            // Extract cost from the notification message
            const costMatch = validatedData.message.match(/Total cost: \$([0-9,]+\.?[0-9]*)/);
            const totalCost = costMatch ? parseFloat(costMatch[1].replace(/,/g, '')) : 0;
            
            await notificationService.sendWorkOrderApprovalNotification(
              {
                id: validatedData.relatedId || notification.id,
                title: validatedData.title,
                equipmentName: "Equipment", // TODO: Extract from message or pass separately
                totalCost,
                approvalThreshold: threshold,
                createdBy: "Current User", // TODO: Get from auth
              },
              activeEmails
            );
          }
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
          // Don't fail the notification creation if email fails
        }
      }
      
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id", async (req, res) => {
    try {
      const validatedData = updateNotificationSchema.parse(req.body);
      const notification = await storage.updateNotification(req.params.id, validatedData);
      res.json(notification);
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.updateNotification(req.params.id, { isRead: true });
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Notification Recipients routes
  app.get("/api/notification-recipients", async (req, res) => {
    try {
      const recipients = await storage.getNotificationRecipients();
      res.json(recipients);
    } catch (error) {
      console.error("Error fetching notification recipients:", error);
      res.status(500).json({ error: "Failed to fetch notification recipients" });
    }
  });

  app.get("/api/notification-recipients/:id", async (req, res) => {
    try {
      const recipient = await storage.getNotificationRecipient(req.params.id);
      if (!recipient) {
        return res.status(404).json({ error: "Notification recipient not found" });
      }
      res.json(recipient);
    } catch (error) {
      console.error("Error fetching notification recipient:", error);
      res.status(500).json({ error: "Failed to fetch notification recipient" });
    }
  });

  app.post("/api/notification-recipients", async (req, res) => {
    try {
      const validatedData = insertNotificationRecipientSchema.parse(req.body);
      const recipient = await storage.createNotificationRecipient(validatedData);
      res.json(recipient);
    } catch (error) {
      console.error("Error creating notification recipient:", error);
      res.status(500).json({ error: "Failed to create notification recipient" });
    }
  });

  app.patch("/api/notification-recipients/:id", async (req, res) => {
    try {
      const validatedData = updateNotificationRecipientSchema.parse(req.body);
      const recipient = await storage.updateNotificationRecipient(req.params.id, validatedData);
      res.json(recipient);
    } catch (error) {
      console.error("Error updating notification recipient:", error);
      res.status(500).json({ error: "Failed to update notification recipient" });
    }
  });

  app.delete("/api/notification-recipients/:id", async (req, res) => {
    try {
      await storage.deleteNotificationRecipient(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification recipient:", error);
      res.status(500).json({ error: "Failed to delete notification recipient" });
    }
  });
}