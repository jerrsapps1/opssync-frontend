import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full text-sm text-left border-separate border-spacing-0", className)}
        {...props}
      />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("text-xs uppercase", className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("", className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("even:bg-white/[.02] hover:bg-white/[.04]", className)} {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 bg-[var(--brand-header-bg)] text-[var(--brand-text)]",
        "px-3 py-2 font-medium border-b border-gray-800 first:rounded-tl-[var(--brand-radius)] last:rounded-tr-[var(--brand-radius)]",
        className
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-3 py-2 border-b border-gray-800",
        className
      )}
      {...props}
    />
  );
}
