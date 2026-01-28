/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  images: {
    remotePatterns: process.env.NEXT_PUBLIC_R2_DOMAIN
      ? [
          {
            protocol: "https",
            hostname: new URL(process.env.NEXT_PUBLIC_R2_DOMAIN).hostname,
          },
        ]
      : [],
  },
};

export default nextConfig;
