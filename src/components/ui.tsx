import { forwardRef } from "react";
import { initials } from "@/lib/format";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-on-brand hover:brightness-110",
  secondary: "border border-border-strong bg-transparent text-ink hover:bg-surface-sunken",
  ghost: "bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink",
  danger: "bg-transparent text-danger hover:bg-danger/10",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" | "icon" }) {
  const sizes = {
    sm: "h-8 px-3 text-label gap-1.5",
    md: "h-10 px-[18px] text-[14px] leading-5 gap-2",
    icon: "h-8 w-8 justify-center",
  };
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex shrink-0 cursor-pointer items-center rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${buttonVariants[variant]} ${className}`}
    />
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-label font-medium text-ink">
        {label}
        {required && <span className="text-ink-muted"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-caption text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-caption text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-sm border border-border-strong bg-surface-raised px-3 text-body text-ink placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-offset-0 aria-[invalid=true]:border-danger";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input ref={ref} {...props} className={`h-10 ${controlClass} ${className}`} />;
  },
);

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-20 py-2 ${controlClass} ${className}`} />;
}

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`h-10 cursor-pointer ${controlClass} ${className}`} />;
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-surface-sunken font-medium text-brand"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initials(name)}
    </span>
  );
}
