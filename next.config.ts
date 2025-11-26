/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ["res.cloudinary.com", "crests.football-data.org"], // ✅ Add your image hostname here
  },
};

export default nextConfig;
