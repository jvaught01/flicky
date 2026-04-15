# Flicky landing page

Next.js 15 static site for [flicky](https://github.com/jvaught01/flicky).
Built as a static export so it can be dropped onto GitHub Pages, Vercel,
Netlify, Cloudflare Pages, or any plain static host.

## Develop

```bash
cd landing
npm install        # or bun install / pnpm install
npm run dev
```

Opens on http://localhost:3030.

## Build

```bash
npm run build
```

Produces a static bundle in `landing/out/`.

## Deploy

### GitHub Pages

Serve `landing/out/` from Pages, or wire a workflow that runs
`cd landing && npm ci && npm run build` and uploads `landing/out/`
as the Pages artifact.

### Vercel

Set the **Root Directory** to `landing` in project settings. Next.js
is detected automatically.
