#!/usr/bin/env python3
"""Counts UVM errors per ID in a simulation log."""
import re
import sys
from collections import Counter

ERROR_RE = re.compile(r"^UVM_(ERROR|FATAL) .*?\[(\w+)\]")


def main(path: str) -> int:
    counts = Counter()
    with open(path, encoding="utf-8") as log:
        for line in log:
            if m := ERROR_RE.match(line):
                counts[m.group(2)] += 1
    for msg_id, n in counts.most_common():
        print(f"{msg_id:<24} {n}")
    return 1 if counts else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
