"""
Shared pieces for rendering Spellbook's study buddies in Blender (Cycles).

Run an animal script headless, for example:
    blender --background --python art/blender/cat.py -- --style plush --out art/renders/cat-plush.png

The rules from docs/companions.md still hold: chibi proportions, eyes sized and
spaced from the head, dark glossy eyes with highlights from the upper left,
blush on every animal, a warm storybook light.
"""

import math
import sys

import bpy
import bmesh
from mathutils import Vector

# ——— Command line ———

def args():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    options = {'style': 'plush', 'out': '//render.png', 'samples': '192', 'size': '1024', 'coat': ''}
    for i in range(0, len(argv) - 1, 2):
        options[argv[i].lstrip('-')] = argv[i + 1]
    return options


# ——— Scene ———

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    return scene


def hex_color(value, alpha=1.0):
    """'#e38a3c' → linear RGBA, the space Blender's colour sockets work in."""
    value = value.lstrip('#')
    srgb = [int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*linear, alpha)


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(4))


def shade_hex(value, factor):
    """A hex colour made darker (factor < 1) or lighter (> 1), for seams and markings."""
    value = value.lstrip('#')
    channels = [min(255, int(int(value[i:i + 2], 16) * factor)) for i in (0, 2, 4)]
    return '#' + ''.join(f'{c:02x}' for c in channels)


# ——— Shapes ———

def ellipsoid(name, center, radii, segments=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=segments // 2, location=center)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = radii
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def cone(name, center, radius, depth, scale=(1, 1, 1), rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=radius, radius2=radius * 0.08, depth=depth, location=center, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return obj


def tube(name, points, radii, bevel=1.0, resolution=24):
    """A smooth tube through `points`, thick `bevel * radius` at each point (tails, whiskers)."""
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = bevel
    curve.bevel_resolution = 6
    curve.resolution_u = resolution
    curve.use_fill_caps = True
    spline = curve.splines.new('NURBS')
    spline.points.add(len(points) - 1)
    for point, p, r in zip(spline.points, points, radii):
        point.co = (*p, 1)
        point.radius = r
    spline.use_endpoint_u = True
    spline.order_u = min(4, len(points))
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    return bpy.context.active_object


def flat_shape(name, outline, thickness, location=(0, 0, 0), rotation=(0, 0, 0)):
    """A flat piece with some thickness from a 2D outline (fins, flukes). The outline is
    drawn in the local XZ plane (x along, z up); the thickness runs along local Y.
    Fused into a body, the voxel remesh rounds its edges into soft plush."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    verts = [bm.verts.new((x, 0, z)) for x, z in outline]
    bm.faces.new(verts)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    thick = obj.modifiers.new('thick', 'SOLIDIFY')
    thick.thickness = thickness
    thick.offset = 0
    bpy.ops.object.modifier_apply(modifier=thick.name)
    obj.location = location
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return obj


def hit(obj, origin, direction):
    """Where a ray from `origin` along `direction` meets the skin of `obj` (world space),
    and the skin's outward normal there; (None, None) if it misses. Used to set eyes,
    mouths and teeth exactly on a fused, sculpted surface."""
    bpy.context.view_layer.update()
    inverse = obj.matrix_world.inverted()
    local_origin = inverse @ Vector(origin)
    local_direction = (inverse.to_3x3() @ Vector(direction)).normalized()
    found, location, normal, _ = obj.ray_cast(local_origin, local_direction)
    if not found:
        return None, None
    return obj.matrix_world @ location, (obj.matrix_world.to_3x3() @ normal).normalized()


def aim(obj, direction, axis=(0, 0, 1)):
    """Turns `obj` so its local `axis` points along `direction`."""
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = Vector(axis).rotation_difference(Vector(direction).normalized())
    return obj


def fuse(name, parts, voxel=0.016, smooth=6):
    """Melts parts into one seamless sculpted shape (voxel remesh, then smoothing)."""
    bpy.ops.object.select_all(action='DESELECT')
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    remesh = obj.modifiers.new('remesh', 'REMESH')
    remesh.mode = 'VOXEL'
    remesh.voxel_size = voxel
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    soften = obj.modifiers.new('soften', 'SMOOTH')
    soften.factor = 0.6
    soften.iterations = smooth
    bpy.ops.object.modifier_apply(modifier=soften.name)
    bpy.ops.object.shade_smooth()
    return obj


def fuzz(obj, depth=0.02, layers=3):
    """Short plush fuzz, the way games draw fur: a few see-through shells just above the
    skin, each with fewer specks than the one below. They copy the skin, so they carry
    its painted colours too. They cast no shadow: stacked shells shadowing each other
    turn every colour muddy."""
    for i in range(1, layers + 1):
        shell = obj.copy()
        shell.data = obj.data.copy()
        shell.name = f'{obj.name}_fuzz{i}'
        shell.visible_shadow = False
        bpy.context.collection.objects.link(shell)
        grow = shell.modifiers.new('grow', 'DISPLACE')
        grow.mid_level = 0
        grow.strength = depth * i / layers

        material, nodes, links, bsdf = _principled(f'{shell.name}_mat')
        attribute = nodes.new('ShaderNodeVertexColor')
        attribute.layer_name = 'Col'
        links.new(attribute.outputs['Color'], bsdf.inputs['Base Color'])
        bsdf.inputs['Roughness'].default_value = 1.0
        bsdf.inputs['Sheen Weight'].default_value = 1.0
        bsdf.inputs['Sheen Roughness'].default_value = 0.3
        # Fine specks; higher shells keep only the tallest ones.
        noise = nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 900
        noise.inputs['Detail'].default_value = 2
        ramp = nodes.new('ShaderNodeValToRGB')
        cut = 0.52 + 0.08 * i
        ramp.color_ramp.elements[0].position = cut
        ramp.color_ramp.elements[1].position = min(cut + 0.04, 1.0)
        links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
        links.new(ramp.outputs['Color'], bsdf.inputs['Alpha'])
        give(shell, material)


def roughen(obj, strength=0.012, size=0.22):
    """Hand-made unevenness for clay: a gentle lumpy displacement."""
    texture = bpy.data.textures.new(f'{obj.name}_lumps', 'CLOUDS')
    texture.noise_scale = size
    displace = obj.modifiers.new('lumps', 'DISPLACE')
    displace.texture = texture
    displace.strength = strength
    displace.mid_level = 0.5
    return displace


def paint(obj, colour_at):
    """Vertex colours from a function of position: patches, stripes and blush painted on."""
    # A part that was just moved only reports its new place after an update.
    bpy.context.view_layer.update()
    mesh = obj.data
    attribute = mesh.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    for i, vertex in enumerate(mesh.vertices):
        attribute.data[i].color = colour_at(obj.matrix_world @ vertex.co)
    mesh.color_attributes.active_color = attribute


def finish(obj, colour_at, style):
    """Paints a fused shape, gives it the style's material, and the fuzz or lumps that go with it."""
    paint(obj, colour_at)
    give(obj, surface(f'{obj.name}_skin', style, use_vertex_colors=True))
    if style == 'plush':
        fuzz(obj)
    if style == 'clay':
        roughen(obj)
    return obj


def solid(obj, color, style):
    """A one-colour piece (an ear, a wing) finished the same way as the body."""
    rgba = hex_color(color)
    return finish(obj, lambda p: rgba, style)


def gather(name='animal'):
    """Hangs everything built so far under one empty, so the whole animal can be turned."""
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    for obj in list(bpy.context.scene.objects):
        if obj is not root and obj.parent is None:
            obj.parent = root
    return root


def smoothstep(edge0, edge1, x):
    t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)


def inside(point, center, radii):
    """< 1 inside an ellipsoid, 1 on its skin."""
    return math.sqrt(sum(((point[i] - center[i]) / radii[i]) ** 2 for i in range(3)))


def place(obj, location=None, rotation=None):
    if location is not None:
        obj.location = location
    if rotation is not None:
        obj.rotation_euler = rotation
    return obj


# ——— Materials ———
# One family per style; every piece of an animal uses the same family so they belong together.

def _principled(name):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    return material, nodes, material.node_tree.links, bsdf


def _bump(nodes, links, bsdf, scale, strength, detail=8):
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = scale
    noise.inputs['Detail'].default_value = detail
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = strength
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])


def surface(name, style, color=None, use_vertex_colors=False):
    """The animal's skin, fur or felt. `color` is a hex string unless vertex colours are used."""
    material, nodes, links, bsdf = _principled(name)
    if use_vertex_colors:
        attribute = nodes.new('ShaderNodeVertexColor')
        attribute.layer_name = 'Col'
        links.new(attribute.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        bsdf.inputs['Base Color'].default_value = hex_color(color)

    if style == 'plush':
        bsdf.inputs['Roughness'].default_value = 0.95
        bsdf.inputs['Sheen Weight'].default_value = 1.0
        bsdf.inputs['Sheen Roughness'].default_value = 0.35
        bsdf.inputs['Subsurface Weight'].default_value = 0.12
        bsdf.inputs['Subsurface Scale'].default_value = 0.04
        _bump(nodes, links, bsdf, scale=160, strength=0.28)
    elif style == 'vinyl':
        bsdf.inputs['Roughness'].default_value = 0.38
        bsdf.inputs['Coat Weight'].default_value = 0.35
        bsdf.inputs['Coat Roughness'].default_value = 0.18
        bsdf.inputs['Subsurface Weight'].default_value = 0.05
        bsdf.inputs['Subsurface Scale'].default_value = 0.03
    else:  # clay
        bsdf.inputs['Roughness'].default_value = 0.68
        bsdf.inputs['Subsurface Weight'].default_value = 0.2
        bsdf.inputs['Subsurface Scale'].default_value = 0.05
        # Fingerprints and tool marks: fine wavy rings over a soft lumpy noise.
        wave = nodes.new('ShaderNodeTexWave')
        wave.wave_type = 'RINGS'
        wave.inputs['Scale'].default_value = 9
        wave.inputs['Distortion'].default_value = 6
        wave.inputs['Detail'].default_value = 3
        noise = nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 22
        add = nodes.new('ShaderNodeMath')
        add.operation = 'ADD'
        links.new(wave.outputs['Fac'], add.inputs[0])
        links.new(noise.outputs['Fac'], add.inputs[1])
        bump = nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.09
        bump.inputs['Distance'].default_value = 0.01
        links.new(add.outputs['Value'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return material


def glossy(name, color, roughness=0.06):
    """Safety-eye glass: dark, smooth, with a clear coat that catches the lights."""
    material, nodes, links, bsdf = _principled(name)
    bsdf.inputs['Base Color'].default_value = hex_color(color)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Coat Weight'].default_value = 1.0
    bsdf.inputs['Coat Roughness'].default_value = 0.02
    return material


def glow(name, color='#ffffff', strength=4.0):
    """The cartoon highlights in the eyes, so they read the same in every render."""
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.remove(nodes.get('Principled BSDF'))
    emission = nodes.new('ShaderNodeEmission')
    emission.inputs['Color'].default_value = hex_color(color)
    emission.inputs['Strength'].default_value = strength
    material.node_tree.links.new(emission.outputs['Emission'], nodes.get('Material Output').inputs['Surface'])
    return material


def give(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    return obj


# ——— Shared face (docs/companions.md) ———

FACE_EYE = 0.25      # eye height as a share of the head's half-width
FACE_SPACING = 0.38  # eye distance from the middle, same unit
INK = '#2b2118'


def eyes(head_center, head_radii, iris, y_offset=0.06, spacing=FACE_SPACING, yaw=0.28, style='plush'):
    """Two dark glossy eyes on the front of the head, with the shared highlights."""
    half_width = head_radii[0]
    radius = half_width * FACE_EYE
    out = []
    for side in (-1, 1):
        x = side * half_width * spacing
        z = head_center[2] + y_offset
        # Sit the eye on the skin of the head ellipsoid, a little sunk in.
        skin = 1 - (x / head_radii[0]) ** 2 - ((z - head_center[2]) / head_radii[2]) ** 2
        y = head_center[1] - head_radii[1] * math.sqrt(max(skin, 0.05)) + radius * 0.22
        holder = eyeball(f'eye_{side}', radius, iris)
        holder.location = (head_center[0] + x, y, z)
        holder.rotation_euler = (0, 0, -side * yaw)
        out.append(holder)
    return out


def eyeball(name, radius, iris):
    """One dark glossy eye looking along -Y: a ring of iris colour, a big pupil, the two
    glowing highlights from the upper left. Returns its holder, to place and turn."""
    holder = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(holder)
    ring = ellipsoid(f'{name}_iris', (0, 0, 0), (radius * 0.8, radius * 0.5, radius), 40)
    give(ring, glossy(f'{name}_iris', iris, 0.12))
    # A big pupil leaves only a ring of colour; a small one stares.
    pupil = ellipsoid(f'{name}_pupil', (0, -radius * 0.16, -radius * 0.04), (radius * 0.64, radius * 0.42, radius * 0.82), 40)
    give(pupil, glossy(f'{name}_pupil', '#120b08'))
    big = ellipsoid(f'{name}_shine', (-radius * 0.26, -radius * 0.5, radius * 0.34), (radius * 0.2, radius * 0.08, radius * 0.24), 16)
    small = ellipsoid(f'{name}_shine2', (radius * 0.24, -radius * 0.48, -radius * 0.24), (radius * 0.09, radius * 0.05, radius * 0.09), 12)
    give(big, glow('shine'))
    give(small, glow('shine'))
    for piece in (ring, pupil, big, small):
        piece.parent = holder
    return holder


# ——— Accessories ———

def wizard_hat(location, size, style, tilt=(0.06, -0.12, 0)):
    """The shared wizard hat, felt or vinyl to match the animal. Its brim rests at `location`,
    which should be on top of the head, not sunk into it."""
    root = bpy.data.objects.new('hat', None)
    bpy.context.collection.objects.link(root)
    root.location = location
    root.rotation_euler = tilt
    brim = ellipsoid('hat_brim', (0, 0, 0.02 * size), (0.4 * size, 0.4 * size, 0.04 * size))
    crown = cone('hat_crown', (0, 0, 0.42 * size), 0.3 * size, 0.82 * size)
    band = ellipsoid('hat_band', (0, 0, 0.1 * size), (0.285 * size, 0.285 * size, 0.055 * size))
    star = ellipsoid('hat_star', (0, 0, 0.84 * size), (0.065 * size,) * 3, 16)
    give(brim, surface('hat', style, '#3c2d73'))
    give(crown, surface('hat2', style, '#4b3a8c'))
    give(band, surface('band', style, '#c79a3a'))
    give(star, glossy('star', '#e3b54a', 0.3))
    for piece in (brim, crown, band, star):
        piece.parent = root
    return root


def bell_collar(center, radius, style):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=0.055, major_segments=64, minor_segments=16, location=center)
    ring = give(bpy.context.active_object, surface('collar', style, '#a32c25'))
    bpy.ops.object.shade_smooth()
    bell = ellipsoid('bell', (center[0], center[1] - radius - 0.02, center[2] - 0.08), (0.09, 0.09, 0.09), 24)
    give(bell, glossy('bell', '#e3b54a', 0.25))
    return ring


# ——— Light, camera, render ———

def stage(target=(0, 0, 1.25), distance=7.2, yaw=18, pitch=14, lens=70):
    """Warm storybook studio: a soft key from the upper left (where the eye highlights
    come from), a cool fill, a warm rim, and a shadow catcher on the ground."""
    scene = bpy.context.scene

    world = bpy.data.worlds.new('world')
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get('Background')
    background.inputs['Color'].default_value = hex_color('#5a4030')
    background.inputs['Strength'].default_value = 0.35

    def area(name, location, color, energy, size):
        light = bpy.data.lights.new(name, 'AREA')
        light.color = hex_color(color)[:3]
        light.energy = energy
        light.size = size
        obj = bpy.data.objects.new(name, light)
        scene.collection.objects.link(obj)
        obj.location = location
        direction = Vector(target) - Vector(location)
        obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        return obj

    area('key', (-2.6, -3.4, 5.6), '#ffe4c4', 620, 2.6)
    area('fill', (4.2, -3.2, 2.0), '#dbe6ff', 150, 4.0)
    area('rim', (2.2, 3.8, 4.2), '#ffd9a8', 480, 2.2)

    # A small round shadow catcher: a soft shadow right under the animal, nothing more.
    bpy.ops.mesh.primitive_circle_add(vertices=64, radius=1.6, fill_type='NGON', location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = 'ground'
    ground.is_shadow_catcher = True

    camera_data = bpy.data.cameras.new('camera')
    camera_data.lens = lens
    camera = bpy.data.objects.new('camera', camera_data)
    scene.collection.objects.link(camera)
    # Animals face -Y. A positive yaw swings the camera towards +X (the animal's left
    # side, where the tail curls), a positive pitch lifts it.
    yaw_r, pitch_r = math.radians(yaw), math.radians(pitch)
    camera.location = (
        target[0] + distance * math.sin(yaw_r) * math.cos(pitch_r),
        target[1] - distance * math.cos(yaw_r) * math.cos(pitch_r),
        target[2] + distance * math.sin(pitch_r),
    )
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = camera


def render(out, samples=192, size=1024):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == 'OPTIX'
    scene.cycles.device = 'GPU'
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = -0.35
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)


DESK = '#2e2016'


def on_desk(paths, out, background=DESK):
    """Puts transparent renders side by side on the app's desk colour, to judge them
    where they will live (a white background flatters and misleads)."""
    import numpy as np

    images = [bpy.data.images.load(path) for path in paths]
    width, height = images[0].size
    bg = np.array([int(background.lstrip('#')[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [1.0], dtype=np.float32)
    sheet = np.zeros((height, width * len(images), 4), dtype=np.float32)
    for i, image in enumerate(images):
        pixels = np.array(image.pixels[:], dtype=np.float32).reshape(height, width, 4)
        alpha = pixels[:, :, 3:4]
        sheet[:, i * width:(i + 1) * width, :3] = pixels[:, :, :3] * alpha + bg[:3] * (1 - alpha)
        sheet[:, i * width:(i + 1) * width, 3] = 1
    result = bpy.data.images.new('sheet', width * len(images), height, alpha=True)
    result.pixels[:] = sheet.ravel()
    result.filepath_raw = out
    result.file_format = 'PNG'
    result.save()
