import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SynestMind",
    short_name: "SynestMind",
    description: "Allenamento cognitivo musicale",
    start_url: "/",
    display: "standalone",
    background_color: "#141418",
    theme_color: "#141418",
    orientation: "any",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
