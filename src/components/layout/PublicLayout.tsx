import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { useStore } from "@/lib/store";

/** Where each signed-in role belongs. */
function homeFor(role: string | undefined) {
  if (role === "admin") return "/admin";
  if (role === "agent" || role === "partner") return "/portal";
  return "/portal-customer";
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const { user } = useStore();
  const navigate = useNavigate();
  const dest = user ? homeFor(user.role) : null;

  useEffect(() => {
    if (dest) navigate({ to: dest, replace: true });
  }, [dest, navigate]);

  if (dest) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Redirecting to your dashboard…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
