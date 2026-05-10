import { X } from "lucide-react";

type VocabularyAlertProps = {
  children: string;
  onDismiss?: () => void;
  dismissLabel?: string;
};

export function VocabularyAlert({
  children,
  onDismiss,
  dismissLabel = "Dismiss message",
}: VocabularyAlertProps) {
  if (!onDismiss) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {children}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <span>{children}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md p-1 hover:bg-destructive/10"
        aria-label={dismissLabel}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
