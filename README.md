# Instagram Carousel Automation

Zero-cost automation to publish **Instagram carousel posts** from a **Google Sheet**, using **n8n** (self-hosted) and the **Meta Graph API**.

Built for a low-volume creator setup: ~8 carousels/month, 5-8 slides each.

## What's inside

| File | What it is |
|---|---|
| `instagram-carousel-publisher.json` | n8n workflow - import this |
| `carousel-sheet-template.csv` | Google Sheet structure to copy |
| `setup-guide.md` | Full step-by-step setup guide |

## How it works

1. Fill one row per carousel in a Google Sheet - caption + slide image URLs, status `ToDo`.
2. n8n reads the sheet on a schedule.
3. For each carousel it creates a child media container per slide, assembles them into a `CAROUSEL` container, waits, then publishes.
4. It writes `Done` + the post permalink back to the sheet.

## Quick start

1. Follow `setup-guide.md`.
2. Import `instagram-carousel-publisher.json` into n8n.
3. Fill the **Config** node with your IG User ID + long-lived access token.
4. Point the Google Sheets nodes at your sheet.
5. Test, then set the workflow to **Active**.

## Cost

n8n (self-hosted), Meta API, Google Sheets, Cloudinary free tier, and the Gemini text free tier all come to **zero**. Optional AI slide generation is a few rupees/month and is covered by the Google AI Pro $10 Cloud credit.

## Notes

- The workflow ships with **placeholders only** - no credentials are included. Put your token in an n8n credential, not in code.
- Instagram requires **public HTTPS image URLs** (Cloudinary or similar).
- If n8n runs on a tablet/Android, keep it alive with PM2 + `termux-wake-lock` (see the guide).
