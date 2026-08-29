import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Accès dev depuis le LAN (ex. http://192.168.11.115:3001) — localhost n'en a pas besoin
  allowedDevOrigins: ["192.168.11.115"],
};

export default nextConfig;
