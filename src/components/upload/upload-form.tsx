'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Stack from '@mui/material/Stack'

import { useForm } from 'react-hook-form'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Container
} from '@mui/material'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CloseIcon from '@mui/icons-material/Close'
import {
  AuthorizeResult,
  CreateCredentialResult,
  ExtensionClient
} from 'signify-polaris-web'

const DIGEST_ALGORITHM: string = 'SHA-256'

export function UploadForm({
  extensionClient
}: {
  extensionClient: ExtensionClient
}): React.JSX.Element {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [attestCredResult, setAttestCredResult] =
    useState<CreateCredentialResult | null>(null)
  const [authorizeResult, setAuthorizeResult] =
    useState<AuthorizeResult | null>(null)

  const {
    handleSubmit,
    setError,
    formState: { errors },
    clearErrors
  } = useForm({})

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    clearErrors()
    if (event.target.files && event.target.files?.length > 0) {
      const uploadedFile = event.target.files[0]
      if (uploadedFile) {
        setFile(uploadedFile)
      }
    }
  }

  const handleFileRemove = () => {
    setFile(null)
  }

  const computeFileDigest = async () => {
    if (file) {
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      return hashHex
    }
  }

  const onSubmit = async (): Promise<void> => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      if (!file) {
        setError('root', {
          type: 'root.validation',
          message: 'Please select a file'
        })
        return
      }

      let fileDigest = computeFileDigest()
      //// Data attestation schema: https://github.com/provenant-dev/public-schema/blob/main/attestation/attestation.schema.json
      let schemaSaid = 'ENDcMNUZjag27T_GTxiCmB2kYstg_kqipqz39906E_FD'
      let credData = { digest: fileDigest, digestAlgo: 'SHA-256' }
      const result = await extensionClient.createDataAttestationCredential({
        credData: credData,
        schemaSaid: schemaSaid
      })
      console.log('create data attestation credential result: ', result)
      setAttestCredResult(result)
    } catch (e: any) {
      setError('root', { type: 'root.server', message: e.message })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAuthorize() {
    setErrorMessage(null)
    setIsLoading(true)
    setAuthorizeResult(null)

    try {
      const result = await extensionClient.authorize({
        message: `Message ${Date.now()}`
      })
      console.log('authorize result: ', result)
      setAuthorizeResult(result)
    } catch (error: any) {
      setErrorMessage(error.message ?? 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDownloadCredential() {
    setErrorMessage(null)
    setIsLoading(true)

    try {
      let credSAID = attestCredResult?.acdc?._ked?.d
      if (!credSAID) {
        setErrorMessage('Attestation credential data is not set.')
        return
      }
      const credential = await extensionClient.getCredential(credSAID, true)
      console.log('get credential result: ', credential)
      if (!credential?.credential) {
        setErrorMessage(
          'Unable to fetch attestation credential. Please try again later.'
        )
        return
      }
      const blob = new Blob([credential.credential], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'attestation-credential.cesr'
      link.click()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      setErrorMessage(error.message ?? 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box>
      {/* <Typography variant="h4">Upload a Document</Typography> */}
      <Typography
        color="text.primary"
        sx={{ fontSize: '24px', lineHeight: '32px', mb: 4 }}
        variant="h1"
      >
        Upload Document
      </Typography>

      <Card>
        <CardHeader
          subheader="Supported file format: pdf, excel, word, txt"
          title=""
          sx={{ ml: '8px' }}
        />
        {/* <Divider /> */}
        <CardContent>
          <Stack spacing={4}>
            {/* <Stack spacing={1}>
                        <Typography variant="h4">Upload a Document</Typography>
                        <Typography color="text.primary" sx={{ fontSize: '24px', lineHeight: '32px' }} variant="h1">
                            Upload a Document
                        </Typography>
                    </Stack> */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <Box
                  sx={{
                    border: '1px dashed #D0D5DD',
                    padding: '40px',
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: '500px',
                    margin: '0 auto',
                    borderRadius: '8px',
                    backgroundColor: '#F9FAFB',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* <CloudUploadIcon sx={{ fontSize: '48px', color: 'var(--mui-palette-neutral-100)', marginBottom: '20px' }} /> */}
                  <Button
                    variant="text"
                    component="label"
                    startIcon={<CloudUploadIcon sx={{ fontSize: '64px' }} />}
                    sx={{
                      textTransform: 'none',
                      color: '#344054',
                      fontSize: '16px',
                      fontWeight: 500,
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'transparent'
                      }
                    }}
                  >
                    Click to select a file
                    <input type="file" hidden onChange={onFileChange} />
                  </Button>
                  <Typography variant="body2" color="#667085" mt={1}>
                    Max file size is 15 MB
                  </Typography>
                </Box>

                {file && (
                  <Paper
                    elevation={0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '20px',
                      padding: '8px 20px',
                      margin: '0 5px',
                      border: '1px solid #D0D5DD',
                      borderRadius: '8px'
                    }}
                  >
                    <InsertDriveFileIcon
                      sx={{
                        fontSize: '40px',
                        color: '#667085',
                        marginRight: '16px'
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2">
                        {(file as File).name}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {((file as File).size / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                    <IconButton onClick={handleFileRemove}>
                      <CloseIcon />
                    </IconButton>
                  </Paper>
                )}

                {errors.root ? (
                  <Alert color="error">{errors.root.message}</Alert>
                ) : null}
                {errorMessage ? (
                  <Alert color="error">{errorMessage}</Alert>
                ) : null}
                <Button
                  disabled={isLoading}
                  variant="contained"
                  sx={{ mt: '10px' }}
                  onClick={handleAuthorize}
                >
                  Select Identifier to Sign
                </Button>
                <Button
                  disabled={isLoading}
                  type="submit"
                  variant="contained"
                  sx={{ mt: '10px' }}
                >
                  Sign Document
                </Button>
                {attestCredResult && (
                  <Button
                    disabled={isLoading}
                    variant="contained"
                    sx={{ mt: '10px' }}
                    onClick={handleDownloadCredential}
                  >
                    Download Attestation Credential
                  </Button>
                )}
              </Stack>
            </form>
          </Stack>
        </CardContent>
        {/* <Divider /> */}
        {/* <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button variant="contained">Submit</Button>
              </CardActions> */}
      </Card>
    </Box>
  )
}
