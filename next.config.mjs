/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }] },
  // No ESLint config is shipped; don't let an absent lint setup block `next build`.
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
