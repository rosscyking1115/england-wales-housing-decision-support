"""Guard: only declared, contract-sourced files may implement the scoring formula.

The overall score has one definition — contracts/neighbourhood-scoring-v2.json —
mirrored into a fixed, small set of runtimes that are each covered by the golden
cases in test_scoring_contract.py and web/src/lib/reweight.test.ts. A copy that
reads neither the contract nor the golden cases is a silent divergence risk: it
keeps working while the contract moves underneath it. One such copy existed in
the parked Expo client (mobile/src/lib/reweight.ts) and was removed.

This test fails when the weighted-geometric-mean signature appears in a source
file that is not on ALLOWED below, so a new copy cannot land unnoticed. Adding a
file here is a deliberate act that shows up in review.

Scope and its limits, stated rather than implied:
  - Only executable source extensions are scanned (see SOURCE_SUFFIXES). The
    historical design mock at web/design/housing-decision-support/*.html contains
    a *different*, weighted-arithmetic prototype formula; it is a non-executing
    artefact excluded from every build, and it is out of this guard's scope.
  - The signature is the floored logarithm the formula is built from. An
    implementation written some other way would not be caught. This guard raises
    the cost of an accidental copy; it is not a proof of uniqueness.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CONTRACT_FILENAME = "neighbourhood-scoring-v2.json"

SOURCE_SUFFIXES = {".py", ".sql", ".ts", ".tsx", ".js", ".jsx"}

SKIP_DIRECTORIES = {
    ".git",
    ".next",
    ".pytest_cache",
    ".venv",
    "__pycache__",
    "dbt_packages",
    "logs",
    "node_modules",
    "target",
}

# The weighted geometric mean is always written as the logarithm of a component
# floored at the contract's component_floor: ln(greatest(...)) in SQL,
# Math.log(Math.max(...)) in TypeScript, np.log(....clip(lower=...)) in pandas.
FORMULA_RE = re.compile(
    r"(?:\bln|\blog|Math\.log|np\.log)\s*\(\s*[^()\n]{0,40}?"
    r"(?:greatest|Math\.max|np\.maximum|\.clip|\bmax)\s*\(",
    re.IGNORECASE,
)

# Every file permitted to implement the formula, and how it is tied to the
# contract. "contract" = reads contracts/neighbourhood-scoring-v2.json directly.
# "dbt-vars" = uses the validated_score_weight macro over dbt vars, which
# test_scoring_contract.test_dbt_and_extract_defaults_match_the_contract asserts
# equal the contract. "oracle" = an independent recomputation used to *check* a
# mart; it must stay contract-free or it would only be testing itself.
ALLOWED: dict[str, str] = {
    "models/marts/decision/rpt_neighbourhood_score.sql": "dbt-vars",
    "api/scoring.py": "contract",
    "web/src/lib/reweight.ts": "contract",
    "scripts/rescore_extract.py": "contract",
    "tests/assert_scoring_golden_cases_match.sql": "oracle",
}


SELF = Path(__file__).resolve()


def _source_files() -> list[Path]:
    found = []
    for path in ROOT.rglob("*"):
        if path.suffix.lower() not in SOURCE_SUFFIXES or not path.is_file():
            continue
        if SKIP_DIRECTORIES.intersection(path.relative_to(ROOT).parts):
            continue
        # This file quotes the signature in FORMULA_RE, so it matches itself.
        if path.resolve() == SELF:
            continue
        found.append(path)
    return found


class ScoringSingleDefinitionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.implementations = sorted(
            path.relative_to(ROOT).as_posix()
            for path in _source_files()
            if FORMULA_RE.search(path.read_text(encoding="utf-8", errors="ignore"))
        )

    def test_the_scan_is_not_silently_matching_nothing(self) -> None:
        """A regex that stops matching would make this whole guard vacuous."""
        self.assertGreaterEqual(len(self.implementations), len(ALLOWED))

    def test_no_undeclared_implementation_of_the_formula(self) -> None:
        undeclared = [path for path in self.implementations if path not in ALLOWED]
        self.assertEqual(
            undeclared,
            [],
            "These files implement the scoring formula but are not declared in "
            f"{Path(__file__).name}. Either read "
            f"contracts/{CONTRACT_FILENAME} and add golden-case coverage, or "
            "delete the copy. Do not leave a fourth definition in the tree.",
        )

    def test_every_declared_implementation_still_exists(self) -> None:
        missing = [path for path in ALLOWED if not (ROOT / path).exists()]
        self.assertEqual(missing, [], "Declared implementations that no longer exist.")

    def test_declared_implementations_are_tied_to_the_contract(self) -> None:
        for path, binding in ALLOWED.items():
            with self.subTest(path=path):
                text = (ROOT / path).read_text(encoding="utf-8")
                if binding == "contract":
                    self.assertIn(CONTRACT_FILENAME, text)
                elif binding == "dbt-vars":
                    self.assertIn("validated_score_weight", text)
                elif binding == "oracle":
                    self.assertNotIn(
                        CONTRACT_FILENAME,
                        text,
                        "A test oracle that reads the contract would only be "
                        "testing itself.",
                    )
                else:  # pragma: no cover - guards the table above
                    self.fail(f"Unknown binding {binding!r} for {path}.")


if __name__ == "__main__":
    unittest.main()
