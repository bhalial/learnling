"""The cat, rendered. See common.py for how to run it."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import (  # noqa: E402
    INK, args, bell_collar, cone, ellipsoid, eyes, finish, fuse, give, glossy, hex_color, inside, mix, render, reset,
    smoothstep, stage, surface, tube, wizard_hat,
)

COATS = {
    'ginger': {'fur': '#e0782a', 'light': '#fbe2c2', 'stripe': '#b85a18', 'eye': '#4a7322'},
    'midnight': {'fur': '#3d3749', 'light': '#8a82a0', 'stripe': '#2c2836', 'eye': '#8fa92a'},
    'silver': {'fur': '#a9afbc', 'light': '#f1f2f5', 'stripe': '#868d9c', 'eye': '#b07a1e'},
    'cream': {'fur': '#efe2cc', 'light': '#fffaf2', 'stripe': '#d8c3a0', 'eye': '#2f6fa8'},
}

HEAD = ((0, -0.02, 1.58), (0.78, 0.66, 0.66))


def build(style, coat, accessory='hat'):
    c = COATS[coat]
    base, light, stripe = hex_color(c['fur']), hex_color(c['light']), hex_color(c['stripe'])
    blush, pink = hex_color('#f09aa4'), hex_color('#f0a6ae')

    # Body: a sitting pear with haunches, two front paws and a curling tail.
    body = fuse('body', [
        ellipsoid('torso', (0, 0.02, 0.56), (0.74, 0.62, 0.6)),
        ellipsoid('chest', (0, 0, 0.95), (0.5, 0.44, 0.38)),
        ellipsoid('haunch_l', (-0.48, 0.08, 0.3), (0.3, 0.42, 0.28)),
        ellipsoid('haunch_r', (0.48, 0.08, 0.3), (0.3, 0.42, 0.28)),
        ellipsoid('paw_l', (-0.27, -0.52, 0.12), (0.2, 0.27, 0.13)),
        ellipsoid('paw_r', (0.27, -0.52, 0.12), (0.2, 0.27, 0.13)),
        tube('tail', [(0.3, 0.5, 0.18), (0.75, 0.48, 0.14), (1.04, 0.2, 0.22), (1.1, -0.12, 0.52), (0.95, -0.24, 0.86)],
             [0.13, 0.125, 0.115, 0.105, 0.095]),
    ])

    # Head: big and round, with cheeks for a muzzle and two tall ears.
    head = fuse('head', [
        ellipsoid('skull', *HEAD),
        ellipsoid('cheek_l', (-0.15, -0.58, 1.36), (0.21, 0.16, 0.16)),
        ellipsoid('cheek_r', (0.15, -0.58, 1.36), (0.21, 0.16, 0.16)),
        cone('ear_l', (-0.45, -0.04, 2.1), 0.27, 0.54, scale=(1, 0.5, 1), rotation=(0, -0.36, 0)),
        cone('ear_r', (0.45, -0.04, 2.1), 0.27, 0.54, scale=(1, 0.5, 1), rotation=(0, 0.36, 0)),
    ], voxel=0.013)

    def colour_at(p):
        colour = base
        # Pale chest, muzzle and paws.
        patches = (
            ((0, -0.5, 0.62), (0.42, 0.3, 0.46)),          # chest
            ((0, -0.6, 1.36), (0.36, 0.25, 0.22)),         # muzzle
            ((-0.27, -0.56, 0.1), (0.24, 0.3, 0.17)),      # left paw
            ((0.27, -0.56, 0.1), (0.24, 0.3, 0.17)),       # right paw
        )
        for center, radii in patches:
            colour = mix(colour, light, smoothstep(1.0, 0.86, inside(p, center, radii)))
        # Tabby marks on the forehead and a dark tail tip.
        if p.z > 1.86 and p.y < -0.15:
            x = abs(p.x)
            if x < 0.045 or (0.12 < x < 0.17 and p.z > 1.92):
                colour = stripe
        colour = mix(colour, stripe, smoothstep(0.26, 0.16, (p - type(p)((0.95, -0.24, 0.86))).length))
        # Pink inside the ears, and blush on both cheeks.
        for side in (-1, 1):
            colour = mix(colour, pink, smoothstep(1.0, 0.8, inside(p, (side * 0.43, -0.16, 2.08), (0.13, 0.12, 0.2))))
            colour = mix(colour, blush, 0.85 * smoothstep(1.0, 0.3, inside(p, (side * 0.47, -0.52, 1.42), (0.13, 0.2, 0.08))))
        return colour

    for part in (body, head):
        finish(part, colour_at, style)

    # Face details.
    eyes(*HEAD, iris=c['eye'], style=style)
    give(ellipsoid('nose', (0, -0.725, 1.47), (0.085, 0.05, 0.055), 32), surface('nose', style, '#e58a9a'))
    ink = glossy('ink', INK, 0.4)
    for side in (-1, 1):
        give(tube(f'mouth_{side}', [(0, -0.715, 1.41), (side * 0.05, -0.725, 1.365), (side * 0.11, -0.705, 1.385)], [0.014] * 3), ink)
        for k in range(3):
            z = 1.42 - k * 0.055
            give(tube(f'whisker_{side}_{k}', [(side * 0.36, -0.62, z), (side * 0.62, -0.62, z + (1 - k) * 0.03), (side * 0.86, -0.56, z + (1 - k) * 0.07)], [0.009] * 3), ink)

    if accessory == 'hat':
        wizard_hat((0.02, 0.02, 2.2), 1.0, style)
    if accessory == 'collar':
        bell_collar((0, -0.02, 1.06), 0.5, style)


if __name__ == '__main__':
    options = args()
    reset()
    build(options['style'], options['coat'] or 'ginger', options.get('accessory', 'hat'))
    stage()
    render(os.path.abspath(options['out']), int(options['samples']), int(options['size']))
