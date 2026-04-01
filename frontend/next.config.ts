import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  devIndicators: false,
  // Prevent @aws-sdk packages from being bundled/traced by Next.js.
  // They use node: protocol imports (e.g. node:async_hooks) whose colons
  // are illegal in Windows filenames — causing EINVAL on standalone copy.
  serverExternalPackages: [
    "@aws-sdk/client-ses",
    "@aws-sdk/credential-providers",
    "@aws-sdk/client-s3",
    "@smithy/node-http-handler",
    "@smithy/util-stream-node",
  ],
};

export default nextConfig;
