'use client'

import { Box, Typography } from '@mui/material'
import * as React from 'react'
//import SignDoc from '@/components/sign/sign-doc'
import dynamic from 'next/dynamic'

// Dynamically import the page component with SSR disabled
const SignDocComponent = dynamic(() => import('../components/sign/sign-doc'), {
  ssr: false
})

export default function Home() {
  return (
    <Box
      sx={{
        display: { xs: 'flex', lg: 'grid' },
        flexDirection: 'column',
        gridTemplateColumns: '1fr',
        minHeight: '100%'
      }}
    >
      <Box sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column' }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'inline-block', fontSize: 0 }}>
            {/* <Box alt="logo" component="img" height={32} src={'/assets/logo-github.png'} width={122} />; */}
            <Typography
              color="inherit"
              sx={{ fontSize: '24px', lineHeight: '32px' }}
              variant="h1"
            >
              Sign Documents
            </Typography>
          </Box>
        </Box>
        <SignDocComponent />
      </Box>
    </Box>
  )
}
