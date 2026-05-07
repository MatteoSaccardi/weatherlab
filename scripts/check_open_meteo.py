#!/usr/bin/env python3
"""Verify that Open-Meteo returns usable fields for the initial target regions."""

from __future__ import annotations

import argparse
from dataclasses import dataclass

import requests


VARIABLES = (
    "temperature_2m",
    "precipitation",
    "wind_speed_10m",
    "surface_pressure",
    "cloud_cover",
)


@dataclass(frozen=True)
class Region:
    name: str
    latitude: float
    longitude: float
    timezone: str


REGIONS = (
    Region("Fort Collins, Colorado", 40.5853, -105.0844, "America/Denver"),
    Region("Milan, Lombardia", 45.4642, 9.19, "Europe/Rome"),
    Region("Bergamo, Lombardia", 45.6983, 9.6773, "Europe/Rome"),
    Region("Brescia, Lombardia", 45.5416, 10.2118, "Europe/Rome"),
    Region("Como, Lombardia", 45.8081, 9.0852, "Europe/Rome"),
)


def fetch_region(region: Region) -> dict:
    params = {
        "latitude": region.latitude,
        "longitude": region.longitude,
        "current": ",".join(VARIABLES),
        "hourly": ",".join(VARIABLES),
        "forecast_days": 3,
        "timezone": region.timezone,
        "wind_speed_unit": "kmh",
        "precipitation_unit": "mm",
    }
    response = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params=params,
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def validate_payload(region: Region, payload: dict) -> str:
    current = payload.get("current", {})
    hourly = payload.get("hourly", {})
    missing_current = [name for name in VARIABLES if name not in current]
    missing_hourly = [name for name in VARIABLES if name not in hourly]
    if missing_current or missing_hourly:
        raise ValueError(
            f"{region.name}: missing current={missing_current}, hourly={missing_hourly}"
        )

    hours = len(hourly.get("time", []))
    if hours < 48:
        raise ValueError(f"{region.name}: expected at least 48 hourly rows, got {hours}")

    temp = current["temperature_2m"]
    precip = current["precipitation"]
    wind = current["wind_speed_10m"]
    pressure = current["surface_pressure"]
    cloud = current["cloud_cover"]
    return (
        f"{region.name}: {current['time']} local, "
        f"T={temp} C, rain={precip} mm, wind={wind} km/h, "
        f"p={pressure} hPa, cloud={cloud}%, hourly_rows={hours}"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--region",
        choices=["all", "fort-collins", "milan", "bergamo", "brescia", "como"],
        default="all",
    )
    args = parser.parse_args()

    selected = {
        "fort-collins": REGIONS[0],
        "milan": REGIONS[1],
        "bergamo": REGIONS[2],
        "brescia": REGIONS[3],
        "como": REGIONS[4],
    }
    regions = REGIONS if args.region == "all" else (selected[args.region],)

    for region in regions:
        payload = fetch_region(region)
        print(validate_payload(region, payload))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
