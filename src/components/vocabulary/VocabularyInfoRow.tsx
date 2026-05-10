type VocabularyInfoRowProps = {
  label: string;
  value: string;
};

export function VocabularyInfoRow({ label, value }: VocabularyInfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
