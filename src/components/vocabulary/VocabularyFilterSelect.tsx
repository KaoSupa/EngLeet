import type { ReactNode } from "react";

type VocabularyFilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
};

export function VocabularyFilterSelect({
  label,
  value,
  onChange,
  disabled,
  children,
}: VocabularyFilterSelectProps) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
    </label>
  );
}
