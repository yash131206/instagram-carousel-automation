# Instagram Carousel Automation — Setup Guide

**Raasta:** Instagram API with **Instagram Login** (`graph.instagram.com`) — isme Facebook Page ki zarurat nahi.
**Volume:** 8 carousels/month (Somvaar + Guruvaar, 9 AM) → ~₹0/month.
**Platform:** n8n self-hosted (tumhara tablet).

Files:
- `carousel-workflow-shortbamboo.json` — n8n workflow (import karo)
- `carousel-sheet-template.csv` — Google Sheet ka structure
- `setup-guide.md` — yahi document

---

## Kaam kaise karega

1. Google Sheet me har carousel ki row bharo — caption + slide image URLs, status `ToDo`.
2. n8n (Somvaar/Guruvaar 9 AM) sheet padhta hai aur **ek** pending carousel uthati hai.
3. Har slide ka child container → phir parent `CAROUSEL` container → wait → publish.
4. Sheet me status `Done` + permalink likh deta hai.

---

## Part 1 — Meta app + Instagram Login (tumne kar liya)

Reference ke liye, jo steps tumne kiye:

1. Instagram ko **Business/Creator** banaya (Settings → Account type and tools).
2. [developers.facebook.com](https://developers.facebook.com) → **Create App** → type **Business** → use case **"Manage messaging & content on Instagram"** → business portfolio **ShortBamboo**.
3. App ke andar **API setup with Instagram login**.
4. **Permissions and features** me `instagram_business_content_publish` (aur `instagram_business_basic`) add kiya.
5. **Roles → Instagram Tester** me apna account add kiya + Instagram app me invite accept kiya.
6. App ko **Live** kiya (App settings → Basic me Privacy Policy URL + Category bhar ke, Publish).
7. **Generate token** → Instagram par **Allow** → token mila.

> Note: ye raasta `graph.instagram.com` use karta hai aur `instagram_business_*` permissions maangta hai — Facebook Page ki zarurat nahi.

---

## Part 2 — Token aur IG User ID

- **Access token** — `IGAA...` se shuru hone wala lamba string (~60 din chalta hai).
- **IG User ID** — ye nikalne ke liye ye URL chalao (browser ya curl):
  `https://graph.instagram.com/v23.0/me
  Jawab me **`id`** field hi `igUserId` hai (jaise `28732317453043416`).

  ⚠️ **Zaroori:** `user_id` (jaise `17841484077985141`) **mat** use karo — Content Publishing API ke liye woh galat hai aur `500` error deta hai. Sirf **`id`** use karo.

  Example jawab:
  `{"user_id":"17841484077985141","username":"shortbamboo.in","id":"28732317453043416"}`
  → `igUserId` = **28732317453043416**

> Dono secret hain. Kisi file/URL/screenshot me na daalo — sirf n8n ke Config node me.

---

## Part 3 — n8n setup

1. n8n → **Workflows → Import from File** → `carousel-workflow-shortbamboo.json`.
2. **Config** node kholo aur bharo:
   - `igUserId` → numeric IG User ID
   - `accessToken` → `IGAA...` token
   - `apiBase` → `https://graph.instagram.com/v23.0` (jaisa hai rehne do)
3. **Get Pending Posts** aur **Mark Done** node kholo → dono me apna **Google Sheets credential** attach karo (n8n → Credentials → New → Google Sheets OAuth2 API).
4. Dono Sheets nodes me **Document ID** aur **tab name** check kar lo.

Workflow ka flow:
`Schedule Trigger → Config → Get Pending Posts → One Per Run → Loop Carousels → Publish Carousel → Mark Done`

- **One Per Run** — har run me sirf **ek** carousel post hoti hai (saare ek saath nahi).

---

## Part 4 — Google Sheet

Columns (naam exactly same):
`id` · `status` · `caption` · `slide_1` … `slide_8` · `media_id` · `permalink`

Har carousel ke liye ek row:
- `id` — unique number
- `status` — `ToDo`
- `caption` — Instagram caption (2200 char tak)
- `slide_1` … `slide_8` — har slide ka **public HTTPS URL**
- `media_id`, `permalink` — khaali chhodo

**Images public HTTPS par honi chahiye** (Instagram file upload accept nahi karta). Cloudinary free tier recommended.

---

## Part 5 — Test aur activate

1. Sheet me **ek** test row `ToDo` rakho (2-8 slide URLs).
2. n8n me **Execute Workflow** chalao.
3. Check: execution green? Instagram par carousel live? sheet row `Done`?
4. Sab theek → workflow **Active** kar do.

---

## Tablet par reliable rakhne ke tips

Android background apps ko maar deta hai:
- n8n ko **PM2** ya **screen/tmux** me chalao (auto-restart).
- **Termux:Boot** lagao (restart par khud start).
- Termux ko **battery optimization se exclude** karo.
- `termux-wake-lock` on rakho; tablet charged + wifi par.
- Workflows **regularly export** karo (backup).

---

## Troubleshooting

- **Token generate nahi ho raha / Allow ke baad redirect nahi** — popup block ho raha hai. Browser me `developers.facebook.com` ke liye popups allow karo; incognito me try karo; Instagram app ke bajaye browser me login karo.
- **"Carousel ke liye kam se kam 2 slides chahiye"** — sheet me kam se kam 2 `slide_N` URLs bharo.
- **Publish fail / permission error** — token me `instagram_business_content_publish` hai? account Business/Creator hai?
- **Image error** — URL public HTTPS hai? browser me khulta hai?
- **"Invalid OAuth access token"** — token expire (60 din). Dobara generate karo.
- **Schedule miss** — tablet soya tha. PM2 + wake-lock + battery exclusion check karo.

---

## Kharcha (8 carousels/month ≈ 40–64 slides)

| Cheez | Kharcha |
|---|---|
| n8n (tablet) | ₹0 |
| Instagram publish | ₹0 |
| Google Sheets | ₹0 |
| Cloudinary hosting | ₹0 (free tier) |
| Slides (manual AI Studio) | ₹0 |
| Slides (AI auto-gen) | ~₹155–190/mo (Google AI Pro $10 credit se cover) |

**Asli jeb se: ₹0.**
