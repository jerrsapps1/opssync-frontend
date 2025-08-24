import type { Express } from "express";
import { 
  insertWorkOrderSchema,
  updateWorkOrderSchema,
  insertWorkOrderDocumentSchema,
  insertWorkOrderCommentSchema,
  insertWorkOrderApprovalSchema,
  updateWorkOrderApprovalSchema,
  insertCostApprovalThresholdSchema,
  updateCostApprovalThresholdSchema,
} from "@shared/schema";
import { storage } from "../storage";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";
import PDFDocument from "pdfkit";

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
      
      // Get the current work order to track changes
      const currentWorkOrder = await storage.getWorkOrder(req.params.id);
      if (!currentWorkOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }
      
      // Update the work order
      const updatedWorkOrder = await storage.updateWorkOrder(req.params.id, validatedData);
      
      // Log status change if it occurred
      if (validatedData.status && validatedData.status !== currentWorkOrder.status) {
        const statusDescriptions: Record<string, string> = {
          "open": "Work order opened",
          "in-progress": "Work order started",
          "completed": "Work order completed",
          "cancelled": "Work order cancelled",
          "pending-approval": "Work order submitted for approval",
          "approved": "Work order approved",
          "rejected": "Work order rejected"
        };

        await storage.createWorkOrderActivity({
          workOrderId: req.params.id,
          action: "updated",
          description: `Status changed from "${currentWorkOrder.status}" to "${validatedData.status}". ${statusDescriptions[validatedData.status] || 'Status updated'}`,
          performedBy: "test-user-001", // TODO: Get from auth
          metadata: JSON.stringify({
            field: "status",
            oldValue: currentWorkOrder.status,
            newValue: validatedData.status
          })
        });
        
        console.log(`📝 Logged status change: Work Order ${req.params.id} status changed from "${currentWorkOrder.status}" to "${validatedData.status}"`);
      }
      
      res.json(updatedWorkOrder);
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

  // Work Order Comments
  app.get("/api/work-orders/:workOrderId/comments", async (req, res) => {
    try {
      const comments = await storage.getWorkOrderComments(req.params.workOrderId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching work order comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/work-orders/:workOrderId/comments", async (req, res) => {
    console.log("🚀 Comment route hit! WorkOrderId:", req.params.workOrderId);
    console.log("🚀 Request body:", req.body);
    
    // Simple approach without schema validation for now
    try {
      const commentData = {
        workOrderId: req.params.workOrderId,
        comment: req.body.comment,
        createdBy: "test-user-001",
        createdAt: new Date()
      };
      
      console.log("🚀 Creating comment with data:", commentData);
      
      const newComment = await storage.createWorkOrderComment(commentData);
      console.log("🚀 Successfully created comment:", newComment);
      
      res.json(newComment);
    } catch (error: any) {
      console.error("❌ Error creating work order comment:", error);
      console.error("❌ Error stack:", error?.stack);
      res.status(500).json({ error: "Failed to create comment", details: error?.message });
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

  // Invoice Generation
  app.post("/api/work-orders/generate-invoice", async (req, res) => {
    try {
      const invoiceData = req.body;
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      let buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.workOrderTitle.replace(/\s+/g, '-')}-${invoiceData.dateCreated}.pdf"`);
        res.send(pdfData);
      });

      // Header
      doc.fontSize(20).font('Helvetica-Bold')
         .text('REPAIR INVOICE', 50, 50);
      
      doc.fontSize(12).font('Helvetica')
         .text(`Invoice Date: ${invoiceData.dateCreated}`, 50, 80)
         .text(`Work Order: ${invoiceData.workOrderTitle}`, 50, 100)
         .text(`Equipment: ${invoiceData.equipmentName}`, 50, 120);

      if (invoiceData.workOrderId) {
        doc.text(`Work Order ID: ${invoiceData.workOrderId}`, 50, 140);
      }

      // Line separator
      doc.moveTo(50, 170).lineTo(550, 170).stroke();

      // Cost breakdown
      let y = 200;
      doc.fontSize(14).font('Helvetica-Bold')
         .text('Cost Breakdown:', 50, y);
      
      y += 30;
      doc.fontSize(12).font('Helvetica');
      
      if (invoiceData.laborCost > 0) {
        doc.text(`Labor Cost:`, 50, y)
           .text(`$${invoiceData.laborCost.toFixed(2)}`, 450, y);
        y += 20;
      }
      
      if (invoiceData.partsCost > 0) {
        doc.text(`Parts Cost:`, 50, y)
           .text(`$${invoiceData.partsCost.toFixed(2)}`, 450, y);
        y += 20;
      }
      
      if (invoiceData.externalServiceCost > 0) {
        doc.text(`External Service Cost:`, 50, y)
           .text(`$${invoiceData.externalServiceCost.toFixed(2)}`, 450, y);
        y += 20;
      }

      // Total
      y += 20;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 20;
      
      doc.fontSize(16).font('Helvetica-Bold')
         .text('Total Amount:', 50, y)
         .text(`$${invoiceData.totalCost.toFixed(2)}`, 450, y);

      // Additional information
      if (invoiceData.assignedTo) {
        y += 40;
        doc.fontSize(12).font('Helvetica')
           .text(`Technician: ${invoiceData.assignedTo}`, 50, y);
      }

      if (invoiceData.notes) {
        y += 40;
        doc.fontSize(12).font('Helvetica-Bold')
           .text('Notes:', 50, y);
        y += 20;
        doc.fontSize(10).font('Helvetica')
           .text(invoiceData.notes, 50, y, { width: 500 });
      }

      doc.end();
    } catch (error) {
      console.error("Error generating invoice:", error);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  // Invoice Upload URL
  app.post("/api/work-orders/invoice-upload-url", async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getWorkOrderDocumentUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting invoice upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
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