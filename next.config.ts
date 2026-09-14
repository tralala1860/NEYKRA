import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Aligné sur la limite applicative de createPost (max 5 Mo) avec marge :
      // c'est la validation de createPost qui doit rester la limite perçue,
      // celle de Next.js ne doit pas bloquer avant (sinon erreur 413).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
