import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Equipment } from "@shared/schema";

const workOrderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  reason: z.string().min(1, "Reason is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assignedTo: z.string().optional(),
  estimatedCost: z.string().optional(),
  notes: z.string().optional(),
});

type WorkOrderForm = z.infer<typeof workOrderSchema>;

interface WorkOrderWizardProps {
  equipment: Equipment;
  onClose: () => void;
  onWorkOrderCreated: () => void;
}

export function WorkOrderWizard({ equipment, onClose, onWorkOrderCreated }: WorkOrderWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const form = useForm<WorkOrderForm>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: `Repair: ${equipment.name}`,
      description: "",
      reason: "",
      priority: "medium",
      assignedTo: "",
      estimatedCost: "",
      notes: "",
    },
  });

  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: WorkOrderForm) => {
      const workOrder = {
        equipmentId: equipment.id,
        title: data.title,
        description: data.description,
        reason: data.reason,
        priority: data.priority,
        assignedTo: data.assignedTo || undefined,
        estimatedCost: data.estimatedCost ? parseInt(data.estimatedCost) * 100 : undefined, // Convert to cents
        notes: data.notes || undefined,
        status: "open",
      };

      const response = await apiRequest("POST", "/api/work-orders", workOrder);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Work Order Created",
        description: `Work order for ${equipment.name} has been created successfully.`,
      });
      onWorkOrderCreated();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create work order",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WorkOrderForm) => {
    createWorkOrderMutation.mutate(data);
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate basic fields before proceeding
      const fields = ["title", "description", "reason"] as const;
      let hasErrors = false;
      
      for (const field of fields) {
        const fieldState = form.getFieldState(field);
        const value = form.getValues(field);
        if (!value || value.trim() === "") {
          form.setError(field, { message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required` });
          hasErrors = true;
        }
      }
      
      if (!hasErrors) {
        setStep(2);
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const reasonOptions = [
    "Mechanical failure",
    "Electrical issue",
    "Hydraulic problem",
    "Routine maintenance",
    "Safety inspection required",
    "Performance degradation",
    "Unusual noise or vibration",
    "Fluid leaks",
    "Operator reported issue",
    "Preventive maintenance",
    "Other"
  ];

  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      title={<span className="flex items-center gap-2">🔧 Create Work Order</span>}
      description={<span>Create a work order for <strong>{equipment.name}</strong></span>}
      className="max-w-md"
    >

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Order Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter work order title"
                          {...field}
                          data-testid="input-work-order-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Repair</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-repair-reason">
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reasonOptions.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the issue in detail..."
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="textarea-work-order-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter technician name"
                          {...field}
                          data-testid="input-assigned-to"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Cost (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter estimated cost in dollars"
                          {...field}
                          data-testid="input-estimated-cost"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information..."
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                {step > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    data-testid="button-previous"
                  >
                    Previous
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
              
              <div>
                {step === 1 ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    data-testid="button-next"
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={createWorkOrderMutation.isPending}
                    data-testid="button-create-work-order"
                  >
                    {createWorkOrderMutation.isPending ? "Creating..." : "Create Work Order"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
    </Dialog>
  );
}