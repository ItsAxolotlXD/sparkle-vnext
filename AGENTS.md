<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- The Sparkle desktop app lives in `src/sparkle/` and is mounted once, client-only, from `src/routes/__root.tsx`; it picks screens from the URL with its own in-app router. Why: its windows/tabs must survive navigation and it reads browser storage while rendering.
- `src/routes/index.tsx` and `src/routes/$.tsx` only provide page metadata and render nothing. Why: every path belongs to the Sparkle in-app router.
- Ported Sparkle files start with `// @ts-nocheck -- ported as-is ...`; new or substantially rewritten files must not. Why: the original code was written for a non-strict TypeScript setup.
- Sparkle sign-in state comes from `src/sparkle/services/authSession.ts` (single auth listener). Why: avoids competing auth subscribers.
- `src/styles.css` excludes itself from Tailwind scanning (`@source not`). Why: its attribute selectors contain class-like strings that Tailwind would turn into invalid CSS.
- Start menu / taskbar pins live in `src/sparkle/services/pinStore.ts` (one shared store, persisted in localStorage) and the Start app list in `src/sparkle/data/startApps.ts`. Why: Start and taskbar right-click menus must stay in sync.
