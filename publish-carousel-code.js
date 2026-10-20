// ===== Instagram Carousel Publisher (v2 - better errors + retry) =====
const cfg = $('Config').first().json;
const IG_ID = cfg.igUserId;
const TOKEN = cfg.accessToken;
const API = (cfg.apiBase || 'https://graph.instagram.com/v23.0').replace(/\/+$/, '');
const helpers = this.helpers;

// Jo carousel row aayi hai (Split In Batches, batchSize 1)
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

// Ek request bhejo; fail hone par Instagram ka asli jawab dikhao
async function call(method, path, params) {
  const qs = {};
  for (const k of Object.keys(params || {})) qs[k] = params[k];
  qs.access_token = TOKEN;

  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await helpers.httpRequest({ method, url: API + path, qs, json: true });
    } catch (e) {
      lastErr = e;
      const status = e && e.response && e.response.statusCode;
      if (status && status >= 500 && attempt === 1) { await wait(3000); continue; }
      break;
    }
  }

  let detail = '';
  try {
    const r = lastErr && lastErr.response;
    const d = r && (r.body || r.data);
    if (d) detail = (typeof d === 'string') ? d : JSON.stringify(d);
  } catch (_) {}
  throw new Error('[IG API ' + method + ' ' + path + '] ' + (detail || (lastErr && lastErr.message) || String(lastErr)));
}

// 1) Har slide ka child container (is_carousel_item = true)
const childIds = [];
for (const url of urls) {
  const res = await call('POST', '/' + IG_ID + '/media', { image_url: url, is_carousel_item: true });
  if (!res.id) throw new Error('Child container fail: ' + JSON.stringify(res));
  childIds.push(res.id);
}

// 2) Parent CAROUSEL container (caption sirf yahan)
const parent = await call('POST', '/' + IG_ID + '/media', {
  media_type: 'CAROUSEL',
  children: childIds.join(','),
  caption: row.caption || '',
});
if (!parent.id) throw new Error('Carousel container fail: ' + JSON.stringify(parent));

// 3) Instagram ko validate karne ka time do
await wait(10000);

// 4) Publish
const pub = await call('POST', '/' + IG_ID + '/media_publish', { creation_id: parent.id });
if (!pub.id) throw new Error('Publish fail: ' + JSON.stringify(pub));

// 5) Live post ka permalink (optional)
let permalink = '';
try {
  const info = await call('GET', '/' + pub.id, { fields: 'permalink' });
  permalink = info.permalink || '';
} catch (e) { /* optional */ }

return [{
  json: {
    id: row.id,
    mediaId: pub.id,
    permalink: permalink,
    slideCount: urls.length,
    publishedAt: new Date().toISOString(),
  },
}];
