import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // When the dev app is opened from another device on the LAN, Next warns about
  // cross-origin /_next asset requests. It's non-blocking, but you can silence
  // it (and future-proof it) by listing the host(s) via ALLOWED_DEV_ORIGINS,
  // e.g. ALLOWED_DEV_ORIGINS=192.168.1.18 — no code change needed when the IP moves.
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

export default nextConfig;
