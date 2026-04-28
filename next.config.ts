import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // skip strict mode
  reactStrictMode: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    googleAnalyticsId: process.env.NODE_ENV === "production" ? process.env.GA_MEASUREMENT_ID : "",
  }
};

export default nextConfig;
