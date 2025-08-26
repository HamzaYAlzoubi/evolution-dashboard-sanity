import withPWAInit from "next-pwa";

// نفعّل مكتبة next-pwa
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  // أي إعدادات إضافية لمشروعك
};

export default withPWA(nextConfig);
