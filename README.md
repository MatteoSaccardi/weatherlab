# WeatherLab

WeatherLab is a static browser app for two-day probabilistic weather forecasts at suggested or user-searched locations.

The app fetches public weather forecasts from Open-Meteo, then applies a transparent posterior predictive uncertainty model to produce sampled trajectories, median curves, and credible bands. It started with Fort Collins, Colorado and the Milan/Lombardia area, but it now supports arbitrary place search through Open-Meteo geocoding.

## Features

- Suggested locations for Fort Collins and several Lombardia cities.
- Search for arbitrary locations by place name.
- Compare forecast sources exposed through Open-Meteo:
  - Best match
  - NOAA GFS/HRRR
  - ECMWF open data
- Plot temperature, precipitation, wind speed, surface pressure, and cloud cover.
- Show posterior predictive median, 50% band, 90% band, sampled trajectories, and raw deterministic forecast.
- Hover for values and zoom the 48-hour time window.

## Model Caveat

This is probabilistic post-processing of public numerical forecasts. It is not a local dynamical weather model and should not be treated as operational meteorology. The current sampler estimates an additive bias and residual scale, then generates time-correlated posterior predictive paths around the selected public forecast.

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
https://matteosaccardi.github.io/weatherlab/
```
