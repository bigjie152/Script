import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "..", "..", ".env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true
  },
  webpack: (config) => {
    const nodeModules = path.resolve(process.cwd(), "node_modules");
    config.resolve = config.resolve || {};
    config.resolve.modules = [
      nodeModules,
      ...(config.resolve.modules || [])
    ];
    if (Array.isArray(config.externals)) {
      config.externals.push("better-sqlite3");
    }
    return config;
  }
};

export default nextConfig;
