import type { ReactNode } from "react";

/**
 * Provides the standard responsive width and spacing for application pages.
 *
 * @param props - Page content and whether it should be horizontally centered.
 * @returns A consistently sized main-content container for feature routes.
 */
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
