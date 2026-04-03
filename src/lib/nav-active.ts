/** Coincide con la lógica del sidebar: /dashboard y /admin solo activos en coincidencia exacta. */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard" || href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
