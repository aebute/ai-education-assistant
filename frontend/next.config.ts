import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Disables PWA caching during local development so changes update instantly
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* Your standard next.config options go here if needed */
};

export default withPWA(nextConfig);