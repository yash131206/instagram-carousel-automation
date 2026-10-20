# Instagram Carousel Automation — Setup Guide

Ye guide tumhe zero-cost setup ke through le jaayegi: **Google Sheet → n8n (tumhara tablet) → Instagram carousel publish**. Volume ke hisaab se (8 carousels/month, 5–8 slides each) sab kuch free tiers me fit ho jaata hai.

Files jo tumhe mili hain:
- `instagram-carousel-publisher.json` — n8n workflow (import karo)
- `carousel-sheet-template.csv` — Google Sheet ka structure
- `setup-guide.md` — yahi document

---

## Kaam kaise karega

1. Tum Google Sheet me har carousel ki row bharo — caption + slide image URLs, aur status `ToDo`.
2. n8n (schedule par) us sheet ko padhta hai.
3. Har slide ka Instagram *child container* banata hai, phir unhe jod kar ek *carousel container*, phir publish karta hai.
4. Sheet me status `Done` + post ka permalink likh deta hai.

Ek baar set ho gaya, to tumhe sirf sheet bharni hai — posting khud ho jaayegi.

---

## Kya chahiye (checklist)

- [ ] Instagram **Business ya Creator** account, ek Facebook Page se linked
- [ ] Meta Developer app + **long-lived access token** (`instagram_content_publish` scope ke saath)
- [ ] Tumhara **Instagram User ID**
- [ ] Ek Google Sheet (template CSV se banao)
- [ ] Images ke liye **public HTTPS URLs** (Cloudinary free tier recommended)
- [ ] n8n chalu, tablet par (self-hosted)

---

## Step 1 — Meta app, IG ID aur token

1. **IG ko Business/Creator banao** aur usse ek Facebook Page se link karo (Instagram app → Settings → Account type).
2. [developers.facebook.com](https://developers.facebook.com) par jao → **Create App** → type **Business**.
3. App me **Instagram** product add karo (aur **Facebook Login**).
4. **Instagram User ID** nikaalo — Graph API Explorer me chalao:
   ```
   GET /me/accounts?fields=name,instagram_business_account
   ```
   Jis Page se tumhara IG juda hai, uske `instagram_business_account.id` ko copy karo — **yahi tumhara IG User ID hai**.
5. **Token banao** — Graph API Explorer me ye scopes select karo:
   `instagram_basic`, `pages_show_list`, `instagram_content_publish`, `pages_read_engagement`
   Phir **Generate Access Token** dabao aur token copy karo.
6. **Long-lived token me badlo** (60 din chalta hai):
   ```
   GET https://graph.facebook.com/v21.0/oauth/access_token
        ?grant_type=fb_exchange_token
        &client_id=APP_ID
        &client_secret=APP_SECRET
        &fb_exchange_token=SHORT_LIVED_TOKEN
   ```
   *Behtar option:* Meta Business Manager me ek **System User** banao aur uska token use karo — woh **expire nahi hota**, to har 60 din refresh karne ki tension nahi.

> Dhyan: token ko kabhi workflow me hardcode na karo. Isko n8n credentials me rakhna best practice hai (neeche Step 5 dekho).

---

## Step 2 — Google Sheet banao

1. Google Sheets me naya spreadsheet banao.
2. `carousel-sheet-template.csv` ko **File → Import → Upload** se import karo (ya columns manually banao).
3. Columns yahi hone chahiye (naam exactly same):

   `id` · `status` · `caption` · `slide_1` … `slide_8` · `media_id` · `permalink`

4. Har carousel ke liye ek row bharo:
   - `id` — koi unique number (1, 2, 3…)
   - `status` — `ToDo` (jab post karna ho)
   - `caption` — Instagram caption (2200 char tak)
   - `slide_1` … `slide_8` — har slide ka public image URL
   - `media_id`, `permalink` — khaali chhodo, workflow khud bhar dega

---

## Step 3 — Images ko public URL do

Instagram ko images ek **public HTTPS URL** se chahiye — file upload ya base64 accept nahi karta.

**Sabse aasan:** Cloudinary (free plan, 25 credits/month — tumhare volume ke liye kaafi).
1. [cloudinary.com](https://cloudinary.com) par free account banao.
2. Images upload karo.
3. Har image ka **delivery URL** copy karo (kuch aisa: `https://res.cloudinary.com/<cloud>/image/upload/v123/slide1.jpg`).
4. Woh URL sheet ke `slide_N` column me paste karo.

> Agar slides tum **AI Studio me manually** bana rahe ho (Gemini Pro se), to wahan se images download karke Cloudinary par upload kar do. Isse AI ka API kharcha **₹0** rehta hai.

---

## Step 4 — n8n me import karo

1. n8n kholo → **Workflows → Import from File** → `instagram-carousel-publisher.json` select karo.
2. **Config** node kholo aur do value bharo:
   - `igUserId` → tumhara Instagram User ID (Step 1 se)
   - `accessToken` → tumhara long-lived token
3. **Get Pending Posts** aur **Mark Done** node kholo → apni Google Sheet ka **Document ID** daalo (sheet ke URL me `/d/` ke baad ka lamba code).
4. Dono Google Sheets nodes me apna **Google Sheets credential** attach karo (Step 5).

---

## Step 5 — Credentials

**Google Sheets:** n8n → Credentials → New → *Google Sheets OAuth2 API* → sign in karo. (Ye ek baar ka kaam hai.)

**Meta token (behtar practice):** Config node me token daalne ki jagah, ek **Header/Query Auth credential** banao aur use karo. Warna kam se kam Config node me rakho — code me hardcode mat karo.

---

## Step 6 — Test karo, phir chalu karo

1. Sheet me **ek** row `ToDo` rakho, baaki `Done` ya khaali.
2. n8n me **Schedule Trigger** ko temporarily hatao aur **Manual Trigger** laga kar ek baar chalao (ya Schedule Trigger par "Execute Workflow" dabao).
3. Check karo:
   - Execution green hui?
   - Instagram par carousel live aaya?
   - Sheet row `Done` hui + `permalink` bhara?
4. Sab theek ho to workflow ko **Active** kar do. Schedule ab roz subah 9 baje chalega (time badalna ho to Schedule Trigger edit karo).

---

## Tablet par reliable rakhne ke tips

Android background apps ko maar deta hai — isliye:

- n8n ko **PM2** ya **screen/tmux** me chalao taaki crash par auto-restart ho.
- **Termux:Boot** lagao taaki tablet restart par n8n khud start ho.
- Termux ko **battery optimization se exclude** karo.
- `termux-wake-lock` on rakho, aur tablet **charged + wifi** par rakho.
- Apne workflows **regularly export** karo (Settings → Workflows → Export) — tablet kharab hua to backup rahega.

**Webhook chahiye?** n8n ka built-in `--tunnel` band ho gaya hai. Cloudflare Tunnel (free) ya ngrok use karo. Par tumhare setup me zarurat nahi — sab kuch outbound hai.

---

## Kharcha (8 carousels/month ≈ 40–64 slides)

| Cheez | Kharcha | Kyun |
|---|---|---|
| n8n (tablet) | ₹0 | self-hosted |
| Instagram publish | ₹0 | Meta API free |
| Google Sheets | ₹0 | free |
| Cloudinary hosting | ₹0 | free tier me fit |
| Caption/text AI (optional) | ₹0 | Gemini free tier |
| Slide images AI (optional) | ~₹155–190/mo | Gemini Pro ke $10 Cloud credit se cover |

**Asli jeb se: ₹0.**

---

## Troubleshooting

- **"Carousel ke liye kam se kam 2 slides chahiye"** — sheet me kam se kam 2 `slide_N` URLs bharo.
- **Publish fail / permission error** — token me `instagram_content_publish` scope hai? IG account Business/Creator hai?
- **Image error** — URL public HTTPS hai? Cloudinary URL browser me khulta hai?
- **"Invalid OAuth access token"** — token expire ho gaya (60 din). Long-lived refresh karo ya System User token use karo.
- **Schedule miss ho gaya** — tablet soya tha. PM2 + wake-lock + battery exclusion check karo.

---

## Aage kya (optional)

Agar slides auto-generate karne hain, to **Config** se pehle ek chhota branch jod sakte ho:
- Gemini API se caption banao (free tier)
- Nano Banana se slide images banao (~₹0.034/image)
- Images Cloudinary par upload karo, URL sheet me likho

Par tumhare volume par **manual AI Studio route (₹0)** sabse sasta hai. Bolo, to woh branch bhi bana deta hoon.
