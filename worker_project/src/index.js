// src/index.js
// Single Cloudflare Worker serving both the static roadmap page (via the
// ASSETS binding) and the /api/status endpoint (via KV) -- this replaces
// the old separate Pages Functions folder, since Cloudflare's dashboard
// now creates unified Worker projects by default rather than classic Pages.

const KV_KEY = "roadmap-phases";

async function handleStatusGet(env) {
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

async function handleStatusPost(request, env) {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/status") {
      if (request.method === "GET") return handleStatusGet(env);
      if (request.method === "POST") return handleStatusPost(request, env);
      return new Response("Method not allowed", { status: 405 });
    }

    // Everything else -- serve the static site (index.html, etc.) from
    // the assets binding configured in wrangler.jsonc.
    return env.ASSETS.fetch(request);
  },
};
