import { createFileRoute } from "@tanstack/react-router";
import { sparkleHead } from "@/sparkle/meta";

// Every Sparkle screen (/news, /settings, /notes/:id, ...) is chosen by the Sparkle app's own
// in-app router, which is mounted once in __root so windows and tabs survive navigation.
export const Route = createFileRoute("/$")({
  head: () => sparkleHead(),
  component: () => null,
});
