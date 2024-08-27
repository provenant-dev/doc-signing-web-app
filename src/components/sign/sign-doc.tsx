'use client'

import { Box, Alert } from '@mui/material'
import * as React from 'react'
import { UploadForm } from '@/components/upload/upload-form'
import { createClient } from 'signify-polaris-web'

import { useEffect, useState } from 'react'
import { config } from '@/config'

export default function SignDoc() {
  const [extensionId, setExtensionId] = useState<string | false | null>(null)
  const [extensionClient, setExtensionClient] = useState<any | null>(null)

  // useEffect(() => {
  //     if (typeof window !== 'undefined') {
  //         // Import the library only on the client side
  //         import('signify-polaris-web').then((module) => {
  //             const { createClient } = module
  //             const client = createClient()
  //             setExtensionClient(client)
  //             client.isExtensionInstalled().then((result: any) => {
  //                 console.log('isExtensionInstalled: ', result)
  //                 setExtensionId(result)
  //             })
  //         });
  //     }
  // }, []);

  useEffect(() => {
    const client = createClient()
    setExtensionClient(client)

    client.isExtensionInstalled().then((result: any) => {
      console.log('Is Extension Installed: ', result)
      setExtensionId(result)
    })
  }, [])

  async function changeExtensionTheme() {
    console.log(
      'signifyExtension.provenantThemeUrl: ',
      config.signifyExtension.provenantThemeUrl
    )
    if (!extensionClient) throw new Error('Extension client is not initialized')
    await extensionClient.configureVendor({
      url: config.signifyExtension.provenantThemeUrl as string
    })
  }

  return (
    <Box>
      {extensionId === false && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ maxWidth: '650px', width: '100%' }}>
            <Alert severity="warning">
              Polaris browser extension is not installed.
            </Alert>
          </Box>
        </Box>
      )}
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flex: '1 1 auto',
          justifyContent: 'center',
          p: 3,
          mb: 10
        }}
      >
        <Box sx={{ maxWidth: '560px', width: '100%' }}>
          {/* <Typography variant="h4">Upload a Document</Typography> */}
          {/* <Typography color="text.primary" sx={{ fontSize: '24px', lineHeight: '32px', mb: 4 }} variant="h1">
                        Upload Document
                    </Typography> */}
          <UploadForm extensionClient={extensionClient} />
        </Box>
      </Box>
    </Box>
  )
}
