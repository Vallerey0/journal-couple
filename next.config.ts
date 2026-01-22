import type { NextConfig } from "next";

const r2Domain = process.env.NEXT_PUBLIC_R2_DOMAIN;
const remotePatterns = [];

if (r2Domain) {
  try {
    const url = new URL(
      r2Domain.startsWith("http") ? r2Domain : `https://${r2Domain}`,
    );
    remotePatterns.push({
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
    });
  } catch (e) {
    // ignore
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
