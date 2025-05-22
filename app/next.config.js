/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
  },
  env: {
    NEXT_PUBLIC_CLUSTER: process.env.NEXT_PUBLIC_CLUSTER || 'devnet',
    NEXT_PUBLIC_RPC_ENDPOINT: process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  },
  webpack: (config, { isServer }) => {
    // Handle Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Handle specific problematic modules
    config.externals = config.externals || [];
    config.externals.push('pino-pretty');
    
    return config;
  },
}

module.exports = nextConfig 