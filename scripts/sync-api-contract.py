#!/usr/bin/env python3
"""Publish the Server-owned OpenAPI contract without a second hand-written API list.

Run with Python 3 and PyYAML: python3 scripts/sync-api-contract.py [--check].
Both generated files contain the source YAML's SHA-256 and are byte-identical.
"""

import argparse
import hashlib
import json
from pathlib import Path
import sys

import yaml


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "norulo-server" / "openapi" / "ledger-v1.yaml"
OUTPUTS = (
    ROOT / "public" / "openapi" / "ledger-v1.json",
    ROOT / "src" / "data" / "api-contract.json",
)
# The API page renders its endpoint list from this outline and loads the full
# contract only when a reader opens an endpoint or copies the documentation.
OUTLINE = ROOT / "src" / "data" / "api-contract-outline.json"
METHODS = ("get", "post", "put", "patch", "delete", "head", "options", "trace")


def contract_outline(contract):
    """Method, path and first tag per operation, in contract order."""
    paths = {}
    for path, item in contract["paths"].items():
        paths[path] = {
            method: {"tags": operation["tags"][:1]} if operation.get("tags") else {}
            for method, operation in item.items()
            if method in METHODS
        }
    return {
        "openapi": contract.get("openapi"),
        "info": {"version": (contract.get("info") or {}).get("version")},
        "paths": paths,
    }


def validate_references(node, document):
    """Reject broken or remote references before copying the public contract."""
    if isinstance(node, dict):
        reference = node.get("$ref")
        if reference is not None:
            if not isinstance(reference, str) or not reference.startswith("#/"):
                raise ValueError(f"Unsupported OpenAPI reference: {reference}")
            target = document
            for part in reference[2:].split("/"):
                token = part.replace("~1", "/").replace("~0", "~")
                if isinstance(target, list):
                    target = target[int(token)]
                else:
                    target = target[token]
        for value in node.values():
            validate_references(value, document)
    elif isinstance(node, list):
        for value in node:
            validate_references(value, document)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if either generated file is stale")
    args = parser.parse_args()
    try:
        source = SOURCE.read_bytes()
        contract = yaml.safe_load(source)
        if not isinstance(contract, dict) or not contract.get("paths"):
            raise ValueError("The Server OpenAPI contract must contain paths")
        validate_references(contract, contract)
        contract["x-norulo-source-sha256"] = hashlib.sha256(source).hexdigest()
        expected = (json.dumps(contract, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode()
        outline = (
            json.dumps(contract_outline(contract), ensure_ascii=False, indent=2, allow_nan=False)
            + "\n"
        ).encode()
    except (OSError, ValueError, KeyError, IndexError, yaml.YAMLError) as error:
        print(f"OpenAPI synchronization failed: {error}", file=sys.stderr)
        return 1

    stale = []
    for output, content in [*((output, expected) for output in OUTPUTS), (OUTLINE, outline)]:
        if args.check:
            if not output.is_file() or output.read_bytes() != content:
                stale.append(str(output.relative_to(ROOT)))
        else:
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(content)
    if stale:
        print("OpenAPI artifacts are stale: " + ", ".join(stale), file=sys.stderr)
        print("Run python3 scripts/sync-api-contract.py after updating the Server contract.", file=sys.stderr)
        return 1
    action = "Verified" if args.check else "Generated"
    print(f"{action} the OpenAPI artifacts from ledger-v1.yaml ({contract['x-norulo-source-sha256'][:12]}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
