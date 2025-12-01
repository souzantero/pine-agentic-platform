import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthProvider } from "@/providers/Auth";
import { ToasterProvider } from "@/components/providers/toaster-provider";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pinechat",
  description: "Seu assistente de IA inteligente para conversas naturais, criação de conteúdo e resolução de problemas complexos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <ToasterProvider />
          <NuqsAdapter>{children}</NuqsAdapter>
        </AuthProvider>
      </body>
    </html>
  );
}
