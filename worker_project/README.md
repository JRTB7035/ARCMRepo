# ARCM Roadmap — Cloudflare Worker deploy

This replaces the old `cf_project/` structure (that one was built for
classic Cloudflare Pages Functions, which is no longer what Cloudflare's
dashboard creates by default as of 2026 -- new projects go through the
unified Workers path instead, using `wrangler deploy`).

## What's different from before

- `functions/api/status.js` -> now `src/index.js` (one Worker script
  handling both the API route and serving the static page)
- `index.html` -> now lives in `public/index.html`
- New: `wrangler.jsonc` -- this is the config file that ties it together
  (which file is the Worker script, where the static assets are, which KV
  namespace to bind)

## Steps

**1. Replace your repo's contents** with this folder's contents (delete
the old `functions/` folder and root `index.html`, replace with
`src/`, `public/`, and `wrangler.jsonc` from here), then commit and push.

**2. Create the KV namespace** (one-time), from your terminal in this
project folder:

    npx wrangler kv namespace create ROADMAP_KV

This prints an `id`. Copy it into `wrangler.jsonc`, replacing
`<YOUR_KV_NAMESPACE_ID>`.

**3. Set your edit password** (one-time):

    npx wrangler secret put EDIT_TOKEN

It'll prompt you to type the password -- this is what "Update project
status" asks for on the live page.

**4. Deploy:**

    npx wrangler deploy

This reads `wrangler.jsonc`, uploads `src/index.js` plus everything in
`public/`, and gives you back a live URL
(`arcmrepo.<your-subdomain>.workers.dev`).

**5. Commit the updated `wrangler.jsonc`** (with the real KV namespace ID
filled in) and push -- since your repo is connected to Cloudflare's Git
integration, future pushes will auto-deploy from here on, and you won't
need to run `wrangler deploy` by hand again unless you want to.

## Testing it

- Open the live URL, confirm the page loads normally
- Click "Update project status," enter the password you set in step 3
- Toggle a status, click "Save changes" -- should show "Saved -- live for
  anyone viewing this page."
- Reload the page to confirm the change actually stuck
