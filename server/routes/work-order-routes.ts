import type { Express } from "express";
import { 
  insertWorkOrderSchema,
  updateWorkOrderSchema,
  insertWorkOrderDocumentSchema,
  insertWorkOrderApprovalSchema,
  updateWorkOrderApprovalSchema,
  insertCostApprovalThresholdSchema,
  updateCostApprovalThresholdSchema,
} from "@shared/schema";
import { storage } from "../storage";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";

export function registerWorkOrderRoutes(app: Express) {
  const objectStorageService = new ObjectStorageService();

  // Work Orders
  app.get("/api/work-orders", async (req, res) => {
    try {
      const { equipmentId } = req.query;
      const workOrders = await storage.getWorkOrders(equipmentId as string);
      res.json(workOrders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      res.status(500).json({ error: "Failed to fetch work orders" });
    }
  });

  app.get("/api/work-orders/:id", async (req, res) => {
    try {
      const workOrder = await storage.getWorkOrder(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      console.error("Error fetching work order:", error);
      res.status(500).json({ error: "Failed to fetch work order" });
    }
  });

  app.post("/api/work-orders", async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse(req.body);
      
      // Check if approval is required based on cost thresholds
      const totalCost = (validatedData.estimatedCost || 0) + 
                       (validatedData.laborCost || 0) + 
                       (validatedData.partsCost || 0) + 
                       (validatedData.externalServiceCost || 0);
      
      const approvalRequired = totalCost > 100000; // $1000 in cents
      
      const workOrderData = {
        ...validatedData,
        approvalRequired,
        status: approvalRequired ? "pending-approval" : "open",
        createdBy: "test-user-001", // TODO: Get from auth
      };

      const workOrder = await storage.createWorkOrder(workOrderData);
      
      // If approval required, create approval requests
      if (approvalRequired) {
        const thresholds = await storage.getCostApprovalThresholds();
        for (const threshold of thresholds) {
          if (totalCost > threshold.maxAmount) {
            await storage.createWorkOrderApproval({
              workOrderId: workOrder.id,
              approverRole: threshold.role,
              thresholdAmount: threshold.maxAmount,
              requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            });
          }
        }
      }
      
      res.json(workOrder);
    } catch (error) {
      console.error("Error creating work order:", error);
      res.status(500).json({ error: "Failed to create work order" });
    }
  });

  app.patch("/api/work-orders/:id", async (req, res) => {
    try {
      const validatedData = updateWorkOrderSchema.parse(req.body);
      const workOrder = await storage.updateWorkOrder(req.params.id, validatedData);
      res.json(workOrder);
    } catch (error) {
      console.error("Error updating work order:", error);
      res.status(500).json({ error: "Failed to update work order" });
    }
  });

  app.delete("/api/work-orders/:id", async (req, res) => {
    try {
      await storage.deleteWorkOrder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting work order:", error);
      res.status(500).json({ error: "Failed to delete work order" });
    }
  });

  // Work Order Documents
  app.get("/api/work-orders/:workOrderId/documents", async (req, res) => {
    try {
      const documents = await storage.getWorkOrderDocuments(req.params.workOrderId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching work order documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/work-order-documents/upload", async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getWorkOrderDocumentUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/work-order-documents", async (req, res) => {
    try {
      const validatedData = insertWorkOrderDocumentSchema.parse(req.body);
      const normalizedPath = objectStorageService.normalizeWorkOrderDocumentPath(validatedData.objectPath);
      
      const documentData = {
        ...validatedData,
        objectPath: normalizedPath,
        uploadedBy: "test-user-001", // TODO: Get from auth
      };

      const document = await storage.createWorkOrderDocument(documentData);
      res.json(document);
    } catch (error) {
      console.error("Error creating work order document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.get("/work-order-documents/:documentPath(*)", async (req, res) => {
    try {
      const documentPath = `/${req.params.documentPath}`;
      const documentFile = await objectStorageService.getWorkOrderDocumentFile(documentPath);
      objectStorageService.downloadObject(documentFile, res);
    } catch (error) {
      console.error("Error downloading document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  app.delete("/api/work-order-documents/:id", async (req, res) => {
    try {
      await storage.deleteWorkOrderDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting work order document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Work Order Approvals
  app.get("/api/work-orders/:workOrderId/approvals", async (req, res) => {
    try {
      const approvals = await storage.getWorkOrderApprovals(req.params.workOrderId);
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching work order approvals:", error);
      res.status(500).json({ error: "Failed to fetch approvals" });
    }
  });

  app.post("/api/work-order-approvals", async (req, res) => {
    try {
      const validatedData = insertWorkOrderApprovalSchema.parse(req.body);
      const approval = await storage.createWorkOrderApproval(validatedData);
      res.json(approval);
    } catch (error) {
      console.error("Error creating work order approval:", error);
      res.status(500).json({ error: "Failed to create approval" });
    }
  });

  app.patch("/api/work-order-approvals/:id", async (req, res) => {
    try {
      const validatedData = updateWorkOrderApprovalSchema.parse(req.body);
      const approval = await storage.updateWorkOrderApproval(req.params.id, {
        ...validatedData,
        approverUserId: "test-user-001", // TODO: Get from auth
      });

      // Update work order status if all approvals are complete
      if (validatedData.status === "approved" || validatedData.status === "rejected") {
        const workOrder = await storage.getWorkOrder(approval.workOrderId);
        if (workOrder) {
          const allApprovals = await storage.getWorkOrderApprovals(approval.workOrderId);
          const approvedCount = allApprovals.filter(a => a.status === "approved").length;
          const rejectedCount = allApprovals.filter(a => a.status === "rejected").length;
          
          let newStatus = workOrder.status;
          if (rejectedCount > 0) {
            newStatus = "rejected";
          } else if (approvedCount === allApprovals.length) {
            newStatus = "approved";
          }
          
          if (newStatus !== workOrder.status) {
            await storage.updateWorkOrder(approval.workOrderId, { status: newStatus });
          }
        }
      }
      
      res.json(approval);
    } catch (error) {
      console.error("Error updating work order approval:", error);
      res.status(500).json({ error: "Failed to update approval" });
    }
  });

  // Work Order Activities
  app.get("/api/work-orders/:workOrderId/activities", async (req, res) => {
    try {
      const activities = await storage.getWorkOrderActivities(req.params.workOrderId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching work order activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Cost Approval Thresholds
  app.get("/api/cost-approval-thresholds", async (req, res) => {
    try {
      const thresholds = await storage.getCostApprovalThresholds();
      res.json(thresholds);
    } catch (error) {
      console.error("Error fetching cost approval thresholds:", error);
      res.status(500).json({ error: "Failed to fetch thresholds" });
    }
  });

  app.post("/api/cost-approval-thresholds", async (req, res) => {
    try {
      const validatedData = insertCostApprovalThresholdSchema.parse(req.body);
      const threshold = await storage.createCostApprovalThreshold(validatedData);
      res.json(threshold);
    } catch (error) {
      console.error("Error creating cost approval threshold:", error);
      res.status(500).json({ error: "Failed to create threshold" });
    }
  });

  app.patch("/api/cost-approval-thresholds/:id", async (req, res) => {
    try {
      const validatedData = updateCostApprovalThresholdSchema.parse(req.body);
      const threshold = await storage.updateCostApprovalThreshold(req.params.id, validatedData);
      res.json(threshold);
    } catch (error) {
      console.error("Error updating cost approval threshold:", error);
      res.status(500).json({ error: "Failed to update threshold" });
    }
  });

  app.delete("/api/cost-approval-thresholds/:id", async (req, res) => {
    try {
      await storage.deleteCostApprovalThreshold(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting cost approval threshold:", error);
      res.status(500).json({ error: "Failed to delete threshold" });
    }
  });
}