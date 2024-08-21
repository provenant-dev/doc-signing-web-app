# Document Signer App

Application to sign documents using Signify Browser Extension. This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and uses Material UI component library.

### Development

#### Prerequisites

1. `Signify Browser Extention`
    - Install `polaris-web-extension` from [Chrome Web Store](https://chromewebstore.google.com/category/extensions) once it is published.
    - To build and install from source code, follow instructions mentioned in [signify-browser-extension github repo](https://github.com/WebOfTrust/signify-browser-extension/blob/main/README.md#run-for-development)    

1. `signify-polaris-web`
    - Install the package [`signify-polaris-web`](https://github.com/WebOfTrust/polaris-web). At this point in time, the easiest way is to install straight from github.
    - This package is already added in `package.json` as dependencies and will use code from `main` branch of [`signify-polaris-web`](https://github.com/WebOfTrust/polaris-web) repo.    
        ```bash
        "signify-polaris-web": "https://github.com/WebOfTrust/polaris-web.git#main"
        ```

#### Build from source

* Install dependencies:
    ```bash
    npm install
    ```
* Run the development server:
    ```bash
    npm run dev
    ```
    - Open [http://localhost:3001/doc-signer](http://localhost:3001/doc-signer) with your browser to view the app. 

    - __Note__:  `/doc-signer` is required as path because [basePath option](https://nextjs.org/docs/pages/api-reference/next-config-js/basePath) is set in `next.config.js`.