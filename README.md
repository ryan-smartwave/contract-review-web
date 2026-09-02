# Contract Review Web

Next.js UI for the SmartWave contract-review demo (Globe, presented
Sept 7, 2026). The Python backend lives in the sister repo
[`contract-review-agent`](https://github.com/ryan-smartwave/contract-review-agent) —
this app is the reviewer's workbench on top of its REST API.

## What it does (as of 2026-09-01)

- **Review queue** (`/`) — every document the agent has ingested (email,
  upload, or Drive), with its classification badge, confidence,
  reasoning, and a "redlines ready in Ns" latency chip. Refreshes itself.
- **Upload** (`/upload`) — drag-and-drop or click-to-browse for PDF/DOCX;
  unsupported types are rejected with a clear message.
- **Drive search** (`/search`) — keyword search over the authorized
  Google Drive, a clarifying question when more than one contract
  matches, and explicit confirmation before a result enters review.
- **Document viewer** (`/documents/[id]`) — three tabs:
  - **Review** — the contract rendered as a document with the agent's
    suggested edits inline (tracked-changes style), and a suggestion card
    per edit. Accept/Reject **stage** decisions locally; one
    **Confirm & save** commits them as a single new version with a
    downloadable labeled DOCX. Stale suggestions are surfaced with a
    notice, never silently applied.
  - **Original document** — the untouched source file with real styling
    (PDF via react-pdf, DOCX via docx-preview).
  - **Compared with prior** — for contract revisions only: the agent's
    match against the most similar earlier contract in the database, a
    plain-English summary, green highlights on changed/added passages,
    and a change card per difference.
- **Theme** — the client's APC Design System, Stockholm theme
  (tokens in `src/app/globals.css` from the client's `apc.tokens.json`),
  in both light and dark mode following the OS setting.

## How to run

**1. One-time setup** (Node 20):

```bash
npm install
```

**2. Start the backend first** — see `contract-review-agent`'s README;
the UI expects it on `http://localhost:8000`. To point elsewhere, set
`NEXT_PUBLIC_API_URL` (no trailing slash) in `.env.local`. It's baked at
build time in production.

**3. Start the dev server:**

```bash
npm run dev
```

Open http://localhost:3000. If the home page errors, the backend isn't
up yet — start it first (known limitation: no fetch error boundary).

## Tests & checks

```bash
npm test        # vitest — component and API-client tests
npm run lint    # eslint
npm run build   # production build
```

## Structure

Bulletproof-react layout: `src/app` (routes) → `src/features/*`
(review-queue, upload, drive-search, document-viewer) → shared
`src/components` / `src/lib` / `src/types`. Import rule: shared →
features → app; features never import each other.

## Deploy

Vercel, auto-deploying from `main`. The only required env var is
`NEXT_PUBLIC_API_URL` pointing at the Railway backend — full steps in
`contract-review-agent/docs/deployment.md`.
