import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NyayMitra',
  description: 'Created with ❤️ by NyayMitra Team',
  generator: 'NyayaMitra',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
