# Deployment

This project is currently a static web app: `index.html`, `styles.css`, and `app.js`.

## Recommended Simple Option: GitHub Pages

1. Create a new public GitHub repository, for example `weatherlab`.
2. Push this directory to that repository.
3. In GitHub, open `Settings -> Pages`.
4. Under `Build and deployment`, choose `GitHub Actions`.
5. The included `.github/workflows/pages.yml` workflow will publish the static site after each push to `main`.

The workflow also sets `enablement: true` on `actions/configure-pages`, so it can create the Pages site on first run if repository permissions allow it. If GitHub still returns `Get Pages site failed`, set the Pages source to `GitHub Actions` manually in the repository settings and rerun the workflow.

GitHub will publish the site at a URL like:

```text
https://YOUR-USERNAME.github.io/weatherlab/
```

For this repository, the expected URL is:

```text
https://matteosaccardi.github.io/weatherlab/
```

## Netlify

1. Create a new Netlify site from the Git repository.
2. Build command: leave empty.
3. Publish directory: `.`

## Vercel

1. Import the Git repository into Vercel.
2. Framework preset: `Other`.
3. Build command: leave empty.
4. Output directory: `.`

## Cloudflare Pages

1. Create a Pages project from the Git repository.
2. Framework preset: `None`.
3. Build command: leave empty.
4. Output directory: `.`

## Notes

- The app calls public Open-Meteo APIs from the browser.
- No API key is currently required.
- If a future source requires an API key, a public static-only deployment should not embed a private key in `app.js`; use a small backend or serverless proxy.
