import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Upload, DollarSign, AlertCircle, CheckCircle, Clock, Download, Receipt, Printer, AlertTriangle } from "lucide-react";
import { ObjectUploader } from "./ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UploadResult } from "@uppy/core";
import type { WorkOrder } from "@shared/schema";

const workOrderSchema = z.object({
  equipmentId: z.string().min(1, "Equipment selection is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  reason: z.string().min(1, "Reason is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assignedTo: z.string().optional(),
  laborCost: z.number().min(0).optional(),
  partsCost: z.number().min(0).optional(),
  externalServiceCost: z.number().min(0).optional(),
  taxExempt: z.boolean().optional(),
  jobNumber: z.string().optional(),
  poNumber: z.string().optional(),
  vendorInvoiceNumber: z.string().optional(),
  costCenter: z.string().optional(),
  warrantyInfo: z.string().optional(),
  notes: z.string().optional(),
  technicianNotes: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

interface EnhancedWorkOrderWizardProps {
  equipmentId: string;
  equipmentName: string;
  onClose: () => void;
  onSuccess?: () => void;
  editingWorkOrder?: WorkOrder | null;
}

interface DocumentUpload {
  id: string;
  filename: string;
  documentType: string;
  description?: string;
  uploadUrl?: string;
}

interface InvoiceData {
  workOrderId?: string;
  workOrderTitle: string;
  equipmentName: string;
  dateCreated: string;
  laborCost: number;
  partsCost: number;
  externalServiceCost: number;
  totalCost: number;
  taxAmount: number;
  finalCost: number;
  taxExempt: boolean;
  assignedTo?: string;
  notes?: string;
}

export function EnhancedWorkOrderWizard({ 
  equipmentId, 
  equipmentName, 
  onClose, 
  onSuccess,
  editingWorkOrder 
}: EnhancedWorkOrderWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [finalCost, setFinalCost] = useState(0);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: editingWorkOrder ? {
      equipmentId,
      title: editingWorkOrder.title,
      description: editingWorkOrder.description,
      reason: editingWorkOrder.reason,
      priority: editingWorkOrder.priority as "low" | "medium" | "high" | "urgent",
      assignedTo: editingWorkOrder.assignedTo || "",

      laborCost: editingWorkOrder.laborCost ? Number((editingWorkOrder.laborCost / 100).toFixed(2)) : undefined,
      partsCost: editingWorkOrder.partsCost ? Number((editingWorkOrder.partsCost / 100).toFixed(2)) : undefined,
      externalServiceCost: editingWorkOrder.externalServiceCost ? Number((editingWorkOrder.externalServiceCost / 100).toFixed(2)) : undefined,
      taxExempt: editingWorkOrder.taxExempt ?? false,
      jobNumber: editingWorkOrder.jobNumber || "",
      poNumber: editingWorkOrder.poNumber || "",
      vendorInvoiceNumber: editingWorkOrder.vendorInvoiceNumber || "",
      costCenter: editingWorkOrder.costCenter || "",
      warrantyInfo: editingWorkOrder.warrantyInfo || "",
      notes: editingWorkOrder.notes || "",
      technicianNotes: editingWorkOrder.technicianNotes || "",
    } : {
      equipmentId,
      priority: "medium",

      laborCost: undefined,
      partsCost: undefined,
      externalServiceCost: undefined,
      taxExempt: false,
    },
  });

  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: WorkOrderFormData & { documents: DocumentUpload[] }) => {
      const workOrderData = {
        ...data,
        // Convert dollar amounts to cents for storage

        laborCost: data.laborCost ? Math.round(data.laborCost * 100) : undefined,
        partsCost: data.partsCost ? Math.round(data.partsCost * 100) : undefined,
        externalServiceCost: data.externalServiceCost ? Math.round(data.externalServiceCost * 100) : undefined,
        approvalRequired,
      };

      let workOrderResult;
      if (editingWorkOrder) {
        // Update existing work order
        const response = await apiRequest("PATCH", `/api/work-orders/${editingWorkOrder.id}`, workOrderData);
        workOrderResult = await response.json();
      } else {
        // Create new work order
        const response = await apiRequest("POST", "/api/work-orders", workOrderData);
        workOrderResult = await response.json();
      }

      // If there are documents, upload them
      if (data.documents.length > 0) {
        for (const doc of data.documents) {
          if (doc.uploadUrl) {
            await apiRequest("POST", "/api/work-order-documents", {
              workOrderId: workOrderResult.id,
              filename: doc.filename,
              originalFilename: doc.filename,
              documentType: doc.documentType,
              description: doc.description,
              objectPath: doc.uploadUrl,
            });
          }
        }
      }

      return workOrderResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api", "equipment"] });
      toast({
        title: "Success",
        description: editingWorkOrder ? "Work order updated successfully" : "Work order created successfully",
      });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: editingWorkOrder ? "Failed to update work order" : "Failed to create work order",
        variant: "destructive",
      });
      console.error(editingWorkOrder ? "Failed to update work order:" : "Failed to create work order:", error);
    },
  });

  const calculateTotalCost = (values: Partial<WorkOrderFormData>) => {
    const labor = values.laborCost || 0;
    const parts = values.partsCost || 0;
    const external = values.externalServiceCost || 0;
    const subtotal = labor + parts + external;
    
    // Texas sales tax: 8.25% on parts only (not on labor)
    const taxableAmount = parts; // Only parts are taxable in Texas
    const taxRate = 0.0825; // 8.25% Texas sales tax rate
    const tax = values.taxExempt ? 0 : (taxableAmount * taxRate);
    
    const finalTotal = subtotal + tax;
    
    setTotalCost(subtotal);
    setTaxAmount(tax);
    setFinalCost(finalTotal);
    setApprovalRequired(finalTotal > 1000); // Require approval for final costs over $1000
    
    return finalTotal;
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/work-order-documents/upload", {});
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL || '',
      };
    } catch (error) {
      console.error("Failed to get upload parameters:", error);
      throw error;
    }
  };

  const generateInvoice = async () => {
    setIsGeneratingInvoice(true);
    try {
      const formData = form.getValues();
      const invoiceData: InvoiceData = {
        workOrderId: editingWorkOrder?.id,
        workOrderTitle: formData.title || "Work Order",
        equipmentName,
        dateCreated: new Date().toISOString().split('T')[0],
        laborCost: formData.laborCost || 0,
        partsCost: formData.partsCost || 0,
        externalServiceCost: formData.externalServiceCost || 0,
        totalCost,
        taxAmount,
        finalCost,
        taxExempt: formData.taxExempt || false,
        assignedTo: formData.assignedTo,
        notes: formData.notes,
      };

      const response = await apiRequest("POST", "/api/work-orders/generate-invoice", invoiceData);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-${invoiceData.workOrderTitle.replace(/\s+/g, '-')}-${invoiceData.dateCreated}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Invoice Generated",
        description: "Invoice has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleInvoiceUpload = async () => {
    try {
      const response = await apiRequest("POST", "/api/work-orders/invoice-upload-url");
      const { uploadURL } = await response.json();
      return {
        method: 'PUT' as const,
        url: uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      throw error;
    }
  };

  const handleInvoiceUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const newDocument: DocumentUpload = {
        id: Date.now().toString(),
        filename: uploadedFile.name || "invoice.pdf",
        documentType: "Invoice",
        uploadUrl: uploadedFile.uploadURL,
      };
      
      setDocuments(prev => [...prev, newDocument]);
      
      toast({
        title: "Invoice Uploaded",
        description: "Invoice has been uploaded successfully.",
      });
    }
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      const newDocument: DocumentUpload = {
        id: Date.now().toString(),
        filename: file.name || 'unknown-file',
        documentType: "receipt", // Default, user can change
        uploadUrl: file.uploadURL ? String(file.uploadURL) : file.meta?.name as string || file.name || "uploaded-file",
      };
      setDocuments(prev => [...prev, newDocument]);
      toast({
        title: "Document uploaded",
        description: `${file.name} has been uploaded successfully`,
      });
    }
  };

  const onSubmit = (data: WorkOrderFormData) => {
    // Convert dollars to cents for database storage
    const dataWithConvertedCosts = {
      ...data,
      laborCost: data.laborCost ? Math.round(data.laborCost * 100) : undefined,
      partsCost: data.partsCost ? Math.round(data.partsCost * 100) : undefined,
      externalServiceCost: data.externalServiceCost ? Math.round(data.externalServiceCost * 100) : undefined,
    };

    createWorkOrderMutation.mutate({
      ...dataWithConvertedCosts,
      documents,
    });
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-200">Work Order Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Brief description of the repair needed"
                className="mt-1"
                data-testid="input-work-order-title"
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-red-400">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-200">Detailed Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Detailed description of the issue and what needs to be done"
                className="mt-1 min-h-[100px]"
                data-testid="textarea-description"
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-sm text-red-400">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="reason" className="text-sm font-medium text-gray-200">Reason for Repair</Label>
              <Textarea
                id="reason"
                {...form.register("reason")}
                placeholder="Why does this equipment need repair? What symptoms or issues were observed?"
                className="mt-1"
                data-testid="textarea-reason"
              />
              {form.formState.errors.reason && (
                <p className="mt-1 text-sm text-red-400">{form.formState.errors.reason.message}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-200">Priority Level</Label>
              <Select onValueChange={(value) => form.setValue("priority", value as any)} defaultValue="medium">
                <SelectTrigger className="mt-1" data-testid="select-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Routine maintenance</SelectItem>
                  <SelectItem value="medium">Medium - Standard repair</SelectItem>
                  <SelectItem value="high">High - Important equipment</SelectItem>
                  <SelectItem value="urgent">Urgent - Critical equipment down</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="laborCost" className="text-sm font-medium text-gray-200">Labor Cost</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="laborCost"
                    type="number"
                    step="0.01"
                    {...form.register("laborCost", { valueAsNumber: true, onChange: (e) => calculateTotalCost({...form.getValues(), laborCost: parseFloat(e.target.value) || 0}) })}
                    placeholder="0.00"
                    className="pl-10"
                    data-testid="input-labor-cost"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="partsCost" className="text-sm font-medium text-gray-200">Parts Cost</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="partsCost"
                    type="number"
                    step="0.01"
                    {...form.register("partsCost", { valueAsNumber: true, onChange: (e) => calculateTotalCost({...form.getValues(), partsCost: parseFloat(e.target.value) || 0}) })}
                    placeholder="0.00"
                    className="pl-10"
                    data-testid="input-parts-cost"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="externalServiceCost" className="text-sm font-medium text-gray-200">External Service Cost</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="externalServiceCost"
                    type="number"
                    step="0.01"
                    {...form.register("externalServiceCost", { valueAsNumber: true, onChange: (e) => calculateTotalCost({...form.getValues(), externalServiceCost: parseFloat(e.target.value) || 0}) })}
                    placeholder="0.00"
                    className="pl-10"
                    data-testid="input-external-cost"
                  />
                </div>
              </div>
            </div>

            {/* Tax Exempt Checkbox */}
            <div className="flex items-center space-x-2 mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <Checkbox
                id="taxExempt"
                {...form.register("taxExempt", { onChange: () => calculateTotalCost(form.getValues()) })}
                data-testid="checkbox-tax-exempt"
              />
              <Label htmlFor="taxExempt" className="text-sm font-medium text-gray-200 cursor-pointer">
                Tax Exempt (No sales tax on parts)
              </Label>
            </div>

            {/* Cost Summary */}
            <div className="mt-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-600 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Subtotal (Labor + Parts + External):</span>
                  <span className="text-gray-200">${totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Sales Tax (8.25% on parts only):</span>
                  <span className="text-gray-200">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-600 pt-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-200">Total Cost:</h3>
                    <span className="text-2xl font-bold text-blue-400">${finalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              {approvalRequired && (
                <div className="mt-2 flex items-center text-amber-400">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Management approval required for costs over $1,000</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobNumber" className="text-sm font-medium text-gray-200">Job Number</Label>
                <Input
                  id="jobNumber"
                  {...form.register("jobNumber")}
                  placeholder="Optional billing job number"
                  className="mt-1"
                  data-testid="input-job-number"
                />
              </div>

              <div>
                <Label htmlFor="poNumber" className="text-sm font-medium text-gray-200">PO Number</Label>
                <Input
                  id="poNumber"
                  {...form.register("poNumber")}
                  placeholder="Purchase order number"
                  className="mt-1"
                  data-testid="input-po-number"
                />
              </div>

              <div>
                <Label htmlFor="vendorInvoiceNumber" className="text-sm font-medium text-gray-200">Vendor Invoice #</Label>
                <Input
                  id="vendorInvoiceNumber"
                  {...form.register("vendorInvoiceNumber")}
                  placeholder="Vendor invoice number"
                  className="mt-1"
                  data-testid="input-vendor-invoice"
                />
              </div>

              <div>
                <Label htmlFor="costCenter" className="text-sm font-medium text-gray-200">Cost Center</Label>
                <Input
                  id="costCenter"
                  {...form.register("costCenter")}
                  placeholder="Accounting cost center"
                  className="mt-1"
                  data-testid="input-cost-center"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Invoice Management</h3>
              <p className="text-sm text-gray-400 mb-4">
                Generate, upload, or manage invoices for this repair work order
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  type="button"
                  onClick={generateInvoice}
                  disabled={isGeneratingInvoice || !totalCost}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-generate-invoice"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  {isGeneratingInvoice ? "Generating..." : "Generate Invoice"}
                </Button>

                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760} // 10MB
                  onGetUploadParameters={handleInvoiceUpload}
                  onComplete={handleInvoiceUploadComplete}
                  buttonClassName="w-full"
                  acceptedFileTypes={['.pdf']}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Upload Invoice</span>
                  </div>
                </ObjectUploader>
              </div>

              <Separator className="my-6" />

              <div>
                <h4 className="text-lg font-semibold text-gray-200 mb-4">Other Documents</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Upload receipts, photos, warranties, or other relevant documents
                </p>

                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={10485760} // 10MB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full mb-4"
                  acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xlsx', '.txt']}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Upload Documents</span>
                  </div>
                </ObjectUploader>
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-200">Uploaded Documents:</h4>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-200">{doc.filename}</p>
                          <p className="text-xs text-gray-400">{doc.documentType}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{doc.documentType}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo" className="text-sm font-medium text-gray-200">Assigned Technician</Label>
                <Input
                  id="assignedTo"
                  {...form.register("assignedTo")}
                  placeholder="Who will perform the work?"
                  className="mt-1"
                  data-testid="input-assigned-to"
                />
              </div>

              <div>
                <Label htmlFor="warrantyInfo" className="text-sm font-medium text-gray-200">Warranty Information</Label>
                <Input
                  id="warrantyInfo"
                  {...form.register("warrantyInfo")}
                  placeholder="Warranty details if applicable"
                  className="mt-1"
                  data-testid="input-warranty-info"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-200">Additional Notes</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Any additional information or special instructions"
                className="mt-1"
                data-testid="textarea-notes"
              />
            </div>

            <div>
              <Label htmlFor="technicianNotes" className="text-sm font-medium text-gray-200">Private Technician Notes</Label>
              <Textarea
                id="technicianNotes"
                {...form.register("technicianNotes")}
                placeholder="Internal notes for technicians (not visible to clients)"
                className="mt-1"
                data-testid="textarea-technician-notes"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-200 mb-2">Review Work Order</h3>
              <p className="text-gray-400">Please review the details before creating the work order</p>
            </div>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-blue-400">Work Order Summary</CardTitle>
                <CardDescription>For {equipmentName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Title</p>
                  <p className="text-gray-200" data-testid="text-review-title">{form.watch("title")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Priority</p>
                  <Badge variant={form.watch("priority") === "urgent" ? "destructive" : "secondary"}>
                    {form.watch("priority")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Cost</p>
                  <p className="text-xl font-bold text-blue-400" data-testid="text-review-cost">
                    ${totalCost.toFixed(2)}
                  </p>
                  {approvalRequired && (
                    <p className="text-yellow-400 text-sm mt-1">⚠ Requires management approval</p>
                  )}
                </div>
                {form.watch("jobNumber") && (
                  <div>
                    <p className="text-sm text-gray-400">Job Number</p>
                    <p className="text-gray-200">{form.watch("jobNumber")}</p>
                  </div>
                )}
                {documents.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400">Documents</p>
                    <p className="text-gray-200">{documents.length} document(s) attached</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Basic Information";
      case 2: return "Financial Details";
      case 3: return "Documents & Assignment";
      case 4: return "Review & Submit";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {editingWorkOrder ? "Edit Work Order" : "Create Work Order"}
              </h2>
              <p className="text-gray-400 mt-1">Equipment: {equipmentName}</p>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white" data-testid="button-close-wizard">
              ✕
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 4 ? "flex-1" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step <= currentStep
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {step <= currentStep ? (
                    step < currentStep ? "✓" : step
                  ) : (
                    step
                  )}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-4 transition-colors ${
                      step < currentStep ? "bg-blue-500" : "bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-gray-200 mt-4">{getStepTitle()}</h3>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {getCurrentStepContent()}
          </form>
        </div>

        {/* Fixed Footer with Navigation */}
        <div className="p-6 border-t border-gray-700/50 flex justify-between flex-shrink-0 bg-gray-900/95">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
            data-testid="button-previous-step"
          >
            Previous
          </Button>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              data-testid="button-cancel"
            >
              Cancel
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                data-testid="button-next-step"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={form.handleSubmit(onSubmit)}
                disabled={createWorkOrderMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                data-testid="button-create-work-order"
              >
                {createWorkOrderMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>{editingWorkOrder ? "Updating..." : "Creating..."}</span>
                  </div>
                ) : (
                  editingWorkOrder ? "Update Work Order" : "Create Work Order"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}