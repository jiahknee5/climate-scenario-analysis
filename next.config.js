/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Next.js to handle clean URLs
  async rewrites() {
    return [
      // Redirect clean URLs to .html files
      {
        source: '/climada-hurricane-analysis',
        destination: '/climada-hurricane-analysis.html',
      },
      {
        source: '/climate-os-statistical',
        destination: '/climate-os-statistical.html',
      },
      {
        source: '/cbottle-risk-assessment',
        destination: '/cbottle-risk-assessment.html',
      },
      {
        source: '/cbottle-scenario-analysis',
        destination: '/cbottle-scenario-analysis.html',
      },
      {
        source: '/working-dual-climada',
        destination: '/working-dual-climada.html',
      },
      {
        source: '/working-dual-climate-os',
        destination: '/working-dual-climate-os.html',
      },
      {
        source: '/framework-comparison',
        destination: '/framework-comparison.html',
      },
      {
        source: '/deployment-test-vercel',
        destination: '/deployment-test-vercel.html',
      },
      {
        source: '/test-all-frameworks',
        destination: '/test-all-frameworks.html',
      },
      // Generic pattern for any other HTML files
      {
        source: '/:path*',
        destination: '/:path*.html',
        has: [
          {
            type: 'query',
            key: 'html',
            value: 'true',
          },
        ],
      },
    ]
  },
  // Also allow trailing slashes
  trailingSlash: false,
}

module.exports = nextConfig