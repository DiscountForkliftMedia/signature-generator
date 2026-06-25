/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure the bundled default reference card ships inside the serverless
  // function so the API route can read it at runtime on Vercel.
  outputFileTracingIncludes: {
    "/api/generate-card": ["./public/reference-card.*"],
  },
};

export default nextConfig;
