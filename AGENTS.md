# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, Copilot, and others) working in
this repository. Loaded into agent context automatically — keep it concise.

## Overview

`flow-actions-website` is a static HTML/CSS/JS site that renders a marketplace UI for the
[onflow/FlowActions](https://github.com/onflow/FlowActions) Cadence connectors. On page load,
`app.js` calls the GitHub REST API, recursively walks `cadence/contracts/connectors` in that
repo, parses `.cdc` file contents for struct-level docstrings, and renders filterable action
cards. There is no build step, no framework, and no server — the site is three files plus an
SVG icon and deploys as plain static assets.

## Repository Layout

```
flow-actions-website/
├── index.html        # Single-page markup; loads styles.css and app.js
├── styles.css        # Flow.com-inspired dark theme; CSS custom props in :root
├── app.js            # All runtime logic (fetch, parse, render, filter)
├── flow-icon.svg     # Favicon and header logo
├── README.md         # Human-facing docs (setup, deployment, customization)
└── .gitignore        # Excludes .DS_Store, .vercel, .env*, editor dirs
```

No `package.json`, no `node_modules`, no bundler config, no test framework. Do not introduce
any of these without explicit instruction.

## Run Locally

The site uses `fetch()` against `api.github.com`, so a `file://` open will fail CORS. Serve
from a local HTTP server. The README documents three equivalent options:

- `python3 -m http.server 8000`
- `npx http-server -p 8000`
- `php -S localhost:8000`

Then open `http://localhost:8000`.

## Deployment

Any static host works (README lists Netlify, Vercel, GitHub Pages, Cloudflare Pages). No
build command; publish the repo root. `.gitignore` already excludes `.vercel` local state.

## Architecture Notes

`app.js` is a single module of top-level functions, wired up via `DOMContentLoaded` at the
bottom of the file. Key entry points:

- `renderActions()` — orchestrator; calls `fetchConnectors()`, batches metadata extraction
  (batch size 5, 100 ms delay between batches — see `app.js:494-515`), sorts, renders cards,
  then `initializeFilters()`.
- `fetchConnectors()` / `fetchConnectorsRecursive()` — walk the GitHub contents API starting
  at `cadence/contracts/connectors` (`GITHUB_API_BASE` constant, `app.js:2`).
- `extractMetadata(content, fileName)` — parses `///` doc comments preceding `struct`
  definitions; filters out beta warnings; falls back to contract-level docs, then to
  `generateDescriptionFromName()`.
- `formatTitle(fileName)` — camelCase splitter with a whitelist of acronyms
  (`ERC4626`, `EVM`, `FLOW`, `DeFi`, `COA`, `DFA`, etc. — `app.js:409-414`) that must stay
  intact when splitting filenames into display titles.
- `renderFilters()` / `initializeFilters()` / `applyFilters()` — filter UI is driven only by
  action type (`Source`, `Sink`, `Swapper`, `Price Oracle`, `Flash Loan`, `Connector`,
  `Utilities`), not tags; see `ACTION_TYPE_MAP` at `app.js:6-14`.

## Conventions and Gotchas

- **Unauthenticated GitHub API** — requests use no token (`app.js:92-108`). Rate limit is
  60/hr per IP. Do not add a hardcoded token; if auth is needed, it must come from a config
  the user controls.
- **User content is untrusted** — all connector fields flow through `escapeHtml()`
  (`app.js:590-594`) before insertion via `innerHTML`. Preserve that pattern when adding new
  card fields; never interpolate raw strings into template literals.
- **Card click opens GitHub** — cards use inline `onclick="window.open(...)"`
  (`app.js:553`) and the inner "View on GitHub" anchor calls `event.stopPropagation()`. Keep
  both when restructuring cards.
- **Acronym list is load-bearing** — `formatTitle` depends on the acronym array being
  ordered longest-first so `ERC4626` matches before `ERC20` (`app.js:408-414`). When adding
  entries, preserve that ordering.
- **CSS theme tokens live in `:root`** — colors come from custom properties in
  `styles.css:7-29` (`--primary-color: #00ef8b`, Flow accent palette). Prefer editing
  these over hardcoding new hex values.
- **Fonts are loaded from Google Fonts** via `<link>` in `index.html:9-11` (Epilogue +
  Inter). No self-hosting.
- **External links open in new tabs** with `target="_blank" rel="noopener noreferrer"` —
  match this pattern for any new outbound link in `index.html` or in card markup in `app.js`.

## Files Not to Modify Without Reason

- `flow-icon.svg` — brand asset.
- `.gitignore` entries for `.vercel` / `.env*` — deployment/secret hygiene.
