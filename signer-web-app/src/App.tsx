import './App.css';
import JSZip from 'jszip';
import React, { useState, useRef, FormEvent, useEffect } from 'react';
import { Upload, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { AuthorizeResult, createClient, CreateCredentialResult, ExtensionClient } from 'signify-polaris-web';
import { Diger, MtrDex } from 'signify-ts';

// change the verifier endpoint as needed
const verifier_endpoint = "http://localhost:7676/verify-attestation"

// Define types for props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

interface CardProps {
  children: React.ReactNode;
}

// Button component with TypeScript props
const Button: React.FC<ButtonProps> = ({ children, ...props }) => (
  <button
    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
    {...props}
  >
    {children}
  </button>
);

// Input component with forwardRef and TypeScript props
const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input ref={ref} className="px-3 py-2 border rounded" {...props} />
));

// Card component
const Card: React.FC<CardProps> = ({ children }) => (
  <div className="bg-white shadow-md rounded-lg p-6 mb-4">{children}</div>
);

// CardHeader component
const CardHeader: React.FC<CardProps> = ({ children }) => (
  <div className="mb-4">{children}</div>
);

// CardTitle component
const CardTitle: React.FC<CardProps> = ({ children }) => (
  <h2 className="text-xl font-bold">{children}</h2>
);

// CardContent component
const CardContent: React.FC<CardProps> = ({ children }) => <div>{children}</div>;

const App: React.FC = () => {
  const [dataDigest, setDataDigest] = useState<string>('');
  const [pending, setPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<any | null>(null);
  // const [document, setDocument] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const verificationZipInputRef = useRef<HTMLInputElement | null>(null);
  const [verificationZip, setVerificationZip] = useState<File | null>(null);
  const [authorizeResult, setAuthorizeResult] = useState<AuthorizeResult | null>(null);
  const [extensionId, setExtensionId] = useState<string | false | null>(null);
  const [isAttestationIssued, setIsAttestationIssued] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [extensionClient, setExtensionClient] = useState<ExtensionClient | null>(null);
  const [attestCredResult, setAttestCredResult] = useState<CreateCredentialResult | null>(null);

  useEffect(() => {
    const client = createClient();
    setExtensionClient(client);
    client.isExtensionInstalled().then((result) => setExtensionId(result));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const client = createClient();
      setExtensionClient(client);
      client.isExtensionInstalled().then((result) => setExtensionId(result));
    }
  }, []);

  // need to handle the case where the extension is not installed
  async function handleAuthorize() {
    setError(null);
    setPending(true);
    setAuthorizeResult(null);
    try {
      if (!extensionClient) {
        throw new Error('Extension client not initialized');
      }
      const result = await extensionClient.authorize({ message: `Message ${Date.now()}` });
      console.log('authorize result: ', result)
      setAuthorizeResult(result);
    } catch (error: any) {
      setError(error.message ?? "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDocument(event.target.files[0]);
      const file = event.target.files[0];

      // Read the file into an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Create a Diger object with the raw data and the hash algorithm
      const diger = new Diger({ raw: uint8Array, code: MtrDex.Blake3_256 });

      // Get the qb64 encoded hash
      const documentQb64 = diger.qb64;

      // Update the state with the encoded hash
      setDataDigest(documentQb64);
      setAttestCredResult(null);
      setIsAttestationIssued(false);
    }
  };


  const handleAttestCredential = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    setPending(true);
    setIsAttestationIssued(false);
    try {
      let schemaSaid = 'ENDcMNUZjag27T_GTxiCmB2kYstg_kqipqz39906E_FD';
      // Todo: remove digestAlgo 
      let credData = { digest: dataDigest, digestAlgo: 'SHA-256' };
      if (!extensionClient) {
        throw new Error('Extension client not initialized');
      }
      if (!authorizeResult) {
        handleAuthorize()
        throw new Error('Authorization required');
      }
      const result = await extensionClient.createDataAttestationCredential({
        credData: credData,
        schemaSaid: schemaSaid
      });
      console.log('create data attestation credential result: ', result);
      setAttestCredResult(result);
      setIsAttestationIssued(true);
    } catch (error: any) {
      setError(error.message ?? "Something went wrong");
    } finally {
      setPending(false);
    }
  };

  async function getCredential(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    setPending(true);
    try {
      let credSAID = attestCredResult?.acdc?._ked?.d
      if (!extensionClient || !credSAID) {
        throw new Error('Extension client not initialized or no credential SAID');
      }
      const credential = await extensionClient.getCredential(credSAID, true);
      console.log('get credential result: ', credential)
      if (!credential?.credential) {
        setError("Unable to get credential");
        return
      }
      return credential.credential
    } catch (error: any) {
      setError(error.message ?? "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  const handleDownloadZip = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    setPending(true);

    try {
      const cred = await getCredential(ev);
      if (!cred) {
        throw new Error('Failed to get credential');
      }
      if (!document) {
        throw new Error('No document uploaded');
      }
      const zip = new JSZip();
      // name without suffix
      // ex. example.zip => example
      const documentName = document.name.split('.').slice(0, -1).join('.');
      zip.file(`${document.name}.cesr`, cred);
      zip.file(document.name, document);

      const content = await zip.generateAsync({ type: 'blob' });

      const url = window.URL.createObjectURL(content);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${documentName}-digest=${dataDigest}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);

      console.log('Zip file downloaded successfully');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred while creating the zip file");
      }
    } finally {
      setPending(false);
    }
  };


  const handleVerificationZipUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setVerificationZip(event.target.files[0]);
    }
  };


  const handleVerification = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    if (!verificationZip) {
      setVerificationResult('No zip file uploaded');
      setIsVerifying(false);
      return;
    }
    // get the name of the zip file after digest= andwithout .zip
    // examplezip-digest=EA2bjWRaF3Hk0e1x1hV5SbD_01APHYOg2oeeRNr8HVq1.zip 
    // => EA2bjWRaF3Hk0e1x1hV5SbD_01APHYOg2oeeRNr8HVq1
    const zipFileName = verificationZip?.name?.split('digest=').slice(-1)[0].split('.').slice(0, -1)[0];
    if (!zipFileName) {
      setVerificationResult('No zip file uploaded');
      setIsVerifying(false);
      return;
    }
    console.log('zipFileName:', zipFileName);
    // sent the zip file to the verifier endpoint
    const formData = new FormData();
    formData.append('file', verificationZip);

    try {
      const response = await fetch(`${verifier_endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      console.log('Response:', data);
      setVerificationResult(`Verification result: ${data}`);
    } catch (error) {
      console.error('Error:', error);
      setVerificationResult('Verification failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsVerifying(false);
    }
  };


  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        {JSON.stringify(
          {
            ExtensionId: extensionId,
          },
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Document Signing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                type="file"
                onChange={handleDocumentUpload}
                className="hidden"
                id="document-upload"
                ref={documentInputRef}
              />
              <Button onClick={() => documentInputRef.current?.click()}>
                <Upload className="inline-block mr-2" size={16} />
                Upload Document
              </Button>
              {document && <span className="ml-2 text-sm text-gray-600">{document.name}</span>}
            </div>
            <Button onClick={handleAttestCredential} disabled={!document || isAttestationIssued || pending}>
              {isAttestationIssued ? (
                <>
                  <CheckCircle className="inline-block mr-2" size={16} />
                  Attestation Issued
                </>
              ) : pending ? (
                <>
                  <Loader2 className="inline-block mr-2 animate-spin" size={16} />
                  Issuing...
                </>
              ) : (
                'Issue Attestation Credential'
              )}
            </Button>
            <Button onClick={handleDownloadZip} disabled={!isAttestationIssued}>
              <Download className="inline-block mr-2" size={16} />
              Download Signed Zip
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                type="file"
                onChange={handleVerificationZipUpload}
                className="hidden"
                id="verification-zip-upload"
                ref={verificationZipInputRef}
              />
              <Button onClick={() => verificationZipInputRef.current?.click()}>
                <Upload className="inline-block mr-2" size={16} />
                Upload Zip File
              </Button>
              {verificationZip && <span className="ml-2 text-sm text-gray-600">{verificationZip.name}</span>}
            </div>
            <Button onClick={handleVerification} disabled={!verificationZip || isVerifying}>
              {isVerifying ? (
                <>
                  <Loader2 className="inline-block mr-2 animate-spin" size={16} />
                  Verifying...
                </>
              ) : (
                'Submit for Verification'
              )}
            </Button>
            {verificationResult && (
              <div
                className={`p-4 rounded-md ${verificationResult.includes('successful') ? 'bg-green-100' : 'bg-red-100'
                  }`}
              >
                {verificationResult.includes('successful') ? (
                  <CheckCircle className="inline-block mr-2 text-green-600" size={16} />
                ) : (
                  <XCircle className="inline-block mr-2 text-red-600" size={16} />
                )}
                {verificationResult}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}
    </div>
  );
}

export default App;