const REGIONS = [
  {
    id: "albano-laziale",
    name: "Albano Laziale",
    latitude: 41.72748,
    longitude: 12.659,
    timezone: "Europe/Rome",
  },
  {
    id: "cernusco-sul-naviglio",
    name: "Cernusco Sul Naviglio",
    latitude: 45.52526,
    longitude: 9.33297,
    timezone: "Europe/Rome",
  },
  {
    id: "edinburgh",
    name: "Edinburgh",
    latitude: 55.95206,
    longitude: -3.19648,
    timezone: "Europe/London",
  },
  {
    id: "fort-collins",
    name: "Fort Collins",
    latitude: 40.5853,
    longitude: -105.0844,
    timezone: "America/Denver",
  },
  {
    id: "mendrisio",
    name: "Mendrisio",
    latitude: 45.87019,
    longitude: 8.9816,
    timezone: "Europe/Zurich",
  },
  {
    id: "milano",
    name: "Milano",
    latitude: 45.4642,
    longitude: 9.19,
    timezone: "Europe/Rome",
  },
  {
    id: "roma",
    name: "Roma",
    latitude: 41.9028,
    longitude: 12.4964,
    timezone: "Europe/Rome",
  },
  {
    id: "sesto-san-giovanni",
    name: "Sesto San Giovanni",
    latitude: 45.53329,
    longitude: 9.22585,
    timezone: "Europe/Rome",
  },
  {
    id: "tomich",
    name: "Tomich (Scotland)",
    latitude: 57.30524,
    longitude: -4.81215,
    timezone: "Europe/London",
  },
  {
    id: "traversetolo",
    name: "Traversetolo (Parma)",
    latitude: 44.64244,
    longitude: 10.38036,
    timezone: "Europe/Rome",
  },
];

const VARIABLES = {
  temperature_2m: {
    label: "Temperature",
    unit: "deg C",
    current: "temperature_2m",
    minSigma: 0.4,
    priorSigma: 1.6,
    floor: null,
    ceiling: null,
  },
  precipitation: {
    label: "Precipitation amount",
    unit: "mm/h",
    current: "precipitation",
    minSigma: 0.08,
    priorSigma: 0.8,
    floor: 0,
    ceiling: null,
  },
  precipitation_probability: {
    label: "Rain probability",
    unit: "%",
    current: null,
    minSigma: 2.0,
    priorSigma: 12.0,
    floor: 0,
    ceiling: 100,
  },
  wind_speed_10m: {
    label: "Wind speed",
    unit: "km/h",
    current: "wind_speed_10m",
    minSigma: 0.8,
    priorSigma: 3.0,
    floor: 0,
    ceiling: null,
  },
  surface_pressure: {
    label: "Surface pressure",
    unit: "hPa",
    current: "surface_pressure",
    minSigma: 0.5,
    priorSigma: 2.5,
    floor: null,
    ceiling: null,
  },
  cloud_cover: {
    label: "Cloud cover",
    unit: "%",
    current: "cloud_cover",
    minSigma: 3.0,
    priorSigma: 14.0,
    floor: 0,
    ceiling: 100,
  },
  european_aqi: {
    label: "European AQI",
    unit: "EAQI",
    current: "european_aqi",
    minSigma: 1.0,
    priorSigma: 8.0,
    floor: 0,
    ceiling: null,
    family: "air",
  },
  us_aqi: {
    label: "U.S. AQI",
    unit: "AQI",
    current: "us_aqi",
    minSigma: 2.0,
    priorSigma: 12.0,
    floor: 0,
    ceiling: 500,
    family: "air",
  },
  pm2_5: {
    label: "PM2.5",
    unit: "ug/m3",
    current: "pm2_5",
    minSigma: 0.8,
    priorSigma: 4.0,
    floor: 0,
    ceiling: null,
    family: "air",
  },
};

const SOURCES = {
  best: {
    label: "Open-Meteo best match",
    endpoint: "https://api.open-meteo.com/v1/forecast",
  },
  noaa: {
    label: "NOAA GFS/HRRR",
    endpoint: "https://api.open-meteo.com/v1/gfs",
  },
  ecmwf: {
    label: "ECMWF open data",
    endpoint: "https://api.open-meteo.com/v1/ecmwf",
  },
};

let regions = [...REGIONS];
let chartState = null;
let zoomWindow = null;

const els = {
  form: document.querySelector("#forecast-form"),
  region: document.querySelector("#region-select"),
  source: document.querySelector("#source-select"),
  search: document.querySelector("#location-search"),
  searchLocation: document.querySelector("#search-location"),
  runForecast: document.querySelector("#run-forecast"),
  variable: document.querySelector("#variable-select"),
  samples: document.querySelector("#sample-count"),
  seed: document.querySelector("#seed"),
  title: document.querySelector("#chart-title"),
  subtitle: document.querySelector("#chart-subtitle"),
  status: document.querySelector("#run-status"),
  canvas: document.querySelector("#forecast-chart"),
  tooltip: document.querySelector("#chart-tooltip"),
  zoomIn: document.querySelector("#zoom-in"),
  zoomOut: document.querySelector("#zoom-out"),
  zoomReset: document.querySelector("#zoom-reset"),
  current: document.querySelector("#current-value"),
  bias: document.querySelector("#bias-value"),
  sigma: document.querySelector("#sigma-value"),
  acceptance: document.querySelector("#acceptance-value"),
  interpretation: document.querySelector("#interpretation"),
};

function init() {
  renderRegionOptions();
  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    runForecast();
  });
  els.searchLocation.addEventListener("click", searchLocationForecast);
  els.search.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchLocationForecast();
    }
  });
  els.zoomIn.addEventListener("click", () => zoomChart(0.55));
  els.zoomOut.addEventListener("click", () => zoomChart(1.8));
  els.zoomReset.addEventListener("click", () => {
    zoomWindow = null;
    redrawChart();
  });
  els.canvas.addEventListener("mousemove", showTooltip);
  els.canvas.addEventListener("mouseleave", hideTooltip);
  drawEmptyChart();
  runForecast();
}

async function runForecast(regionOverride = null) {
  const region = regionOverride || regions.find((item) => item.id === els.region.value) || regions[0];
  const variableKey = els.variable.value;
  const variable = VARIABLES[variableKey];
  const source = SOURCES[els.source.value] || SOURCES.best;
  const sampleCount = clamp(Number(els.samples.value) || 1200, 200, 4000);
  const seed = clamp(Number(els.seed.value) || 1, 1, 999999);

  setBusy(true, "Fetching");
  try {
    const data = await fetchForecast(region, source, variableKey, variable);
    setBusy(true, "Sampling");
    const series = extractSeries(data, variableKey, variable);
    const result = samplePosteriorPredictive(series, variable, sampleCount, seed);
    zoomWindow = null;
    renderResult(region, source, variableKey, variable, series, result);
    updateTaskProgress();
  } catch (error) {
    els.status.textContent = "Error";
    els.subtitle.textContent = error.message;
    console.error(error);
  } finally {
    setBusy(false);
  }
}

function renderRegionOptions(selectedId = null) {
  els.region.replaceChildren();
  regions.forEach((region) => {
    const option = document.createElement("option");
    option.value = region.id;
    option.textContent = region.name;
    els.region.append(option);
  });
  if (selectedId) els.region.value = selectedId;
}

async function searchLocationForecast() {
  const query = els.search.value.trim();
  if (!query) return;
  setBusy(true, "Searching");
  try {
    const params = new URLSearchParams({
      name: query,
      count: "1",
      language: "en",
      format: "json",
    });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
    if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);
    const payload = await response.json();
    const place = payload.results?.[0];
    if (!place) {
      throw new Error(`No location found for "${query}". Try a nearby town or add a country name.`);
    }
    const region = {
      id: `search-${place.id}`,
      name: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone || "auto",
    };
    els.search.value = "";
    await runForecast(region);
  } catch (error) {
    els.status.textContent = "No match";
    els.subtitle.textContent = error.message;
    console.error(error);
  } finally {
    setBusy(false);
  }
}

async function fetchForecast(region, source, variableKey, variable) {
  if (variable.family === "air") {
    return fetchAirQuality(region, variableKey, variable);
  }
  const current = [
    "temperature_2m",
    "precipitation",
    "wind_speed_10m",
    "surface_pressure",
    "cloud_cover",
  ].join(",");
  const hourly = [
    "temperature_2m",
    "precipitation",
    "precipitation_probability",
    "wind_speed_10m",
    "surface_pressure",
    "cloud_cover",
  ].join(",");
  const params = new URLSearchParams({
    latitude: region.latitude,
    longitude: region.longitude,
    current,
    hourly,
    forecast_days: "3",
    timezone: region.timezone,
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  });
  const response = await fetch(`${source.endpoint}?${params}`);
  if (!response.ok) {
    throw new Error(`${source.label} request failed: ${response.status}`);
  }
  return response.json();
}

async function fetchAirQuality(region, variableKey, variable) {
  const params = new URLSearchParams({
    latitude: region.latitude,
    longitude: region.longitude,
    current: variable.current || variableKey,
    hourly: variableKey,
    forecast_days: "3",
    timezone: region.timezone,
  });
  const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo air-quality request failed: ${response.status}`);
  }
  return response.json();
}

function extractSeries(data, variableKey, variable) {
  const now = data.current?.time || data.hourly?.time?.[0];
  const times = data.hourly?.time || [];
  const values = data.hourly?.[variableKey] || [];
  let currentValue = Number(data.current?.[variable.current || variableKey]);
  const startIndex = Math.max(0, times.findIndex((time) => time >= now));
  if (!Number.isFinite(currentValue)) currentValue = Number(values[startIndex]);
  const endIndex = Math.min(startIndex + 48, values.length);
  const forecast = values.slice(startIndex, endIndex).map(Number);
  const forecastTimes = times.slice(startIndex, endIndex);
  if (forecast.length < 24 || !Number.isFinite(currentValue)) {
    throw new Error("The weather API response did not include enough usable data.");
  }
  return { times: forecastTimes, forecast, currentValue };
}

function samplePosteriorPredictive(series, variable, sampleCount, seed) {
  const random = mulberry32(seed);
  const anchorResidual = series.currentValue - series.forecast[0];
  const mcmc = runMetropolis(anchorResidual, variable, sampleCount, random);
  const paths = mcmc.samples.map(({ bias, sigma }) => {
    let innovation = gaussian(random) * sigma;
    return series.forecast.map((base, index) => {
      const timeScale = 1 + index / 36;
      innovation = 0.72 * innovation + gaussian(random) * sigma * Math.sqrt(1 - 0.72 ** 2) * timeScale;
      return boundValue(base + bias + innovation, variable);
    });
  });
  const quantiles = series.forecast.map((_, index) => {
    const values = paths.map((path) => path[index]).sort((a, b) => a - b);
    return {
      q05: quantileSorted(values, 0.05),
      q25: quantileSorted(values, 0.25),
      q50: quantileSorted(values, 0.5),
      q75: quantileSorted(values, 0.75),
      q95: quantileSorted(values, 0.95),
    };
  });
  const meanBias = mean(mcmc.samples.map((sample) => sample.bias));
  const meanSigma = mean(mcmc.samples.map((sample) => sample.sigma));
  return { paths: paths.slice(0, 42), quantiles, meanBias, meanSigma, acceptance: mcmc.acceptance };
}

function runMetropolis(anchorResidual, variable, sampleCount, random) {
  const burnIn = Math.max(300, Math.floor(sampleCount * 0.35));
  const total = sampleCount + burnIn;
  const samples = [];
  let accepted = 0;
  let state = { bias: anchorResidual, logSigma: Math.log(variable.priorSigma) };
  let score = logPosterior(state, anchorResidual, variable);

  for (let i = 0; i < total; i += 1) {
    const proposal = {
      bias: state.bias + gaussian(random) * variable.priorSigma * 0.25,
      logSigma: state.logSigma + gaussian(random) * 0.14,
    };
    const proposalScore = logPosterior(proposal, anchorResidual, variable);
    if (Math.log(random()) < proposalScore - score) {
      state = proposal;
      score = proposalScore;
      accepted += 1;
    }
    if (i >= burnIn) {
      samples.push({ bias: state.bias, sigma: Math.exp(state.logSigma) });
    }
  }
  return { samples, acceptance: accepted / total };
}

function logPosterior(state, anchorResidual, variable) {
  const sigma = Math.exp(state.logSigma);
  if (sigma < variable.minSigma || sigma > variable.priorSigma * 8) return -Infinity;
  const residual = anchorResidual - state.bias;
  const likelihood = -0.5 * (residual / sigma) ** 2 - Math.log(sigma);
  const biasPrior = -0.5 * (state.bias / (variable.priorSigma * 2.5)) ** 2;
  const sigmaPrior = -0.5 * (sigma / (variable.priorSigma * 2.2)) ** 2 + state.logSigma;
  return likelihood + biasPrior + sigmaPrior;
}

function renderResult(region, source, variableKey, variable, series, result) {
  els.title.textContent = `${variable.label}: ${region.name}`;
  const sourceLabel = variable.family === "air" ? "Open-Meteo air quality (CAMS)" : source.label;
  els.subtitle.textContent = `${sourceLabel}, ${series.times[0]} to ${series.times[series.times.length - 1]} local time`;
  els.current.textContent = `${format(series.currentValue)} ${variable.unit}`;
  els.bias.textContent = `${format(result.meanBias)} ${variable.unit}`;
  els.sigma.textContent = `${format(result.meanSigma)} ${variable.unit}`;
  els.acceptance.textContent = `${Math.round(result.acceptance * 100)}%`;
  els.interpretation.textContent = interpretationText(variableKey, result);
  chartState = { series, result, variable };
  redrawChart();
}

function redrawChart() {
  if (!chartState) return;
  drawChart(chartState.series, chartState.result, chartState.variable);
}

function drawChart(series, result, variable) {
  const canvas = els.canvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const pad = { left: 146, right: 28, top: 30, bottom: 82 };
  ctx.clearRect(0, 0, width, height);

  const view = getView(series.forecast.length);
  const viewIndexes = range(view.start, view.end);
  const allValues = viewIndexes.flatMap((index) => [
    result.quantiles[index].q05,
    result.quantiles[index].q95,
    series.forecast[index],
  ]);
  let min = Math.min(...allValues);
  let max = Math.max(...allValues);
  if (variable.floor === 0) min = Math.min(0, min);
  if (variable.ceiling !== null) max = Math.max(variable.ceiling, max);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const margin = Math.max((max - min) * 0.12, variable.minSigma);
  min = variable.floor === 0 ? 0 : min - margin;
  max = variable.ceiling === 100 ? 100 : max + margin;

  const x = (index) => pad.left + ((index - view.start) / Math.max(1, view.end - view.start)) * (width - pad.left - pad.right);
  const y = (value) => pad.top + ((max - value) / (max - min)) * (height - pad.top - pad.bottom);

  ctx.fillStyle = "#fbfdfd";
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, width, height, pad, min, max, variable);
  drawBand(ctx, result.quantiles, view, x, y, "q05", "q95", "rgba(10, 127, 143, 0.14)");
  drawBand(ctx, result.quantiles, view, x, y, "q25", "q75", "rgba(10, 127, 143, 0.25)");
  drawSamplePaths(ctx, result.paths, view, x, y);
  drawLine(ctx, series.forecast, view, x, y, "#6b747b", 2, [6, 5]);
  drawLine(ctx, result.quantiles.map((q) => q.q50), view, x, y, "#075c67", 4);
  drawXAxis(ctx, series.times, view, x, height, pad);
  chartState.plot = { pad, min, max, view };
}

function drawGrid(ctx, width, height, pad, min, max, variable) {
  ctx.strokeStyle = "#d7dee5";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#5e6a74";
  ctx.font = "14px system-ui";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const ticks = niceTicks(min, max, 6);
  ticks.forEach((value) => {
    const yy = pad.top + ((max - value) / (max - min)) * (height - pad.top - pad.bottom);
    ctx.beginPath();
    ctx.moveTo(pad.left, yy);
    ctx.lineTo(width - pad.right, yy);
    ctx.stroke();
    ctx.fillText(`${formatAxis(value)} ${variable.unit}`, pad.left - 16, yy);
  });
  ctx.save();
  ctx.translate(24, pad.top + (height - pad.top - pad.bottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillStyle = "#18212a";
  ctx.font = "15px system-ui";
  ctx.fillText(`${variable.label} (${variable.unit})`, 0, 0);
  ctx.restore();
}

function drawBand(ctx, quantiles, view, x, y, lowKey, highKey, fillStyle) {
  ctx.beginPath();
  range(view.start, view.end).forEach((index, offset) => {
    const q = quantiles[index];
    const xx = x(index);
    const yy = y(q[highKey]);
    if (offset === 0) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  });
  for (let index = view.end; index >= view.start; index -= 1) {
    ctx.lineTo(x(index), y(quantiles[index][lowKey]));
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function drawSamplePaths(ctx, paths, view, x, y) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  paths.forEach((path) => drawLine(ctx, path, view, x, y, "#0a7f8f", 1));
  ctx.restore();
}

function drawLine(ctx, values, view, x, y, color, width, dash = []) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  range(view.start, view.end).forEach((index, offset) => {
    const value = values[index];
    const xx = x(index);
    const yy = y(value);
    if (offset === 0) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  });
  ctx.stroke();
  ctx.restore();
}

function drawXAxis(ctx, times, view, x, height, pad) {
  ctx.fillStyle = "#5e6a74";
  ctx.font = "13px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const tickIndexes = timeTickIndexes(view);
  ctx.strokeStyle = "#d7dee5";
  tickIndexes.forEach((index) => {
    ctx.beginPath();
    ctx.moveTo(x(index), pad.top);
    ctx.lineTo(x(index), height - pad.bottom);
    ctx.stroke();
    const label = formatLocalApiTime(times[index]);
    const [day, hour] = label.split(" ");
    ctx.fillText(hour, x(index), height - pad.bottom + 20);
    ctx.fillText(day, x(index), height - pad.bottom + 38);
  });
  ctx.fillStyle = "#075c67";
  ctx.fillRect(pad.left, height - pad.bottom + 2, 80, 4);
  ctx.fillStyle = "#5e6a74";
  ctx.textAlign = "left";
  ctx.fillText("Median", pad.left + 90, height - pad.bottom - 4);
}

function getView(length) {
  if (!zoomWindow) return { start: 0, end: length - 1 };
  return {
    start: clamp(Math.round(zoomWindow.start), 0, length - 2),
    end: clamp(Math.round(zoomWindow.end), 1, length - 1),
  };
}

function zoomChart(factor) {
  if (!chartState) return;
  const length = chartState.series.forecast.length;
  const current = getView(length);
  const center = (current.start + current.end) / 2;
  const span = clamp((current.end - current.start) * factor, 8, length - 1);
  zoomWindow = {
    start: center - span / 2,
    end: center + span / 2,
  };
  redrawChart();
}

function showTooltip(event) {
  if (!chartState?.plot) return;
  const rect = els.canvas.getBoundingClientRect();
  const scaleX = els.canvas.width / rect.width;
  const mouseX = (event.clientX - rect.left) * scaleX;
  const { pad, view } = chartState.plot;
  if (mouseX < pad.left || mouseX > els.canvas.width - pad.right) {
    hideTooltip();
    return;
  }
  const fraction = (mouseX - pad.left) / (els.canvas.width - pad.left - pad.right);
  const index = clamp(Math.round(view.start + fraction * (view.end - view.start)), view.start, view.end);
  const q = chartState.result.quantiles[index];
  const base = chartState.series.forecast[index];
  els.tooltip.hidden = false;
  els.tooltip.style.left = `${Math.min(rect.width - 210, Math.max(8, event.clientX - rect.left + 12))}px`;
  els.tooltip.style.top = `${Math.max(8, event.clientY - rect.top - 18)}px`;
  els.tooltip.innerHTML = [
    `<strong>${formatLocalApiTime(chartState.series.times[index])}</strong>`,
    `Median: ${format(q.q50)} ${chartState.variable.unit}`,
    `90% band: ${format(q.q05)} to ${format(q.q95)}`,
    `Raw forecast: ${format(base)} ${chartState.variable.unit}`,
  ].join("<br>");
}

function hideTooltip() {
  els.tooltip.hidden = true;
}

function formatLocalApiTime(value) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString([], { weekday: "short", timeZone: "UTC" });
  return `${weekday} ${timePart.slice(0, 5)}`;
}

function drawEmptyChart() {
  const ctx = els.canvas.getContext("2d");
  ctx.fillStyle = "#fbfdfd";
  ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
  ctx.fillStyle = "#5e6a74";
  ctx.font = "18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Forecast output will appear here.", els.canvas.width / 2, els.canvas.height / 2);
}

function interpretationText(variableKey, result) {
  const sigma = format(result.meanSigma);
  if (variableKey === "precipitation") {
    return `This is precipitation amount, not probability. Many public short-range forecasts report zero rain for most hours, so locations can look similar when the deterministic amount field is zero. Posterior residual scale is about ${sigma} mm/h.`;
  }
  if (variableKey === "precipitation_probability") {
    return `This is the model probability of measurable precipitation. It is usually more informative than precipitation amount when most hourly amounts are zero. Posterior residual scale is about ${sigma} percentage points.`;
  }
  if (["european_aqi", "us_aqi", "pm2_5"].includes(variableKey)) {
    return `Air-quality data come from Open-Meteo's CAMS-based air-quality API. The sampler post-processes the public pollution forecast with the same bias/noise model; posterior residual scale is about ${sigma}.`;
  }
  return `The median line is the posterior predictive median. The darker band is 50%, the lighter band is 90%, with posterior residual scale about ${sigma}.`;
}

function setBusy(isBusy, text = "Running") {
  els.searchLocation.disabled = isBusy;
  els.runForecast.disabled = isBusy;
  if (isBusy) els.status.textContent = text;
  else if (!["Error", "No match"].includes(els.status.textContent)) els.status.textContent = "Ready";
}

function updateTaskProgress() {
  window.localStorage.setItem("weather-mcmc-last-run", new Date().toISOString());
}

function boundValue(value, variable) {
  let next = value;
  if (variable.floor !== null) next = Math.max(variable.floor, next);
  if (variable.ceiling !== null) next = Math.min(variable.ceiling, next);
  return next;
}

function quantileSorted(values, probability) {
  const position = (values.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return values[lower];
  return values[lower] + (values[upper] - values[lower]) * (position - lower);
}

function niceTicks(min, max, count) {
  const span = niceNumber(max - min, false);
  const step = niceNumber(span / Math.max(1, count - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let value = niceMin; value <= niceMax + 0.5 * step; value += step) {
    ticks.push(Math.abs(value) < 1e-9 ? 0 : value);
  }
  return ticks;
}

function niceNumber(value, round) {
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  let niceFraction;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * 10 ** exponent;
}

function timeTickIndexes(view) {
  const span = view.end - view.start;
  const step = span <= 12 ? 2 : span <= 24 ? 4 : 6;
  const indexes = [];
  for (let index = view.start; index <= view.end; index += step) indexes.push(index);
  if (!indexes.includes(view.end)) indexes.push(view.end);
  return indexes;
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function gaussian(random) {
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function format(value) {
  if (!Number.isFinite(value)) return "--";
  return Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1);
}

function formatAxis(value) {
  if (!Number.isFinite(value)) return "--";
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2).replace(/0$/, "");
}

init();
