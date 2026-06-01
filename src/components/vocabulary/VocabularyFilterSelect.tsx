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
        className="focus-ring h-11 w-full rounded-lg border bg-background/80 px-3 text-sm outline-none transition focus:border-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
    </label>
  );
}
