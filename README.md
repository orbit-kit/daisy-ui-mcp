# DaisyUI Docs API (Cloudflare Worker)

This project exposes DaisyUI documentation through HTTP endpoints and is ready to deploy on Cloudflare Workers.

The component docs are sourced from `daisyui-mcp/components/*.md` and compiled into a static TypeScript map for Worker runtime compatibility.

## Endpoints

- `GET /v1/components`
  - Returns component names and short descriptions.
  - Query params:
    - `q`: filter by substring (example: `?q=button`)
    - `limit`: max number of items (max 200)
    - `format=text`: returns MCP-style plain text output

- `GET /v1/components/:name`
  - Returns full docs for one component in JSON.
  - Query params:
    - `format=markdown` or `format=text`: returns raw markdown

- `GET /mcp/list_components`
  - MCP-compatible plain text list response.

- `GET /mcp/get_component/:name`
  - MCP-compatible plain text component docs.

- `GET /health`
  - Health check.

## Local development

```txt
npm install
npm run dev
```

`npm run dev` regenerates component data first, then starts Wrangler.

## Deploy

```txt
npm run deploy
```

`npm run deploy` regenerates component data first, then deploys to Cloudflare Workers.

## Regenerate docs bundle

```txt
npm run generate:components
```

Use this whenever markdown files under `daisyui-mcp/components/` change.

By default, generation also fetches and appends real code examples from `https://daisyui.com/components/*`.

Optional tuning env vars:

- `DAISYUI_INCLUDE_EXAMPLES=false` disables extra examples.
- `DAISYUI_MAX_EXAMPLES_PER_COMPONENT=8` controls how many examples are embedded per component.
- `DAISYUI_MAX_EXAMPLE_LENGTH=4000` limits per-example character length.
- `DAISYUI_FETCH_CONCURRENCY=4` controls fetch parallelism.
- `DAISYUI_FETCH_TIMEOUT_MS=15000` controls per-page fetch timeout.

## Optional: Worker types

```txt
npm run cf-typegen
```
