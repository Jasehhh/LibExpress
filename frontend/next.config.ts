import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The services call the API from the browser (the staff JWT lives there),
  // so BACKEND_URL from frontend/.env is inlined into the client bundle at
  // build time. It must end in /api, e.g. http://localhost:4000/api.
  env: {
    BACKEND_URL: process.env.BACKEND_URL ?? "http://localhost:4000/api",
  },
};

export default nextConfig;
