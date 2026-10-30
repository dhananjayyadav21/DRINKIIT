/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Our product/hero images are static and rarely change - cache the
    // optimized variants at the CDN/browser for a long time instead of the
    // 60s default, so repeat visits don't re-fetch or re-optimize them.
    minimumCacheTTL: 31536000,
  },
};

module.exports = nextConfig;
