import type { Metadata } from 'next'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import './globals.css'
import { Providers } from '@/components/providers'
import { SiteChrome } from '@/components/site-chrome'

export const metadata: Metadata = {
  title: 'DeviceDock - Thoughtful technology',
  description: 'A curated destination for phones, laptops, tablets and audio.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  )
}
