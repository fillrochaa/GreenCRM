import { CircleAlert } from "lucide-react";

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-sm bg-danger/10 px-3 py-2.5 text-label text-danger">
      <CircleAlert size={16} strokeWidth={2} aria-hidden className="mt-px shrink-0" />
      {children}
    </p>
  );
}
