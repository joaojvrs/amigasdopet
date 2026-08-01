import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amigas do Pet | Veterinária",
  description: "Medicina veterinária com tecnologia, presença e carinho.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
