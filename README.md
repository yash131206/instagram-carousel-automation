# Instagram Carousel Automation

Zero-cost automation to publish **Instagram carousel posts** from a **Google Sheet**, using **n8n** (self-hosted) and the **Instagram API with Instagram Login** (`graph.instagram.com`) - no Facebook Page needed.

Built for a low-volume creator setup: ~8 carousels/month, 5-8 slides each.

## What's inside

| File | What it is |
|---|---|
| `instagram-carousel-publisher.json` | n8n workflow - import this |
| `carousel-sheet-template.csv` | Google Sheet structure to copy |
| `setup-guide.md` | Full step-by-step setup guide |

## How it works

1. Fill one row per carousel in a Google Sheet - caption + slide image URLs, status `ToDo`.
2. n8n runs twice a week (Mon & Thu, 9 AM) and picks up **one** pending carousel per run.
3. For each slide it creates a child media container, assembles them into a `CAROUSEL` container, waits, then publishes.
4. It writes `Done` + the post permalink back to the sheet.

## Quick start

1. Follow `setup-guide.md`.
2. Import `instagram-carousel-publisher.json` into n8n.
3. In the **Config** node fill `igUserId` and `accessToken` (leave `apiBase` as is).
4. Point the Google Sheets nodes at your sheet and attach your credential.
5. Test, then set the workflow to **Active**.

## Notes

- Uses the **Instagram Login** path (`graph.instagram.com`) with `instagram_business_*` permissions - a Facebook Page is **not** required.
- The workflow ships with **placeholders only** - no credentials are included. Put your token in n8n, never in the file.
- Instagram requires **public HTTPS image URLs** (Cloudinary or similar).
- If n8n runs on a tablet/Android, keep it alive with PM2 + `termux-wake-lock` (see the guide).

## Cost

n8n (self-hosted), the Instagram API, Google Sheets, and Cloudinary's free tier all come to **zero**. Optional AI slide generation is a few rupees/month, covered by the Google AI Pro $10 Cloud credit.
