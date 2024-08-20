import * as React from 'react'
import type { Viewport } from 'next'

import '@/styles/global.css'
// import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
// import { ThemeProvider } from '@mui/material/styles';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider'

export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Document Signing App</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        {/* <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider> */}
      </body>
    </html>
  )
}
