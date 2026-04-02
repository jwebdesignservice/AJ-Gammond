import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AJ Gammond - Safety Checklist",
  description: "Daily safety and maintenance checklist system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
