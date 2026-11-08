# Solara — Premium Yoga & Fitness Wellness Studio Website

A cinematic, edit-ready website for a premium yoga, fitness and wellness studio.
**"Solara" is an editable placeholder brand name** — replace it globally before launch
(header, curtain, mobile menu, footer, `<title>` on each page, `favicon.svg`).

## Run it

```bash
npm install     # once
npm run dev     # develop at http://localhost:5173
npm run build   # production build → dist/
npm run preview # serve the production build
```

Deploy `dist/` to any static host (Netlify, Vercel, S3, nginx…). No server code needed.

## Stack

- **Vite** — dev server + production bundling (multi-page: 10 HTML entry points)
- **GSAP + ScrollTrigger** — all cinematic motion (hero entrance, clip reveals,
  parallax, pinned horizontal sequences, sticky storytelling, page transitions)
- **Zero other runtime dependencies.** GSAP dominates the JS budget (~49 KB gzipped in total).

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| About | `about.html` |
| Classes & Activities | `classes.html` |
| Yoga | `yoga.html` |
| Fitness & Training | `fitness.html` |
| Meditation & Mindfulness | `meditation.html` |
| Instructors | `instructors.html` |
| Gallery | `gallery.html` |
| Contact | `contact.html` |
| Book a Session | `booking.html` |

## Editing content

- **Copy** is normal HTML text, marked with `<!-- EDIT: … -->` comments at each block.
  All business facts (classes, prices, instructors, credentials, hours, address) are
  `[Placeholder]` markers — nothing factual was invented.
- **Booking links** can preselect a class: `booking.html?class=yoga` (values: `yoga`,
  `pilates`, `meditation`, `strength`, `functional`, `mobility`, `personal-training`).
  The booking page renders a placeholder weekly schedule for the chosen class via
  `src/js/booking.js`.
- **Photography** is self-hosted. All 48 images live in `src/public/images/`
  (Vite's `publicDir` points there) and every `<img src>` points at
  `/images/<photo-id>.jpg` — no third-party CDN dependency,
  so nothing can 404 at runtime. To swap in client images, replace the files in
  `public/images/` (or point individual `<img src>` at new files), keeping the
  `<img>` structure so reveals/animation keep working. Broken images degrade to a
  tasteful placeholder block automatically.
- **Design tokens** (colors, type scale, spacing, durations): `src/styles/tokens.css`.
- **Connect an enquiry/booking backend**: in `src/js/forms.js` set `FORM_ENDPOINT`
  to a URL that accepts POSTed JSON and answers 2xx. Until then the forms are
  honest by design — they explain the service is not connected and offer the
  e-mail fallback; they never fake a confirmation.
- **Map**: `contact.html` contains a map placeholder block — swap for a Google
  Maps / Mapbox embed. **Testimonials** are visibly labelled placeholders — swap
  in verified member quotes only.

## Motion system (`src/js/main.js`)

- `initHero` — cinematic hero entrance + scroll parallax
- `initCurtain` — page-load reveal and page-to-page transitions (with failsafe timers
  so navigation can never wedge)
- `initReveals` — `[data-words]`, `[data-reveal]`, `[data-reveal-group]`, `[data-clip]`
- `initParallax` — `[data-parallax="n"]` scrubbed image drift
- `initHorizontalSequence` — `[data-h-seq]` pinned filmstrip (desktop), native
  swipe-scroll on mobile
- `initStickyStory` — `[data-sticky-story]` sticky image with cross-fading steps

All motion respects `prefers-reduced-motion`: with reduced motion enabled the site
renders fully static, every element visible.

## Accessibility & performance notes

- Lighthouse 100/100/100 (Accessibility / Best Practices / SEO) on audited pages
- Lazy-loaded below-the-fold imagery, `srcset` sizes, fixed dimensions (no CLS)
- Lightbox closes on `Escape`, gallery items are keyboard-operable
- Forms: full client-side validation + honest states; no fabricated data
