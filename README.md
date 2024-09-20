# KERI Document Signer

This project was developed to demonstrate how the [Key Event Receipt Infrastructure (KERI)](https://trustoverip.github.io/tswg-keri-specification/) protocol can sign and verify an arbitrary electronic document by utilizing a browser extension.  

The projects has two components a [document signer web application](signer-web-app/) and a [verifier server](verifier/).

## Prerequisites
This project is dependent on:
- [Polaris browser extension](https://github.com/WebOfTrust/signify-browser-extension): a light-weight KERI browser extensions. This extension will be published in [Chrome Web Store](https://chromewebstore.google.com/category/extensions) and [Firefox Browser Add-ons](https://addons.mozilla.org/en-US/firefox/).
- [Polaris web](https://github.com/WebOfTrust/polaris-web): a frontend companion library to the Polaris browser extension, which utilizes [Signify-TS](https://github.com/WebOfTrust/signify-ts). Polaris web must be installed on a frontend application that utilizes the Polaris browser extension.

## Signer-web-app

The document signer is a simple React application that allows users to upload any file, which will then be signed using the KERI protocol using the Polaris browser extension. Below is an overview of the key functionalities provided by the document signer:

1. A user upload a file, e.g., `filename.ext`, where `ext` is the file extension.
2. A Blake3 digest of the file is computed, encoded as a Base64 [CESR](https://trustoverip.github.io/tswg-cesr-specification/) string, which is 44-character log starting with `E` for Blake3.
3. The digest is submitted to the Polaris browser extension. 
4. The user chooses an [autonomic identifier (AID)](https://trustoverip.github.io/tswg-keri-specification/#autonomic-identifier-aid) to sign the document and click a confirm button.
5. The digest of the document is anchored to the AID's key event log (KEL).
6. The browser returns `filename.ext.cesr` the document signer, which contains the entire CESR stream for verifying the document with the KERI protocol.
7. The document signer create a zip file, called `filename-digest={DIGEST}.zip`, that contains `filename.ext`, `filename.ext.cesr`, and `README.txt`. The README only provides description of the zip file and is not involved in the signing and verification.
8. The user downloads the zip file. 
9. The user re-uploads the zip file, which is sent to the verifier server for verification.

Note that `{DIGEST}` in the zip file must not be changed as it is required during verification below.

#### Dependency 
The document signer requires installation of the Polaris web in `package.json`[`signify-polaris-web`](https://github.com/WebOfTrust/polaris-web).
```bash
"signify-polaris-web": "https://github.com/WebOfTrust/polaris-web.git"
```

## Verifier Server

A verifier server is a backend application using the Falcon framework. It is loosely based on the vLEI verifier [GLEIF-IT/vlei-verifier](https://github.com/GLEIF-IT/vlei-verifier). Below is an overview of the key functionalities provided by the verifier server:

1. The verifier receives a `filename-digest={DIGEST}.zip` from the document signer application.
2. The verifier unzips the zip file to obtain `filename.ext` and `filename.ext.cesr`
3. The verifier compute the Base64-CESR-encoded Blake3 digest of `filename.ext`. 
4. The digest is checked if it matches the zip's filename.
5. The `filename.ext.cesr` is verified using [KERIpy](https://github.com/WebOfTrust/keripy)'s parser. 
6. The digest is checked if it matches the digest of the [ACDC](https://trustoverip.github.io/tswg-acdc-specification/#go.draft-ssmith-acdc.html) in the CESR file.
7. The verification result is returned to the document signer.

Note: the verifier server currently does not support duplicity detection. Duplicitous but valid KELs in the CESR file will be verified and accepted.

## Attestation Credential Schema
Signing a document using the KERI protocol results in issuance of an [authentic chained data container (ACDC)](https://trustoverip.github.io/tswg-acdc-specification/#go.draft-ssmith-acdc.html). This project the [data attestation credential](https://github.com/provenant-dev/public-schema/blob/main/attestation/attestation.schema.json) scehma for signing documents. Its attribute contains the Base64-CESR-encoded digest of the document.

#### Chaining the attestation credential
The data attestation credential could be optionally chained to another ACDC to provide a chain of trust of the signer to the document. For example, the credential could be chained to a Official Organization Role (OOR) or Engagement Context Role (ECR) vLEI credentials to provide a organizational chain of trust and assert that the document has been signed by an authorized organization representative. 