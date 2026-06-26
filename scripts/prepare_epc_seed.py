"""Normalize an EPC bulk download into the energy contract.

The full England & Wales EPC bulk export is large and gated behind a free
GOV.UK One Login, so it is never committed. This helper streams a local bulk
download (a single certificates CSV, or the bulk ZIP whose members are per-local
-authority `certificates.csv` files) into the slim contract used by
`stg_epc__certificates`:

  postcode, current_energy_rating, current_energy_efficiency, property_type, lodgement_date

Output defaults to `data/raw/ref_epc_normalized.csv` (gitignored). Load it with
`scripts/load_epc.py`, then build with `--vars 'epc_source: bulk'`.

Usage:
    python scripts/prepare_epc_seed.py path/to/certificates.csv
    python scripts/prepare_epc_seed.py path/to/all-domestic-certificates.zip
"""

from __future__ import annotations

import argparse
import sys
import zipfile
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT = ROOT / "data" / "raw" / "ref_epc_normalized.csv"

CONTRACT_COLUMNS = [
    "postcode",
    "current_energy_rating",
    "current_energy_efficiency",
    "property_type",
    "lodgement_date",
]

# Logical column -> candidate source headers (compared case-insensitively).
ALIASES = {
    "postcode": ("postcode", "pcds"),
    "current_energy_rating": ("current_energy_rating", "current-energy-rating"),
    "current_energy_efficiency": (
        "current_energy_efficiency",
        "current-energy-efficiency",
    ),
    "property_type": ("property_type", "property-type"),
    "lodgement_date": ("lodgement_date", "lodgement-date", "inspection_date"),
}

CHUNK_SIZE = 200_000


def _resolve(columns: list[str]) -> dict[str, str]:
    lower = {str(column).strip().lower(): column for column in columns}
    resolved: dict[str, str] = {}
    for logical, candidates in ALIASES.items():
        for candidate in candidates:
            if candidate in lower:
                resolved[logical] = lower[candidate]
                break
    missing = [c for c in ("postcode", "current_energy_rating", "current_energy_efficiency") if c not in resolved]
    if missing:
        raise ValueError(f"EPC source is missing required columns: {missing}")
    return resolved


def _slim(frame: pd.DataFrame) -> pd.DataFrame:
    resolved = _resolve(list(frame.columns))
    out = pd.DataFrame()
    for logical in CONTRACT_COLUMNS:
        source = resolved.get(logical)
        out[logical] = frame[source] if source else ""
    out = out[out["postcode"].astype(str).str.strip() != ""]
    return out


def _iter_frames(input_path: Path):
    if input_path.suffix.lower() == ".zip":
        with zipfile.ZipFile(input_path) as archive:
            members = [
                info
                for info in archive.infolist()
                if not info.is_dir() and info.filename.lower().endswith("certificates.csv")
            ]
            if not members:
                raise ValueError("No '*certificates.csv' members found in the EPC ZIP")
            for info in members:
                with archive.open(info) as handle:
                    yield pd.read_csv(handle, dtype=str, keep_default_na=False, low_memory=False)
    else:
        for chunk in pd.read_csv(
            input_path, dtype=str, keep_default_na=False, low_memory=False, chunksize=CHUNK_SIZE
        ):
            yield chunk


def prepare(input_path: Path, output_path: Path) -> int:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    rows = 0
    wrote_header = False
    with output_path.open("w", encoding="utf-8", newline="") as out_file:
        for frame in _iter_frames(input_path):
            slim = _slim(frame)
            if slim.empty:
                continue
            slim.to_csv(out_file, index=False, header=not wrote_header)
            wrote_header = True
            rows += len(slim)
    if not wrote_header:
        raise ValueError("No EPC certificate rows were written")
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_path", type=Path, help="EPC certificates CSV or bulk ZIP")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help=f"Default: {DEFAULT_OUTPUT}")
    args = parser.parse_args()

    try:
        rows = prepare(args.input_path, args.output)
    except (OSError, ValueError, zipfile.BadZipFile, pd.errors.ParserError) as exc:
        print(f"[error] {exc}", file=sys.stderr)
        return 1

    print(f"[done] wrote {rows:,} EPC certificate rows to {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
