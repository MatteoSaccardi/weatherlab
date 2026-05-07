# Deployment

This project is currently a static web app: `index.html`, `styles.css`, and `app.js`.

## Recommended Simple Option: GitHub Pages

1. Create a new public GitHub repository, for example `weather-mcmc-lab`.
2. Push this directory to that repository.
3. In GitHub, open `Settings -> Pages`.
4. Under `Build and deployment`, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Save.

GitHub will publish the site at a URL like:

```text
https://YOUR-USERNAME.github.io/weather-mcmc-lab/
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

