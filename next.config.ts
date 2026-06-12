import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All images are local files under /public; skipping the optimizer avoids
  // a native sharp dependency in constrained environments.
  images: { unoptimized: true },
};

export default nextConfig;
