# WeatherLab

WeatherLab is a static browser app for two-day probabilistic weather forecasts at suggested or user-searched locations.

The app fetches public weather forecasts from Open-Meteo, then applies a transparent posterior predictive uncertainty model to produce sampled trajectories, median curves, and credible bands. It started with Fort Collins, Colorado and the Milan/Lombardia area, but it now supports arbitrary place search through Open-Meteo geocoding.

## Features

- Suggested locations: Albano Laziale, Cernusco Sul Naviglio, Edinburgh, Fort Collins, Mendrisio, Milano, Roma, Sesto San Giovanni, Tomich, and Traversetolo.
- Search for arbitrary locations by place name.
- Compare forecast sources exposed through Open-Meteo:
  - Best match
  - NOAA GFS/HRRR
  - ECMWF open data
- Plot temperature, precipitation amount, rain probability, wind speed, surface pressure, cloud cover, local air quality index, and PM2.5.
- Show an AQI guide with local thresholds when the air quality index is selected.
- Show posterior predictive median, 50% band, 90% band, sampled trajectories, and raw deterministic forecast.
- Hover for values and zoom the 48-hour time window.

## Model Caveat

This is probabilistic post-processing of public numerical forecasts. It is not a local dynamical weather model and should not be treated as operational meteorology.

For a selected variable, the deterministic public forecast is treated as a central trajectory `f_t`. The app estimates two latent error parameters:

- `b`: an additive bias.
- `sigma`: a residual innovation scale.

The current-condition residual, when available, anchors the likelihood: `r_0 = observed_now - f_0`. A Metropolis-Hastings chain samples `(b, log(sigma))` from a simple posterior with broad variable-specific priors. For each posterior draw, the app generates an AR(1)-correlated error path and plots posterior predictive quantiles of `f_t + b + error_t`.

For precipitation amount, many locations can look similar because the public deterministic amount forecast is often zero for most hours. The separate rain-probability variable is usually more informative for "will it rain?".

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
