import type { NextConfig } from 'next';
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isPages = process.env.GITHUB_ACTIONS === 'true' && !!repo;
const basePath = isPages ? `/${repo}` : '';
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};
export default nextConfig;
