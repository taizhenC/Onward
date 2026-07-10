import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CI can isolate build output from a local dev server or a stale interrupted
  // build by setting NEXT_DIST_DIR=.next-ci. The default remains Next's .next.
  distDir: process.env.NEXT_DIST_DIR?.trim() || ".next",
};

export default nextConfig;
