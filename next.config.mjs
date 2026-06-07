/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Root → v3 landing. The site root (`/`) historically fell through
      // to /factory → /factory/segments/federal-hpc (the v2-cornelis index).
      // v3 is the current product; redirect new visitors to the architect
      // view. permanent: false so we can revisit the landing choice later
      // without browsers caching a 308.
      {
        source: '/',
        destination: '/factory/architect',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
