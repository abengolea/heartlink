"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavActive } from "@/lib/nav-active";

const linkClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function SidebarNavLink({
  href,
  children,
  className,
  prefetch = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname, href);

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(
        linkClass,
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-primary",
        className
      )}
    >
      {children}
    </Link>
  );
}
