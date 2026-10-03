"""The parrot, rendered. See common.py for how to run it."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import (  # noqa: E402
    args, ellipsoid, eyes, finish, fuse, gather, give, hex_color, inside, mix, place, render, reset, smoothstep, solid,
    stage, surface, tube, wizard_hat,
)

COATS = {
    'scarlet': {'body': '#d63a2b', 'wing': '#2f6fcf', 'band': '#f2c230', 'face': '#f6efe6', 'beak': '#efe6d6', 'lower': '#3a3036'},
    'bluegold': {'body': '#2f80d4', 'chest': '#f2b632', 'wing': '#2f80d4', 'band': '#1f5aa6', 'face': '#f6efe6', 'beak': '#2e2a2c', 'lower': '#2e2a2c'},
    'green': {'body': '#5aa83f', 'chest': '#8cc85a', 'wing': '#3c8a2c', 'band': '#2f6fcf', 'forehead': '#d63a2b', 'beak': '#e8c96a', 'lower': '#c9a548'},
    'cockatoo': {'body': '#f7f4ee', 'wing': '#ece6da', 'band': '#f5d04a', 'beak': '#3a3a3a', 'lower': '#3a3a3a'},
}

HEAD = ((0, -0.04, 2.08), (0.44, 0.42, 0.42))


def build(style, coat, accessory='hat'):
    c = COATS[coat]
    body_colour = hex_color(c['body'])
    chest = hex_color(c.get('chest', c['body']))
    face = hex_color(c['face']) if 'face' in c else None
    forehead = hex_color(c['forehead']) if 'forehead' in c else None
    blush = hex_color('#f09aa4')

    # A felt branch to sit on, with a leaf.
    solid(tube('branch', [(-1.0, -0.06, 0.7), (0, -0.09, 0.75), (1.0, -0.04, 0.8)], [0.085, 0.09, 0.08]), '#7a5232', style)
    solid(place(ellipsoid('leaf', (0, 0, 0), (0.08, 0.04, 0.17), 24), (0.85, -0.1, 0.95), (0.3, 0, -0.6)), '#5f9a45', style)
    for side in (-1, 1):
        solid(ellipsoid(f'foot_{side}', (side * 0.15, -0.13, 0.84), (0.1, 0.14, 0.06), 24), '#7b7b82', style)

    # A round egg of a body, the head on top.
    body = fuse('body', [
        ellipsoid('belly', (0, 0.02, 1.15), (0.42, 0.4, 0.42)),
        ellipsoid('upper', (0, 0, 1.5), (0.4, 0.38, 0.38)),
    ])
    head = fuse('head', [ellipsoid('skull', *HEAD)], voxel=0.012)

    def colour_at(p):
        colour = mix(body_colour, chest, smoothstep(1.0, 0.8, inside(p, (0, -0.32, 1.25), (0.32, 0.2, 0.42))))
        for side in (-1, 1):
            if face:
                # Macaws: a pale patch around each eye; it frames the eye, the eye itself stays dark.
                colour = mix(colour, face, smoothstep(1.0, 0.85, inside(p, (side * 0.2, -0.36, 2.1), (0.15, 0.12, 0.17))))
            colour = mix(colour, blush, 0.8 * smoothstep(1.0, 0.3, inside(p, (side * 0.3, -0.32, 1.97), (0.09, 0.12, 0.06))))
        if forehead:
            colour = mix(colour, forehead, smoothstep(1.0, 0.8, inside(p, (0, -0.3, 2.34), (0.2, 0.18, 0.12))))
        return colour

    for part in (body, head):
        finish(part, colour_at, style)

    # Wings fold along the sides: the main colour with a band near the shoulder.
    wing, band = hex_color(c['wing']), hex_color(c['band'])
    for side in (-1, 1):
        w = place(ellipsoid(f'wing_{side}', (0, 0, 0), (0.13, 0.3, 0.46), 40), (side * 0.41, 0.06, 1.3), (0.12, 0, side * 0.07))
        finish(w, lambda p: mix(wing, band, smoothstep(1.4, 1.52, p.z)), style)

    # Tail feathers hang down behind the branch.
    for spread in (-0.18, 0, 0.18):
        feather = place(ellipsoid(f'tail_{spread}', (0, 0, 0), (0.09, 0.05, 0.44), 32), (spread * 0.8, 0.34, 0.45), (-0.35, spread, 0))
        solid(feather, c['wing'], style)

    eyes(*HEAD, iris='#3a2a1e', y_offset=0.04, spacing=0.45, yaw=0.35, style=style)

    # The beak: a hooked upper half over a small dark lower half.
    give(tube('beak', [(0, -0.34, 2.0), (0, -0.5, 1.99), (0, -0.57, 1.89), (0, -0.53, 1.78)], [0.13, 0.11, 0.07, 0.025]), surface('beak', style, c['beak']))
    give(ellipsoid('lower_beak', (0, -0.42, 1.86), (0.09, 0.08, 0.07), 32), surface('lower', style, c['lower']))

    if accessory == 'hat':
        wizard_hat((0.0, 0.0, 2.47), 0.9, style)

    # A bird is smaller than a cat; scaled up so the four sit together at one size.
    gather('parrot').scale = (1.15, 1.15, 1.15)


if __name__ == '__main__':
    options = args()
    reset()
    build(options['style'], options['coat'] or 'scarlet', options.get('accessory', 'hat'))
    stage(target=(0, 0, 1.75), distance=8.4)
    render(os.path.abspath(options['out']), int(options['samples']), int(options['size']))
