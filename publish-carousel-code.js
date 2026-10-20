// ===== Instagram Carousel Publisher (v3 - auto-detect endpoint) =====
const cfg = $('Config').first().json;
const TOKEN = cfg.accessToken;
const helpers = this.helpers;

// API bases: with version + without version
const bases = [];
const b0 = (cfg.apiBase || 'https://graph.instagram.com/v23.0').replace(/\/+$/, '');
bases.push(b0);
const bNo = b0.replace(/\/v\d+(\.\d+)?$/, '');
if (bNo !== b0) bases.push(bNo);

const row = $input.first().json;

// Slide URLs ikattha karo: slide_1 ... slide_10
const urls = [];
for (let i = 1; i <= 10; i++) {
  const u = row['slide_' + i];
  if (u && String(u).trim() !== '') urls.push(String(u).trim());
}
if (urls.length < 2) throw new Error('Carousel ke liye kam se kam 2 slides chahiye (mila: ' + urls.length + ')');
if (urls.length > 10) urls.length = 10;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function errText(e) {
  const parts = [];
  try { const r = e && e.response; if (r) { if (r.body) parts.push(typeof r.body === 'string' ? r.body : JSON.stringify(r.body)); if (r.data) parts.push(typeof r.data === 'string' ? r.data : JSON.stringify(r.data)); } } catch (_) {}
  try { if (e && e.error) parts.push(JSON.stringify(e.error)); } catch (_) {}
  try { if (e && e.message) parts.push(e.message); } catch (_) {}
  return parts.join(' | ') || String(e);
}

function req(base, method, path, params) {
  const qs = Object.assign({}, params || {}, { access_token: TOKEN });
  return helpers.httpRequest({ method, url: base + path, qs, json: true });
}

// Candidate user ids: config value + /me id + /me user_id + 'me'
const ids = [];
if (cfg.igUserId) ids.push(String(cfg.igUserId).trim());
for (const b of bases) {
  try {
    const me = await req(b, 'GET', '/me', { fields: 'id,user_id,username' });
    if (me && me.id) ids.push(String(me.id));
    if (me && me.user_id) ids.push(String(me.user_id));
  } catch (_) {}
}
ids.push('me');
const uniqIds = [...new Set(ids.filter(Boolean))];

// Probe: find a (base, id) combo that can create a container
let BASE = null, IG = null, firstChildId = null, lastMsg = '';
outer:
for (const b of bases) {
  for (const id of uniqIds) {
    try {
      const res = await req(b, 'POST', '/' + id + '/media', { image_url: urls[0], is_carousel_item: true });
      if (res && res.id) { BASE = b; IG = id; firstChildId = res.id; break outer; }
      lastMsg = 'No id in response: ' + JSON.stringify(res);
    } catch (e) {
      lastMsg = errText(e);
    }
  }
}
if (!BASE) throw new Error('Container create nahi hua. Last error: ' + lastMsg);

// Remaining children
const childIds = [firstChildId];
for (let i = 1; i < urls.length; i++) {
  const res = await req(BASE, 'POST', '/' + IG + '/media', { image_url: urls[i], is_carousel_item: true });
  if (!res || !res.id) throw new Error('Child fail: ' + JSON.stringify(res));
  childIds.push(res.id);
}

// Parent CAROUSEL container
const parent = await req(BASE, 'POST', '/' + IG + '/media', { media_type: 'CAROUSEL', children: childIds.join(','), caption: row.caption || '' });
if (!parent || !parent.id) throw new Error('Parent fail: ' + JSON.stringify(parent));

// Instagram ko validate karne ka time do
await wait(10000);

// Publish
const pub = await req(BASE, 'POST', '/' + IG + '/media_publish', { creation_id: parent.id });
if (!pub || !pub.id) throw new Error('Publish fail: ' + JSON.stringify(pub));

// Permalink (optional)
let permalink = '';
try { const info = await req(BASE, 'GET', '/' + pub.id, { fields: 'permalink' }); permalink = info.permalink || ''; } catch (_) {}

return [{ json: { id: row.id, mediaId: pub.id, permalink: permalink, slideCount: urls.length, usedBase: BASE, usedId: IG, publishedAt: new Date().toISOString() } }];
