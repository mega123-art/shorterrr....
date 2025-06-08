const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  baseUrl: import.meta.env.VITE_BASE_URL || 'http://localhost:5000',
  appName: import.meta.env.VITE_APP_NAME || 'ShortLy',
  appDescription: import.meta.env.VITE_APP_DESCRIPTION || 'URL Shortener',
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    qrCode: import.meta.env.VITE_ENABLE_QR_CODE === 'true',
  }
};

export default config;