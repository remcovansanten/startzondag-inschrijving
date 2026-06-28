import type { Metadata } from "next";
import "./globals.css";
import { EVENT_NAME, ORGANISATIE } from "@/lib/event";

export const metadata: Metadata = {
  title: `${EVENT_NAME} - ${ORGANISATIE}`,
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