/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ["res.cloudinary.com"], // ✅ Add your image hostname here
  },
};

export default nextConfig;
