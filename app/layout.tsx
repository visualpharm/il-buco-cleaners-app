import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MainNav } from "@/components/MainNav"
import ClickTracker from "@/components/ClickTracker"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Il Buco - Sistema de Limpieza",
  description: "Sistema de gestión de limpieza para Il Buco",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <MainNav />
        <main className="flex-grow">
          {children}
        </main>
        <ClickTracker />
      </body>
    </html>
  )
}
