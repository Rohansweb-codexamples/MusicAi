import type { NextConfig } from "next";

/**
 * The sandbox preview serves the dev server through a proxy on a different
 * origin. Next.js gates dev assets and HMR by Origin, so the preview origin
 * must be allow-listed while running inside the Base44 sandbox
 * (BASE44_PREVIEW_MODE=1). Unset/any other value keeps the default behaviour.
 */
const previewOrigins =
  process.env.BASE44_PREVIEW_MODE === "1" && process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? [`3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`]
    : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: previewOrigins,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
