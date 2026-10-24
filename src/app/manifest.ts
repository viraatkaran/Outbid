import type { MetadataRoute } from "next";
import { BRAND, TAGLINE } from "../lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND, short_name: BRAND, description: TAGLINE, start_url: "/", display: "standalone",
    background_color: "#fff9ef", theme_color: "#d81b60",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
