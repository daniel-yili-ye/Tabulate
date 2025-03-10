/** @type {import('next').NextConfig} */

const supabaseDomain =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "").split(".")[0] +
  ".supabase.co";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseDomain,
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
