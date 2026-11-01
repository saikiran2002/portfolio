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

Photo (`Profile.jpeg`), CV (`saikiran-resume.pdf`), and News photos/videos live in `public/`. Keep media small before adding it — e.g. resize photos to ~2000px on the long side (`sips -Z 2000 -s formatOptions 80 photo.jpeg`) and re-encode videos to 720p (`ffmpeg -i in.mp4 -vf scale=-2:720 -crf 26 -movflags +faststart out.mp4`).

## Performance notes

- Scroll reveals animate only `transform` and `opacity` (GPU-composited, no layout thrash)
- Theme is set before first paint (no flash), persisted in localStorage
- `prefers-reduced-motion` is respected (animations disabled)
