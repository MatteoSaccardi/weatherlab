# WeatherLab

A static browser app for two-day probabilistic weather forecasts around Fort Collins, Colorado and Lombardia, Italy.

The app fetches public weather forecasts from Open-Meteo, then applies a transparent posterior predictive uncertainty model to produce sampled trajectories, median curves, and credible bands.

## Run Locally

```bash
source .venv/bin/activate
python -m http.server 8000
```

Open:

```text
http://localhost:8000/
```

The app can also be opened directly from `index.html`, but a local server is closer to public-hosting behavior.

## Python Checks

```bash
source .venv/bin/activate
python scripts/check_open_meteo.py
```

## Deployment

This is a static site. It can be hosted without a backend on GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any ordinary static web host.

The site entry point is:

```text
index.html
```

No build command is required.

Expected GitHub Pages URL:

```text
https://MatteoSaccardi.github.io/weatherlab/
```
