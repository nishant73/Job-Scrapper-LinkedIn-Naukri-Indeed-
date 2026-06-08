import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-foreground text-background hover:opacity-90",
  secondary: "border border-border bg-panel text-foreground hover:bg-background",
  ghost: "text-muted hover:bg-background hover:text-foreground",
  danger: "bg-red-600 text-white hover:bg-red-700"
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: "sm" | "md" | "icon";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-accent",
        size === "sm" && "h-8 px-2.5 text-xs",
        size === "md" && "h-9 px-3 text-sm",
        size === "icon" && "h-9 w-9",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
