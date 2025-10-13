/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint during builds on Vercel to avoid TypeScript parser dependency
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
