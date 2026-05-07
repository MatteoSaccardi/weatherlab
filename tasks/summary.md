# Weather MCMC Forecast Tool

## Goal

Build a small web-accessible tool for probabilistic two-day weather forecasts using freely accessible current and forecast data. Initial target regions:

- Fort Collins, Colorado, USA
- Lombardia, Italy, with emphasis on the Milan metro area

The tool should expose the assumptions clearly enough for a theoretical particle physicist to inspect and critique the statistical model.

## Feasibility Notes

- A useful first version is feasible as a browser-based application.
- Free public weather sources can provide current conditions and short-range forecasts. A practical default is Open-Meteo because it exposes global forecast and historical APIs without requiring an API key for ordinary usage.
- "MCMC weather forecasting" should be interpreted carefully. Operational weather prediction solves physical PDEs with data assimilation; a lightweight app cannot reproduce that. The feasible version can use MCMC or Monte Carlo sampling to generate posterior predictive distributions around public numerical forecasts, calibrated by recent forecast errors where available.
- The first version should focus on transparent probabilistic post-processing: temperature, precipitation probability/amount, wind, cloud cover, and pressure for the next 48 hours.
- Online access can be approached in stages: first a local static/web app, then deployment instructions for GitHub Pages, Netlify, Vercel, or another static host.

## Task Checklist

- [x] Create task tracking folder and summary document.
- [x] Choose the minimum viable architecture.
- [x] Identify free data APIs and document endpoint assumptions.
- [x] Define the statistical model for uncertainty propagation.
- [x] Implement a first web UI for Fort Collins and Milan/Lombardia.
- [x] Implement data fetching for current and 48-hour forecast data.
- [x] Implement Monte Carlo/MCMC-style posterior sampling.
- [x] Add visualizations for median forecast, credible intervals, and sampled trajectories.
- [x] Add user controls for region, variables, sample count, and random seed.
- [x] Create a local Python virtual environment for scientific tooling.
- [x] Cross-check fetched data against at least one independent source or API endpoint when possible.
- [x] Add clear caveats about physical limits and forecast interpretation.
- [ ] Run local verification and fix visible UI/data issues.
- [ ] Prepare deployment path for online access.
- [x] Ask user to test the running app.
- [x] Fix clipped y-axis labels and add explicit y-axis variable labels.
- [x] Add arbitrary location search through Open-Meteo geocoding.
- [x] Add source selector for Open-Meteo best match, NOAA GFS/HRRR, and ECMWF open-data endpoints.
- [x] Add chart hover tooltip and time zoom controls.
- [x] Improve time-axis tick labels and vertical grid lines.
- [x] Prepare static-host deployment files.
- [x] Initialize local Git repository and create deployment-ready commit.
- [ ] Publish to a public hosting provider.

## Proposed Architecture

- Static frontend: HTML, CSS, JavaScript.
- No backend for the first version.
- Weather data source: Open-Meteo forecast API, with optional historical/reanalysis API for calibration.
- Statistical layer:
  - Start from deterministic hourly forecast fields.
  - Add a small hierarchical error model by variable and location.
  - Use Metropolis-Hastings or simpler Monte Carlo draws for bias/noise parameters.
  - Produce posterior predictive sample paths over the next 48 hours.
- Visualization:
  - Time series bands for temperature, wind speed, pressure.
  - Probability bars or distributions for precipitation.
  - Region comparison view for Fort Collins and Milan.

## Current Status

The workspace was empty at initialization. The task folder and this summary have been created.

## Next Step

Run local verification, check browser rendering, and confirm that current data can be fetched for Fort Collins and Milan from the browser.

## Implemented Files

- `index.html`: Static app structure and controls.
- `styles.css`: Responsive application layout.
- `app.js`: Open-Meteo fetch logic, Metropolis-Hastings sampler, posterior predictive path generation, and canvas chart rendering.
- `.venv/`: Local Python virtual environment.
- `requirements.txt`: Python packages intended for data checks, future calibration work, and scientific plotting.
- `scripts/check_open_meteo.py`: Python smoke test for the initial Open-Meteo regions and fields.
- `.gitignore`: Excludes the local virtual environment and generated Python cache files.
- `.nojekyll`: Prevents GitHub Pages from applying Jekyll processing.
- `README.md`: Project overview, local run instructions, and deployment note.
- `DEPLOYMENT.md`: Step-by-step deployment instructions for GitHub Pages, Netlify, Vercel, and Cloudflare Pages.
- `netlify.toml`: Static publish configuration and basic security headers for Netlify.

## Data Endpoint

Current implementation calls:

`https://api.open-meteo.com/v1/forecast`

with latitude, longitude, `current`, `hourly`, `forecast_days=3`, local timezone, metric precipitation, and km/h wind speed. The app extracts the next 48 local hourly values from the returned forecast.

## Current Model

For a selected variable, the app estimates an additive bias and residual scale using a small Metropolis-Hastings chain anchored by the current-condition residual. Posterior predictive paths add AR(1)-correlated innovations to the deterministic forecast. This is a transparent uncertainty post-processor, not a dynamical atmosphere model.

## Verification Log

- Open-Meteo base endpoint returned HTTP 200 on May 7, 2026 UTC.
- Exact Fort Collins query returned current and hourly data for temperature, precipitation, wind speed, surface pressure, and cloud cover.
- Exact Milan query returned current and hourly data for the same variables.
- JavaScript syntax check with Node.js could not be run because `node` is not installed in this environment.
- Local Python virtual environment created with `python3 -m venv .venv`.
- Python dependencies installed successfully into `.venv`.
- `scripts/check_open_meteo.py` passed for Fort Collins, Milan, Bergamo, Brescia, and Como.
- Local static server started from `.venv` at `http://localhost:8000/`.
- Live endpoint checks passed for the Open-Meteo NOAA GFS/HRRR endpoint, ECMWF endpoint, and geocoding endpoint. ECMWF does not return a `current` block for the tested query, so the app falls back to the first forecast hour as the analysis anchor.
- Local Git commit created: `500eb77 Prepare static weather forecast app`.

## Python Environment

Activate the environment with:

`source .venv/bin/activate`

Install the Python dependencies with:

`python -m pip install -r requirements.txt`

Run the API smoke test with:

`python scripts/check_open_meteo.py`

The smoke test checks that current and hourly fields are returned for temperature, precipitation, wind speed, surface pressure, and cloud cover, with at least 48 hourly forecast rows.
