UI Brand Extras Patch
---------------------
Adds themed dropdowns, modal dialog, and table components that use your White Label CSS variables.

Included:
- client/src/components/ui/select.tsx
  * Native <select> with brand-radius and brand-primary focus ring.

- client/src/components/ui/dialog.tsx
  * Lightweight modal with overlay.
  * Header uses --brand-header-bg and --brand-text.
  * Content in dark surface; footer area for actions.

- client/src/components/ui/table.tsx
  * Table, THead, TBody, TR, TH, TD.
  * Header cells use --brand-header-bg and --brand-text.
  * Subtle zebra rows and hover.

How to use:
1) Drop these files into your project (overwrite or add).
2) Import where needed:
   import { Select } from "@/components/ui/select";
   import { Dialog } from "@/components/ui/dialog";
   import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

3) Example:
   <Table>
     <THead>
       <TR>
         <TH>Name</TH>
         <TH>Role</TH>
       </TR>
     </THead>
     <TBody>
       <TR><TD>Jane Doe</TD><TD>Operator</TD></TR>
     </TBody>
   </Table>

All components respect the CSS variables set by your white-label theme.
