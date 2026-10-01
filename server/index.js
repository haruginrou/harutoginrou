import { STATIC_ASSETS } from './static-assets.js';

const OWNER_EMAIL = 'haruto.ginrou@gmail.com';

const DEFAULT_CONTENT = {
  general: {
    seoTitle: 'Haruto Ginrou | EN/PT Wolf VTuber & Streamer',
    seoDescription: 'Meet Haruto Ginrou, an independent English and Portuguese silver wolf VTuber. Watch gaming livestreams, anime talk, highlights and community chaos.',
    heroEyebrow: 'Independent VTuber',
    heroTagline: 'MYTHICAL SILVER WOLF.\nUNFILTERED DIGITAL CHAOS.',
    aboutHeading: 'Gaming at full volume.\nAnime talk without a timer.',
    aboutPrimary: 'Haruto Ginrou is an independent English and Portuguese VTuber—a mythical silver wolf built for chaotic live sessions, sharp reactions and the kind of late-night conversations that refuse to end.',
    aboutSecondary: 'Expect competitive FPS, long-form RPG and MMO adventures, strategy, gacha pulls, horror, collabs and community-powered detours.'
  },
  schedule: [
    { label: 'LIVE', title: 'STREAM NIGHTS', timing: 'Multiple times weekly', url: 'https://x.com/HarutoGinrou', linkLabel: 'See announcements' },
    { label: 'CUTS', title: 'CLIPS + SHORTS', timing: 'Drops between streams', url: 'https://www.youtube.com/channel/UCv1nqSNDlurm3SZxLqxv2sA', linkLabel: 'Open YouTube' },
    { label: 'EVENT', title: 'COLLABS + SPECIALS', timing: 'Announced as they land', url: 'https://x.com/HarutoGinrou', linkLabel: 'Follow updates' }
  ],
  videos: [
    { title: 'Latest chaos on YouTube', description: 'Fresh stream cuts, highlights and shorts from the wolf den.', url: 'https://www.youtube.com/channel/UCv1nqSNDlurm3SZxLqxv2sA' }
  ],
  news: [
    { date: 'WEEKLY', title: 'Schedule drops on X', excerpt: 'Follow for stream times, collabs and last-minute changes.', url: 'https://x.com/HarutoGinrou' }
  ],
  socials: [
    { label: 'TWITCH', subtitle: 'Live streams', url: 'https://www.twitch.tv/harutoginrou' },
    { label: 'YOUTUBE', subtitle: 'Videos + shorts', url: 'https://www.youtube.com/channel/UCv1nqSNDlurm3SZxLqxv2sA' },
    { label: 'X / TWITTER', subtitle: '@HarutoGinrou', url: 'https://x.com/HarutoGinrou' },
    { label: 'VTUBIE', subtitle: 'Creator profile', url: 'https://vtubie.com/haruto-ginrou/' }
  ]
};

const securityHeaders = {
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-src https://player.twitch.tv; connect-src 'self' https://decapi.me; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY'
};

const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...securityHeaders }
});

const page = (title, heading, body, action, status = 200) => new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title>
<style>html{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:2rem;background:radial-gradient(circle at 70% 10%,#3a176a,transparent 36%),#08051a;color:#f6f3ff;font:16px/1.6 system-ui,sans-serif}.card{width:min(560px,100%);padding:3rem;border:1px solid #ffffff24;background:#0f0a28dd;box-shadow:20px 20px 0 #b15cff24}.mark{display:grid;place-items:center;width:42px;height:42px;margin-bottom:2rem;background:linear-gradient(135deg,#7147e8,#d653d9);font-weight:800;transform:skew(-8deg)}h1{margin:0 0 1rem;font-size:clamp(2.5rem,9vw,5rem);line-height:.9}p{color:#aaa4bf}.button{display:inline-flex;margin-top:1.5rem;padding:.9rem 1.2rem;background:linear-gradient(135deg,#8557ee,#d653d9);color:#fff;text-decoration:none;font-weight:700}.back{display:inline-block;margin-left:1rem;color:#76f7e7;text-decoration:none}</style></head>
<body><main class="card"><div class="mark">HG</div><h1>${heading}</h1><p>${body}</p>${action}</main></body></html>`, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...securityHeaders } });

const authenticatedEmail = (request) => (request.headers.get('oai-authenticated-user-email') || '').trim().toLowerCase();
const isOwner = (request) => authenticatedEmail(request) === OWNER_EMAIL;

const initialize = async (db) => {
  await db.exec('CREATE TABLE IF NOT EXISTS site_content (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, updated_at TEXT NOT NULL)');
  await db.prepare('INSERT OR IGNORE INTO site_content (id, data, updated_at) VALUES (1, ?, ?)')
    .bind(JSON.stringify(DEFAULT_CONTENT), new Date().toISOString()).run();
};

const getContent = async (db) => {
  await initialize(db);
  const row = await db.prepare('SELECT data FROM site_content WHERE id = 1').first();
  if (!row?.data) return DEFAULT_CONTENT;
  const stored = JSON.parse(row.data);
  return { ...DEFAULT_CONTENT, ...stored, general: { ...DEFAULT_CONTENT.general, ...stored.general } };
};

const cleanText = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const cleanUrl = (value) => {
  const text = cleanText(value, 500);
  if (!text) return '';
  try {
    const url = new URL(text);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
};

const sanitizeContent = (input) => ({
  general: {
    seoTitle: cleanText(input?.general?.seoTitle, 65),
    seoDescription: cleanText(input?.general?.seoDescription, 170),
    heroEyebrow: cleanText(input?.general?.heroEyebrow, 80),
    heroTagline: cleanText(input?.general?.heroTagline, 180),
    aboutHeading: cleanText(input?.general?.aboutHeading, 180),
    aboutPrimary: cleanText(input?.general?.aboutPrimary, 700),
    aboutSecondary: cleanText(input?.general?.aboutSecondary, 700)
  },
  schedule: (Array.isArray(input?.schedule) ? input.schedule : []).slice(0, 12).map(item => ({
    label: cleanText(item?.label, 30), title: cleanText(item?.title, 100), timing: cleanText(item?.timing, 100),
    url: cleanUrl(item?.url), linkLabel: cleanText(item?.linkLabel, 60)
  })),
  videos: (Array.isArray(input?.videos) ? input.videos : []).slice(0, 12).map(item => ({
    title: cleanText(item?.title, 160), description: cleanText(item?.description, 400), url: cleanUrl(item?.url)
  })),
  news: (Array.isArray(input?.news) ? input.news : []).slice(0, 20).map(item => ({
    date: cleanText(item?.date, 50), title: cleanText(item?.title, 160), excerpt: cleanText(item?.excerpt, 500), url: cleanUrl(item?.url)
  })),
  socials: (Array.isArray(input?.socials) ? input.socials : []).slice(0, 12).map(item => ({
    label: cleanText(item?.label, 60), subtitle: cleanText(item?.subtitle, 100), url: cleanUrl(item?.url)
  }))
});

const withSecurityHeaders = (response) => {
  const secured = new Response(response.body, response);
  Object.entries(securityHeaders).forEach(([key, value]) => secured.headers.set(key, value));
  return secured;
};

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const home = async (env) => {
  let content = DEFAULT_CONTENT;
  if (env.DB) {
    try { content = await getContent(env.DB); } catch { /* Use crawlable defaults. */ }
  }
  const title = escapeHtml(content.general.seoTitle || DEFAULT_CONTENT.general.seoTitle);
  const description = escapeHtml(content.general.seoDescription || DEFAULT_CONTENT.general.seoDescription);
  const html = STATIC_ASSETS['/index.html'].text
    .replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(">)/, (_, before, after) => `${before}${description}${after}`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, (_, before, after) => `${before}${title}${after}`)
    .replace(/(<meta property="og:description" content=")[^"]*(">)/, (_, before, after) => `${before}${description}${after}`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, (_, before, after) => `${before}${title}${after}`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(">)/, (_, before, after) => `${before}${description}${after}`);
  return withSecurityHeaders(new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' }
  }));
};

const asset = async (request, env, pathname) => {
  const file = STATIC_ASSETS[pathname];
  if (!file) return page('Not found', 'Page not found', 'The page you requested does not exist.', '<a class="back" href="/">Return home</a>', 404);
  const body = file.text ?? Uint8Array.from(atob(file.base64), character => character.charCodeAt(0));
  const response = new Response(body, {
    headers: {
      'content-type': file.type,
      'cache-control': pathname.endsWith('.html') ? 'no-store' : 'public, max-age=86400'
    }
  });
  return withSecurityHeaders(response);
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const email = authenticatedEmail(request);

    if (url.pathname === '/api/content' && request.method === 'GET') {
      if (!env.DB) return json(DEFAULT_CONTENT);
      try { return json(await getContent(env.DB)); }
      catch { return json(DEFAULT_CONTENT); }
    }

    if (url.pathname === '/api/admin/content') {
      if (!email) return json({ error: 'authentication_required' }, 401);
      if (!isOwner(request)) return json({ error: 'forbidden' }, 403);
      if (!env.DB) return json({ error: 'database_unavailable' }, 503);
      if (request.method === 'GET') {
        try { return json({ ...(await getContent(env.DB)), owner: OWNER_EMAIL }); }
        catch { return json({ error: 'content_unavailable' }, 500); }
      }
      if (request.method === 'PUT') {
        const origin = request.headers.get('origin');
        if (origin && origin !== url.origin) return json({ error: 'invalid_origin' }, 403);
        const length = Number(request.headers.get('content-length') || 0);
        if (length > 100_000) return json({ error: 'payload_too_large' }, 413);
        try {
          const content = sanitizeContent(await request.json());
          await initialize(env.DB);
          await env.DB.prepare('UPDATE site_content SET data = ?, updated_at = ? WHERE id = 1')
            .bind(JSON.stringify(content), new Date().toISOString()).run();
          return json({ ok: true, content });
        } catch { return json({ error: 'invalid_content' }, 400); }
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      if (!email) return page('Owner sign in', 'Owner access', 'Sign in with the ChatGPT account connected to haruto.ginrou@gmail.com to open the control room.', '<a class="button" href="/signin-with-chatgpt">Sign in with ChatGPT</a><a class="back" href="/">Back to site</a>');
      if (!isOwner(request)) return page('Access denied', 'Not authorized', 'This account does not have access to Haruto Ginrou’s control room.', '<a class="button" href="/signout-with-chatgpt">Use another account</a><a class="back" href="/">Back to site</a>', 403);
      return asset(request, env, '/admin.html');
    }

    if (url.pathname === '/') return home(env);
    if (url.pathname === '/index.html') return Response.redirect(`${url.origin}/`, 301);
    if (url.pathname === '/admin.html') return Response.redirect(`${url.origin}/admin`, 302);
    return asset(request, env, url.pathname);
  }
};
