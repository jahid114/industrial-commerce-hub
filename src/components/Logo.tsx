import { Link } from "@tanstack/react-router";

interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
}

export function Logo({ variant = "dark", className = "" }: LogoProps) {
  const text = variant === "light" ? "text-white" : "text-industrial";
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex items-center">
        <div className="h-7 w-1.5 bg-primary" aria-hidden />
        <span className={`font-display text-2xl font-bold tracking-tight ${text} pl-2`}>
          MEGA<span className="text-primary">HAUS</span>
        </span>
      </div>
    </Link>
  );
}
