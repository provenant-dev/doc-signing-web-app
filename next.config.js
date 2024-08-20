const { NEXT_PUBLIC_ROOT_ORIGIN_APP_BASE_URL } = process.env;

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: false,
    basePath: '/doc-signer'
};

module.exports = nextConfig