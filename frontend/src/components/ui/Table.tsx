import { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

// Ledger-style table: hairline rules between rows, no zebra striping.
export function Table({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="relative -mx-4 overflow-x-auto sm:mx-0 sm:rounded-md sm:border sm:border-rule sm:bg-surface">
      <table aria-label={label} className="w-full min-w-[40rem] border-collapse bg-surface text-left text-[0.9375rem]">
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-rule-strong text-sm text-ink-soft">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={`px-4 py-2.5 font-semibold whitespace-nowrap ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-rule">{children}</tbody>;
}

export function Td({ children, className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}
