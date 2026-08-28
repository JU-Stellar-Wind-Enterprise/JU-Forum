import type { ReactNode } from "react";

/** Provides the standard responsive width and spacing for application pages. */
export function PageShell({
  children,
  centered = false,
}: {
  children: ReactNode;
  centered?: boolean;
}) {
  return (
    <main
      className={`mx-auto w-full max-w-4xl flex-1 p-6 sm:p-10 ${centered ? "flex flex-col items-center" : ""}`}
    >
      {children}
    </main>
  );
}
