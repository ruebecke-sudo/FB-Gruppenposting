import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'MDW Publish', description: 'Planung und Freigabe autorisierter Social-Media-Beiträge.' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>
}
