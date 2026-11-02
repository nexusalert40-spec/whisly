import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://whisly.lovable.app";
// Public, indexable pages only. Signed-in app pages and /auth (noindex) are excluded.
const PATHS = ["/", "/signup", "/login", "/legal"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = PATHS.map((p) => `<url><loc>${BASE_URL}${p}</loc></url>`).join("");
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
          { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } },
        );
      },
    },
  },
});
