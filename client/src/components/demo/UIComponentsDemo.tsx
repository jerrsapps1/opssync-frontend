import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function UIComponentsDemo() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="p-6 space-y-6 bg-gray-900 text-white">
      <h2 className="text-xl font-semibold">White-Label UI Components Demo</h2>
      
      {/* Button Variants */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Button Variants</h3>
        <div className="flex gap-3 flex-wrap">
          <Button variant="default">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="accent">Accent Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      </div>

      {/* Form Elements */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Form Elements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
          <Input placeholder="Text input with brand focus" />
          <Select>
            <option value="">Select an option</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </Select>
        </div>
      </div>

      {/* Dialog Demo */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Dialog Component</h3>
        <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
        
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Brand-Themed Dialog"
          description="This dialog uses your white-label brand colors for the header."
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDialogOpen(false)}>
                Confirm
              </Button>
            </div>
          }
        >
          <p className="text-gray-300">
            The dialog header background and text colors automatically follow your brand configuration.
            All buttons within also use the brand theme.
          </p>
        </Dialog>
      </div>

      {/* Table Demo */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Table Component</h3>
        <div className="max-w-2xl">
          <Table>
            <THead>
              <TR>
                <TH>Employee Name</TH>
                <TH>Role</TH>
                <TH>Project</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD>John Smith</TD>
                <TD>Site Manager</TD>
                <TD>Downtown Mall</TD>
                <TD>Active</TD>
              </TR>
              <TR>
                <TD>Sarah Johnson</TD>
                <TD>Equipment Operator</TD>
                <TD>Highway Expansion</TD>
                <TD>Active</TD>
              </TR>
              <TR>
                <TD>Mike Davis</TD>
                <TD>Safety Inspector</TD>
                <TD>Bridge Construction</TD>
                <TD>On Break</TD>
              </TR>
            </TBody>
          </Table>
        </div>
      </div>
    </div>
  );
}