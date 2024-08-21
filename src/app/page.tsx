'use client'

import { Box, Container, Typography, Grid, Stack, Alert } from '@mui/material'
import * as React from 'react'
import { UploadForm } from '@/components/upload/upload-form'
import { AuthorizeResult, createClient, ExtensionClient } from 'signify-polaris-web'

import { FormEvent, useEffect, useState } from 'react'

export default function Home() {
  const [extensionId, setExtensionId] = useState<string | false | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [authorizeResult, setAuthorizeResult] = useState<AuthorizeResult | undefined>(undefined)
  const [headers, setHeaders] = useState<Record<string, string> | null>(null)
  const [pending, setPending] = useState(false)
  const [method, setMethod] = useState('GET')
  const [extensionClient, setExtensionClient] = useState<ExtensionClient | null>(null)

  useEffect(() => {
    const client = createClient()
    setExtensionClient(client)
    client.isExtensionInstalled().then((result: any) => {
      console.log('isExtensionInstalled: ', result)
      setExtensionId(result)
    })
  }, [])

  //TODO: add a button to authorize
  async function handleAuthorize(ev: FormEvent) {
    ev.preventDefault()
    setError(null)
    setAuthorizeResult(undefined)
    setPending(true)

    try {
      if (!extensionClient) throw new Error('Extension client is not initialized')
      const result = await extensionClient.authorize({ message: `Message ${Date.now()}` })
      setAuthorizeResult(result)
    } catch (error: any) {
      setError(error.message ?? 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

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
            <Typography color="inherit" sx={{ fontSize: '24px', lineHeight: '32px' }} variant="h1">
              Sign Documents
            </Typography>
          </Box>
        </Box>
        {extensionId === false && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ maxWidth: '650px', width: '100%' }}>
              <Alert severity="warning">Polaris browser extension is not installed.</Alert>
            </Box>
          </Box>
        )}
        <Box sx={{ alignItems: 'center', display: 'flex', flex: '1 1 auto', justifyContent: 'center', p: 3, mb: 10 }}>
          <Box sx={{ maxWidth: '560px', width: '100%' }}>
            {/* <Typography variant="h4">Upload a Document</Typography> */}
            <Typography color="text.primary" sx={{ fontSize: '24px', lineHeight: '32px', mb: 4 }} variant="h1">
              Upload Document
            </Typography>
            <UploadForm />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
