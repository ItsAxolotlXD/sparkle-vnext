import { createFileRoute } from "@tanstack/react-router";

const SPOTLIGHT_HOST = "https://windows10spotlight.com";

export const Route = createFileRoute("/api/spotlight")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const response = await fetch(SPOTLIGHT_HOST, {
            headers: { "user-agent": "Mozilla/5.0 (compatible; SparkleOS/1.0)" },
          });
          if (!response.ok) {
            return Response.json({ images: [] }, { status: 502 });
          }

          const html = await response.text();
          const imageUrls = new Set<string>();
          const imageAttributes = html.matchAll(/(?:src|data-src|srcset)="([^"]+)"/gi);

          for (const [, attributeValue] of imageAttributes) {
            const candidates = attributeValue
              .split(",")
              .map((candidate) => candidate.trim().split(/\s+/)[0]);
            for (const candidate of candidates) {
              try {
                const imageUrl = new URL(candidate, SPOTLIGHT_HOST);
                if (
                  imageUrl.hostname === "windows10spotlight.com" &&
                  /\/wp-content\/uploads\/.*\.(?:jpe?g|webp|png)$/i.test(imageUrl.pathname)
                ) {
                  imageUrl.pathname = imageUrl.pathname.replace(
                    /-\d+x\d+(?=\.(?:jpe?g|webp|png)$)/i,
                    "",
                  );
                  imageUrls.add(imageUrl.toString());
                }
              } catch {
                // Ignore malformed or non-URL image attributes.
              }
            }
          }

          return Response.json(
            { images: [...imageUrls].slice(0, 30) },
            { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } },
          );
        } catch {
          return Response.json({ images: [] }, { status: 502 });
        }
      },
    },
  },
});
