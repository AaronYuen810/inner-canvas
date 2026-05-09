import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InnerCanvas",
  description: "Turn a quick check-in into a visual journal entry and mood snapshot."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
