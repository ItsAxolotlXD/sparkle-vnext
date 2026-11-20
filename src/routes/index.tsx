import { createFileRoute } from "@tanstack/react-router";
import { sparkleHead } from "@/sparkle/meta";

// The Sparkle app is mounted once in __root and reads the URL itself; this route only owns metadata.
export const Route = createFileRoute("/")({
  head: () => sparkleHead(),
  component: () => null,
});
