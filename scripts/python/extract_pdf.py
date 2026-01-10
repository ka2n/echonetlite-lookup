#!/usr/bin/env python3
"""
PDF extraction script for ECHONET Lite manufacturer codes.
Extracts manufacturer code table from PDF and outputs JSON.
"""

import sys
import json
import argparse
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("Error: pdfplumber is not installed.", file=sys.stderr)
    print("Install it with: pip install pdfplumber", file=sys.stderr)
    sys.exit(1)


def extract_manufacturers(pdf_path: str) -> list[dict]:
    """
    Extract manufacturer data from PDF.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        List of manufacturer dictionaries with code, nameJa, and nameEn fields
    """
    manufacturers = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # Extract tables from the page
            tables = page.extract_tables()

            for table in tables:
                if not table or len(table) < 2:
                    continue

                # Skip header row
                for row in table[1:]:
                    if not row or len(row) < 2:
                        continue

                    # Extract code and names
                    code = row[0].strip() if row[0] else ""
                    name_ja = row[1].strip() if len(row) > 1 and row[1] else ""
                    name_en = row[2].strip() if len(row) > 2 and row[2] else None

                    # Skip empty rows
                    if not code or not name_ja:
                        continue

                    # Clean up English name
                    if name_en == "" or name_en == "-":
                        name_en = None

                    manufacturers.append({
                        "code": code,
                        "nameJa": name_ja,
                        "nameEn": name_en
                    })

    return manufacturers


def main():
    parser = argparse.ArgumentParser(
        description="Extract ECHONET Lite manufacturer codes from PDF"
    )
    parser.add_argument(
        "pdf_file",
        type=str,
        help="Path to the PDF file"
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        help="Output JSON file path (default: stdout)"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Verbose output"
    )

    args = parser.parse_args()

    pdf_path = Path(args.pdf_file)

    if not pdf_path.exists():
        print(f"Error: PDF file not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(f"Extracting data from {pdf_path}...", file=sys.stderr)

    try:
        manufacturers = extract_manufacturers(str(pdf_path))

        if args.verbose:
            print(f"Extracted {len(manufacturers)} manufacturers", file=sys.stderr)

        output_data = json.dumps(manufacturers, ensure_ascii=False, indent=2)

        if args.output:
            output_path = Path(args.output)
            output_path.write_text(output_data, encoding="utf-8")
            if args.verbose:
                print(f"Saved to {output_path}", file=sys.stderr)
        else:
            print(output_data)

        sys.exit(0)

    except Exception as e:
        print(f"Error extracting data: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
