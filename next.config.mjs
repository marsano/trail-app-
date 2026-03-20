/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/calendar',
        destination: '/matthieu/calendar',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/matthieu/dashboard',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
