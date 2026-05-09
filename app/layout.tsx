import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InnerCanvas",
  description: "Turn a short reflection into a quiet visual companion."
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
