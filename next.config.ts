import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

// نفعّل مكتبة next-pwa
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // أي إعدادات إضافية لمشروعك
};

export default withPWA(nextConfig);
