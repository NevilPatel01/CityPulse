/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Google OAuth Configuration
    readonly VITE_GOOGLE_CLIENT_ID?: string
    readonly VITE_GOOGLE_CLIENT_SECRET?: string
    readonly VITE_GOOGLE_REDIRECT_URI?: string

    // API Configuration  
    readonly VITE_API_URL?: string
    readonly VITE_API_BASE_URL?: string

    // App Configuration
    readonly VITE_APP_TITLE?: string
    readonly VITE_APP_VERSION?: string
    readonly VITE_APP_ENV?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
