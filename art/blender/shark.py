"""The shark, rendered: a soft plush shark floating through the air.

What makes it read as a shark (and not as a fish): a dorsal fin raked *back* with a
hollow trailing edge, a crescent tail with a bigger upper lobe, a head that slopes down
to a lower, pointier snout, an eye on the side of the head above the corner of the
mouth, and a big open mouth: a wedge cut into the side of the head, widening towards
the snout, with interlocking felt teeth along both jaws. Built along Y with the nose
at -Y, then turned so you see its side.

Earlier lessons still hold: the pale belly is painted on the body (a separate belly reads
as an underbite), and gills are thin seams (black bars read as letters).
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import (  # noqa: E402
    aim, args, cone, ellipsoid, eyeball, finish, flat_shape, fuse, gather, give, hex_color, hit, inside, mix, render,
    reset, shade_hex, smoothstep, stage, surface, tube, wizard_hat,
)
from mathutils import Vector  # noqa: E402

COATS = {
    'ocean': {'body': '#4a78a8', 'belly': '#f2f0ea'},
    'reef': {'body': '#8f9aa5', 'belly': '#f4f3ef'},
    'coral': {'body': '#e88aa8', 'belly': '#fff1f4'},
    'deep': {'body': '#2f4064', 'belly': '#d2dbea'},
}

FLOAT = 1.25

# Fin outlines: x runs towards the tail (or outward for the side fins), z up.
DORSAL = [(-0.3, 0), (-0.22, 0.22), (-0.08, 0.44), (0.08, 0.58), (0.24, 0.66), (0.18, 0.48), (0.15, 0.3), (0.18, 0.14), (0.28, 0)]
FLUKE = [(0, 0.07), (0.12, 0.3), (0.3, 0.55), (0.5, 0.78), (0.4, 0.48), (0.34, 0.22), (0.36, 0.02), (0.42, -0.22),
         (0.46, -0.42), (0.28, -0.22), (0.12, -0.1), (0, -0.06)]
PECTORAL = [(0, -0.05), (0.18, 0.02), (0.36, 0.14), (0.5, 0.32), (0.3, 0.28), (0.12, 0.22), (0, 0.16)]

# The mouth, seen from the side: a wedge from its corner (under the eye) to the snout,
# opening wider towards the front. s runs 0 at the snout tip to 1 at the corner.
TIP_Y, CORNER_Y = -1.22, -0.5


def upper_jaw(s):
    return FLOAT - 0.07 - 0.02 * s


def lower_jaw(s):
    # Kept on the visible side of the head: any lower and the bottom teeth end up under the chin.
    return upper_jaw(s) - 0.22 * max(0.0, 1 - s) ** 0.8


def mouth_depth(p):
    """How deep inside the open mouth a point lies: 0 outside or on the lips, 1 deep in."""
    s = (p.y - TIP_Y) / (CORNER_Y - TIP_Y)
    if not -0.15 <= s <= 1 or p.z > FLOAT:
        return 0.0
    top, bottom = upper_jaw(max(s, 0)), lower_jaw(max(s, 0))
    if not bottom < p.z < top:
        return 0.0
    middle = min(p.z - bottom, top - p.z) / max(0.5 * (top - bottom), 1e-4)
    return smoothstep(0.0, 0.7, middle) * smoothstep(1.0, 0.85, s)


def build(style, coat, accessory='hat'):
    c = COATS[coat]
    top, belly = hex_color(c['body']), hex_color(c['belly'])
    gum, throat = hex_color('#8a2a34'), hex_color('#3a0f15')
    blush = hex_color('#f09aa4')
    z = FLOAT
    back = (0, 0, math.pi / 2)  # turns an outline's x towards the tail

    body = fuse('body', [
        # The head slopes down to a lower, pointier snout.
        ellipsoid('snout_tip', (0, -0.98, z - 0.1), (0.26, 0.32, 0.22)),
        ellipsoid('head', (0, -0.52, z), (0.5, 0.6, 0.44)),
        ellipsoid('middle', (0, 0.1, z + 0.02), (0.52, 0.7, 0.46)),
        ellipsoid('rear', (0, 0.78, z + 0.05), (0.3, 0.5, 0.28)),
        ellipsoid('stalk', (0, 1.18, z + 0.07), (0.14, 0.32, 0.14)),
        flat_shape('dorsal', DORSAL, 0.1, (0, 0.05, z + 0.36), back),
        flat_shape('dorsal2', [(x * 0.35, y * 0.35) for x, y in DORSAL], 0.06, (0, 0.9, z + 0.22), back),
        flat_shape('fluke', FLUKE, 0.09, (0, 1.3, z + 0.07), back),
        flat_shape('fin_l', [(-x, y) for x, y in PECTORAL], 0.07, (-0.42, -0.2, z - 0.22), (-math.pi / 2, -0.45, 0)),
        flat_shape('fin_r', PECTORAL, 0.07, (0.42, -0.2, z - 0.22), (-math.pi / 2, 0.45, 0)),
    ], voxel=0.012)

    # Where the teeth go: found on the skin before the mouth is opened, along both lips.
    def on_side(side, y, height):
        return hit(body, (side * 2, y, height), (-side, 0, 0))

    teeth_at = []
    for side in (-1, 1):
        for k in range(8):
            s = 0.05 + k * 0.11
            point, normal = on_side(side, TIP_Y + s * (CORNER_Y - TIP_Y), upper_jaw(s) - 0.012)
            if point is not None:
                teeth_at.append((point, normal, (0, 0, -1), 0.075 - 0.04 * s))
        for k in range(5):
            s = 0.1 + k * 0.13
            point, normal = on_side(side, TIP_Y + s * (CORNER_Y - TIP_Y), lower_jaw(s) + 0.012)
            if point is not None:
                teeth_at.append((point, normal, (0, 0, 1), 0.065 - 0.03 * s))
    for x in (-0.12, -0.04, 0.04, 0.12):
        point, normal = hit(body, (x, TIP_Y - 2, upper_jaw(0.04) - 0.012), (0, 1, 0))
        if point is not None:
            teeth_at.append((point, normal, (0, 0, -1), 0.07))

    # The open mouth is painted, not carved: pushing the skin in on a slim snout folds it
    # through itself, and the fuzz shells then shatter into shards.

    def colour_at(p):
        # Countershading: dark on top, pale underneath, a gentle wave between them.
        # Side fins and the whole tail keep the top colour.
        line = z - 0.06 + 0.035 * math.sin(p.y * 7)
        keep = max(smoothstep(0.4, 0.46, abs(p.x)), smoothstep(1.15, 1.25, p.y))
        colour = mix(belly, top, max(keep, smoothstep(line - 0.02, line + 0.02, p.z)))
        for side in (-1, 1):
            colour = mix(colour, blush, 0.8 * smoothstep(1.0, 0.3, inside(p, (side * 0.42, -0.62, z - 0.02), (0.06, 0.1, 0.06))))
        # Inside the mouth: rosy gums at the lips, dark deeper in.
        inner = mouth_depth(p)
        if inner:
            colour = mix(colour, mix(gum, throat, inner), smoothstep(0.0, 0.15, inner))
        return colour

    finish(body, colour_at, style)

    teeth = surface('teeth', style, '#fbfaf6')
    for i, (point, normal, pointing, size) in enumerate(teeth_at):
        tooth = cone(f'tooth_{i}', (0, 0, 0), size * 0.45, size)
        aim(tooth, Vector(pointing) - normal * 0.25)
        # Upper teeth hang from a near-upright lip and sit a touch inside it; the lower lip
        # faces down and out, so its teeth sit a touch outside or they vanish into the chin.
        offset = -0.015 if pointing[2] < 0 else 0.012
        tooth.location = point + normal * offset + Vector(pointing) * size * 0.45
        give(tooth, teeth)

    # One eye on each side of the head, above the corner of the mouth, looking out and a
    # little forward.
    radius = 0.13
    for side in (-1, 1):
        point, normal = on_side(side, -0.6, z + 0.1)
        eye = eyeball(f'eye_{side}', radius, '#2f3a52')
        eye.location = point + normal * radius * 0.1
        aim(eye, normal * 0.65 + Vector((0, -0.75, 0.05)), axis=(0, -1, 0))

    # Gills: five thin curved seams a shade darker than the body on each side.
    seam = surface('seam', style, shade_hex(c['body'], 0.7))
    for side in (-1, 1):
        for k in range(5):
            y = -0.3 + k * 0.075
            points = [(side * 0.505, y, z + 0.12), (side * 0.522, y + 0.012, z + 0.03), (side * 0.51, y + 0.004, z - 0.06)]
            give(tube(f'gill_{side}_{k}', points, [0.007] * 3), seam)

    if accessory == 'hat':
        wizard_hat((0, -0.33, z + 0.43), 0.8, style, tilt=(0.2, -0.1, 0))

    # Turn the whole shark to show its side.
    root = gather('shark')
    root.rotation_euler = (-0.05, 0, math.radians(58))
    root.scale = (1.25, 1.25, 1.25)
    root.location = (0.1, 0, -0.3)


if __name__ == '__main__':
    options = args()
    reset()
    build(options['style'], options['coat'] or 'ocean', options.get('accessory', 'hat'))
    stage(target=(0, 0, 1.25), distance=8.0)
    render(os.path.abspath(options['out']), int(options['samples']), int(options['size']))
