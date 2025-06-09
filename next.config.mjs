/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
     
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000'
        // pathname: '/photos/**'
      }
    ]
  },
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  reactStrictMode: true,
  devIndicators: {
    buildActivity: false,
    autoPrerender: false,
    reactStrictMode: true,
    devIndicators: false,
  },
}

export default nextConfig
