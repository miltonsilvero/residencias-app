import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casa al día — gestión de servicios",
  description: "Gestión de facturas y gastos compartidos de la residencia",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-ink)]">
        {children}
      </body>
    </html>
  );
}
