# Saikiran's Portfolio

Personal academic portfolio — React 18 + TypeScript + Vite + Framer Motion.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo.
2. Run:

```bash
npm run deploy
```

This builds the site and publishes `dist/` to the `gh-pages` branch. Then in your repo: **Settings → Pages → Source: gh-pages branch**. The `base: './'` in `vite.config.ts` makes it work under any repo name.

## Editing content

All text lives in one typed file — `src/data/content.ts`: about, interests, publications, experience, education, news, contact.

Two things still to fill in there:

- Google Scholar URL (`socials`, currently `#`)
- Formspree form ID (`contact.formspreeId`) — sign up free at formspree.io to activate the contact form

Photo (`Profile.jpeg`) and CV (`saikiran-resume.pdf`) live in `public/`.

`static-version.html` is the old single-file version, kept as a backup — safe to delete.

## Performance notes

- Scroll reveals animate only `transform` and `opacity` (GPU-composited, no layout thrash)
- Theme is set before first paint (no flash), persisted in localStorage
- `prefers-reduced-motion` is respected (animations disabled)
