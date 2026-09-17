// functions/api/status.js
// Cloudflare Pages Function -- handles GET (read current phase statuses)
// and POST (save updated statuses) against a Workers KV namespace.
//
// Requires:
//   1. A KV namespace created and bound to this Pages project as ROADMAP_KV
//      (Cloudflare dashboard: Workers & Pages -> your project -> Settings ->
//      Functions -> KV namespace bindings -> variable name "ROADMAP_KV")
//   2. An environment variable EDIT_TOKEN set as a Secret (Settings ->
//      Environment variables -> Add variable -> Encrypt) -- this is the
//      password that gates who can save changes. Anyone can still GET
//      (view) the page; only someone with this token can POST (edit).

const KV_KEY = "roadmap-phases";

export async function onRequestGet(context) {
  const { env } = context;
  const stored = await env.ROADMAP_KV.get(KV_KEY);

  if (!stored) {
    return new Response(JSON.stringify({ phases: null }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(stored, {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const token = request.headers.get("X-Edit-Token");
  if (!token || token !== env.EDIT_TOKEN) {
    return new Response(JSON.stringify({ error: "Invalid or missing edit token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.phases || !Array.isArray(body.phases)) {
    return new Response(JSON.stringify({ error: "Body must include a 'phases' array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await env.ROADMAP_KV.put(KV_KEY, JSON.stringify({ phases: body.phases }));

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
