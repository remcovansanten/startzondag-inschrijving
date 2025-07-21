import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Startzondag 2025 - Gereformeerde Kerk Ermelo",
  description: "Meld je aan als vrijwilliger voor de Startzondag van de Gereformeerde Kerk Ermelo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="font-sans text-text-dark">{children}</body>
    </html>
  );
}