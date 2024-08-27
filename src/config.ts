export const config = {
  site: {
    name: '',
    description: '',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    version: process.env.NEXT_PUBLIC_SITE_VERSION
  },
  logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL,
  signifyExtension: {
    provenantThemeUrl: process.env.NEXT_PUBLIC_EXTENSION_PROVENANT_THEME_URL
  }
}
