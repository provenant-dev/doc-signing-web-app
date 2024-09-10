# Document Verifier App

Application to verify documents using Keripy, based on [GLEIF-IT/vlei-verifier](https://github.com/GLEIF-IT/vlei-verifier), which uses the Falcon framework in Python

### overview
To verify an aBesta:on ACDC, the user must upload both the document and its CESR file as a single zip file. The verifier server will check that (1) all KERI data are valid and (2) the digest of the document matches the digest in the aBesta:on ACDC.


## Architecture

### Verifier (this service)
The verifier uses [keripy](https://github.com/WebOfTRust/keripy) for verifying the requests.

The service can be launched from the command-line with:

```
verifier server start --config-dir scripts --config-file verifier-config-rootsid.json
```

* Note there are multiple config files depending on the environment you are running in.
For example config files, see [here](https://github.com/GLEIF-IT/vlei-verifier/tree/main/scripts/keri/cf). You can use these config files as they are or configure one as needed.


Or from docker-compose with:

```
docker-compose build --no-cache
docker-compose down
docker-compose up deps
```

### API

### Verify an Attestation ACDC:
To verify an attestation ACDC, the user must upload both the document and its CESR file as a single zip file to the POST `/attestaion/verify/{said}` API. The verifier server will check that (1) all KERI data are valid and (2) the digest of the document matches the digest in the attestation ACDC.  


## Peer projects
### Document Signer App

Application to sign documents using Signify Browser Extension. This is a Next.js project bootstrapped with create-next-app and uses Material UI component library:

See: [web-signer]()

### Attestaion Public-schema


See: [public-schema](https://github.com/provenant-dev/public-schema/tree/attestation-schema)

