/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow serving static files from public directory
  async rewrites() {
    return {
      beforeFiles: [
        // Serve HTML files directly
        {
          source: '/:path*.html',
          destination: '/:path*.html',
        },
        // Serve JS files directly
        {
          source: '/:path*.js',
          destination: '/:path*.js',
        },
        // Serve CSS files directly
        {
          source: '/:path*.css',
          destination: '/:path*.css',
        },
      ],
    }
  },
}

module.exports = nextConfig