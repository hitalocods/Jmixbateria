import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JMix Baterias 24h - Gestão de Estoque",
  description: "Aplicativo de gestão de estoque, vendas em tempo real e balcão para JMix Baterias 24h",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JMix 24h"
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#004b9a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a1120] text-slate-100 antialiased selection:bg-[#f99b1c] selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
