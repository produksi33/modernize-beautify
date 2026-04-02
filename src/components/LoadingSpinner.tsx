import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text = "Memuat data..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
