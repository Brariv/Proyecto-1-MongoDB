import random
from pathlib import Path
from typing import Tuple, Optional

import geopandas as gpd
from shapely.geometry import Point
import requests
import us


# Census “cartographic boundary” states file (simplified borders)
CENSUS_STATES_ZIP = "https://www2.census.gov/geo/tiger/GENZ2018/shp/cb_2018_us_state_20m.zip"


def _get_states_gdf(cache_dir: str = ".cache_geo") -> gpd.GeoDataFrame:
    """
    Downloads + caches a US states shapefile (zip) and returns it as a GeoDataFrame.
    """
    cache = Path(cache_dir)
    cache.mkdir(parents=True, exist_ok=True)
    zip_path = cache / "cb_2018_us_state_20m.zip"

    if not zip_path.exists():
        r = requests.get(CENSUS_STATES_ZIP, timeout=60)
        r.raise_for_status()
        zip_path.write_bytes(r.content)

    # GeoPandas can read directly from a local .zip path
    gdf = gpd.read_file(str(zip_path))

    # Normalize non-geometry column names for safety.
    # IMPORTANT: don't rename the active geometry column or GeoPandas will treat it as a plain column.
    geom_col = gdf.geometry.name  # usually "geometry"
    rename_map = {c: c.upper() for c in gdf.columns if c != geom_col}
    gdf = gdf.rename(columns=rename_map)
    gdf = gdf.set_geometry(geom_col)

    # Drop territories (keep 50 states + DC)
    # The file includes states/territories; STUSPS includes codes like PR, GU, etc.
    keep = set([s.abbr for s in us.states.STATES] + ["DC"])
    gdf = gdf[gdf["STUSPS"].isin(keep)].copy()

    return gdf


def random_coordinate_in_state(
    state: str,
    max_tries: int = 50_000,
    cache_dir: str = ".cache_geo",
    seed: Optional[int] = None,
) -> Tuple[float, float]:
    """
    Returns (lat, lon) uniformly-ish sampled inside the true polygon of the US state.

    state: "TX", "Texas", "Florida", etc.
    """
    if seed is not None:
        random.seed(seed)

    states = _get_states_gdf(cache_dir=cache_dir)

    # Resolve input to a postal abbreviation if possible
    state = state.strip()
    st = us.states.lookup(state)
    abbr = st.abbr if st else state.upper()

    row = states.loc[states["STUSPS"] == abbr]
    if row.empty:
        raise ValueError(f"State '{state}' not found. Try 'TX' or 'Texas'.")

    # GeoPandas stores geometries in the active geometry column
    geom = row.geometry.iloc[0]

    # (MultiPolygon is common for states with islands; treat as one geometry)
    minx, miny, maxx, maxy = geom.bounds

    for _ in range(max_tries):
        x = random.uniform(minx, maxx)  # lon
        y = random.uniform(miny, maxy)  # lat
        p = Point(x, y)
        if geom.contains(p):
            return (y, x)

    raise RuntimeError(f"Failed to sample a point in {abbr} after {max_tries} tries. Increase max_tries.")