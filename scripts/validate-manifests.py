#!/usr/bin/env python3
import os
import subprocess
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cmd = ["swift", "run", "--quiet", "marketplace-validator", "manifests", *sys.argv[1:]]
raise SystemExit(subprocess.call(cmd, cwd=REPO_ROOT))
