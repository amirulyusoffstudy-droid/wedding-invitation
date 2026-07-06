# Erni & Amirul — Digital Wedding Invitation

A mobile-first Malaysian wedding invitation, personal story, and practical guest guide for 26 December 2026. Built as a static React application suitable for Vercel.

## Stack

- React 19, TypeScript, Vite
- Plain responsive CSS and Lucide React icons
- Google Forms for RSVP (no backend)
- Local images under `public/images`

## Local development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Production checks:

```bash
npm run lint
npm run typecheck
npm run build
npm run preview
```

## Edit wedding details

All wedding content, URLs, contacts, images, and feature flags live in
`src/data/wedding.ts`. Search that file for `PLACEHOLDER`. Do not invent dates,
times, addresses, parent names, phone numbers, or private payment information.

Calendar downloads remain disabled until `event.startTime` and `event.endTime`
use 24-hour `HH:mm` values. The calendar uses `Asia/Kuala_Lumpur`.

## Replace photographs

1. Place optimized `.webp` or `.jpg` files in `public/images`.
2. Aim for under 300 KB per gallery image and roughly 500 KB for the hero.
3. Update `images.hero`, `images.closing`, and `gallery` in `wedding.ts`.
4. Keep accurate alt text and explicit image dimensions to reduce layout shift.
5. Replace `public/images/og-preview.jpg` with a 1200×630 social preview.

The current invitation uses selected couple photographs copied from `us/`.
Keep the originals in that folder; public-facing optimized copies live under
`public/images`.

## RSVP and wishes

Create a public Google Form with attendance, number of guests, dietary needs,
and an optional message. Paste its public response URL into `rsvp.formUrl`.
Keep `rsvp.wishesIncluded: true` when wishes are collected in the same form.
The site intentionally never displays fake submissions.

## Personalised guest links

Use `?to=` with URL-encoded text:

```text
https://amirul-erni.vercel.app/?to=Keluarga+Ahmad
```

JavaScript renders the value strictly as text, removes control characters,
normalises whitespace, and limits it to 80 characters. In WhatsApp, create a
link with:

```text
https://wa.me/?text=Jemputan%20untuk%20Keluarga%20Ahmad%3A%20https%3A%2F%2Famirul-erni.vercel.app%2F%3Fto%3DKeluarga%2BAhmad
```

## Maps, Waze, contact, and music

- Paste public destination URLs into `links.maps` and `links.waze`.
- Store phone numbers in Malaysian international format without `+`, spaces,
  or dashes, for example `60123456789`.
- Music is off by default. Add an owned/licensed local audio file, set
  `music.src`, `music.enabled`, and `features.music` to enable it. Playback only
  begins after opening the invitation and remembers mute state per session.
- Gifts remain hidden unless both `gifts.enabled` and `features.gifts` are true.
  Review payment details carefully before enabling.

## Deploy to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Vercel should detect Vite. Use build command `npm run build` and output
   directory `dist`.
4. Deploy, then assign `amirul-erni.vercel.app` if available.
5. Replace the Open Graph image and confirm its absolute URL in `index.html`.

No environment variables, paid features, dynamic routes, or `vercel.json` are
required.

## GitHub Pages

The included GitHub Actions workflow deploys `main` to:

```text
https://amirulyusoffstudy-droid.github.io/wedding-invitation/
```

It builds with `VITE_BASE_PATH=/wedding-invitation/`, so images and JavaScript
work correctly beneath the repository subpath.

## Privacy

Anything committed under `public` or `src/data/wedding.ts` is publicly
downloadable. Never add identity documents, private keys, banking credentials,
private forms, or payment details without the couple’s explicit approval.

## Remaining placeholders

- Both sets of parent names
- Event start/end and display time
- Venue and full address
- Dress code and RSVP deadline
- Google Maps and Waze URLs
- Google Form URL
- Relationship timeline dates
- Organiser names, roles, and phone numbers
- Every FAQ answer
- Final couple photographs and 1200×630 Open Graph artwork
- Optional licensed music
- Optional gift/bank/DuitNow details (feature disabled)
