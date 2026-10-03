"""Lays renders side by side on the desk colour.

    blender --background --python art/blender/compare.py -- out.png a.png b.png c.png
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import on_desk  # noqa: E402

paths = sys.argv[sys.argv.index('--') + 1:]
on_desk([os.path.abspath(p) for p in paths[1:]], os.path.abspath(paths[0]))
