import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster' // Import the Toaster component

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
      <body>
        {children}
        <Toaster /> {/* Add the Toaster component here */}
      </body>
    </html>
  )
}