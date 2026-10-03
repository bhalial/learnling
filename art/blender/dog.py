"""The dog, rendered. See common.py for how to run it."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import (  # noqa: E402
    INK, args, bell_collar, ellipsoid, eyes, finish, fuse, give, glossy, glow, hex_color, inside, mix, place, render,
    reset, smoothstep, solid, stage, tube, wizard_hat,
)

COATS = {
    'golden': {'fur': '#dba65f', 'light': '#f8e9c8', 'ear': '#b07a3a', 'eye': '#4a2c18'},
    'chocolate': {'fur': '#74472b', 'light': '#c9a07a', 'ear': '#55321d', 'eye': '#2e1a0e'},
    'husky': {'fur': '#7c8591', 'light': '#f4f4f0', 'ear': '#5b636e', 'eye': '#2f4f78'},
    'snow': {'fur': '#f1ece2', 'light': '#ffffff', 'ear': '#d8c4a4', 'eye': '#3b2618'},
}

HEAD = ((0, -0.02, 1.58), (0.74, 0.64, 0.64))


def build(style, coat, accessory='hat'):
    c = COATS[coat]
    base, light = hex_color(c['fur']), hex_color(c['light'])
    blush = hex_color('#f09aa4')

    body = fuse('body', [
        ellipsoid('torso', (0, 0.02, 0.56), (0.76, 0.64, 0.6)),
        ellipsoid('chest', (0, 0, 0.95), (0.52, 0.46, 0.38)),
        ellipsoid('haunch_l', (-0.5, 0.08, 0.3), (0.31, 0.43, 0.29)),
        ellipsoid('haunch_r', (0.5, 0.08, 0.3), (0.31, 0.43, 0.29)),
        ellipsoid('paw_l', (-0.28, -0.54, 0.13), (0.21, 0.28, 0.14)),
        ellipsoid('paw_r', (0.28, -0.54, 0.13), (0.21, 0.28, 0.14)),
        # A short tail that stands up and curls a little to the side.
        tube('tail', [(0.2, 0.52, 0.34), (0.48, 0.7, 0.55), (0.64, 0.62, 0.84)], [0.13, 0.12, 0.1]),
    ])

    # A round head with a soft snout in front.
    head = fuse('head', [
        ellipsoid('skull', *HEAD),
        ellipsoid('snout', (0, -0.6, 1.36), (0.33, 0.3, 0.23)),
    ], voxel=0.013)

    def colour_at(p):
        colour = base
        for center, radii in (
            ((0, -0.5, 0.62), (0.44, 0.3, 0.46)),          # chest
            ((0, -0.66, 1.33), (0.4, 0.28, 0.26)),         # snout
            ((-0.28, -0.58, 0.11), (0.25, 0.3, 0.18)),     # paws
            ((0.28, -0.58, 0.11), (0.25, 0.3, 0.18)),
            ((0.64, 0.62, 0.86), (0.16, 0.16, 0.16)),      # tail tip
        ):
            colour = mix(colour, light, smoothstep(1.0, 0.86, inside(p, center, radii)))
        for side in (-1, 1):
            # Little eyebrow dots make the face expressive.
            colour = mix(colour, light, smoothstep(1.0, 0.7, inside(p, (side * 0.27, -0.55, 1.95), (0.09, 0.1, 0.06))))
            colour = mix(colour, blush, 0.85 * smoothstep(1.0, 0.3, inside(p, (side * 0.45, -0.5, 1.4), (0.13, 0.2, 0.08))))
        return colour

    for part in (body, head):
        finish(part, colour_at, style)

    # Floppy ears hang down the sides of the head.
    for side in (-1, 1):
        ear = ellipsoid(f'ear_{side}', (0, 0, 0), (0.2, 0.11, 0.42), 40)
        place(ear, (side * 0.64, 0.02, 1.4), (0.1, side * 0.14, 0))
        solid(ear, c['ear'], style)

    eyes(*HEAD, iris=c['eye'], y_offset=0.1, spacing=0.4, style=style)

    # A shiny black nose with a little highlight, and a soft smile under it.
    give(ellipsoid('nose', (0, -0.9, 1.45), (0.13, 0.08, 0.09), 40), glossy('nose', '#1d1410', 0.18))
    give(ellipsoid('nose_shine', (-0.04, -0.965, 1.49), (0.035, 0.012, 0.022), 12), glow('shine'))
    ink = glossy('ink', INK, 0.4)
    give(tube('philtrum', [(0, -0.92, 1.37), (0, -0.925, 1.31)], [0.013, 0.013]), ink)
    for side in (-1, 1):
        give(tube(f'smile_{side}', [(0, -0.925, 1.31), (side * 0.07, -0.915, 1.27), (side * 0.15, -0.88, 1.3)], [0.013] * 3), ink)

    if accessory == 'hat':
        wizard_hat((0.02, 0.02, 2.17), 1.0, style)
    if accessory == 'collar':
        bell_collar((0, -0.02, 1.06), 0.52, style)


if __name__ == '__main__':
    options = args()
    reset()
    build(options['style'], options['coat'] or 'golden', options.get('accessory', 'hat'))
    stage()
    render(os.path.abspath(options['out']), int(options['samples']), int(options['size']))
