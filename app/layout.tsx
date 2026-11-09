import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Virtual 3D",
  description: "Recorre un campus 3D y descubre los proyectos de tus compañeros.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
