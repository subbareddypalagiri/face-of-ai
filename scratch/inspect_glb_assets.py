import os
import glob
import hashlib
import json
import struct

def inspect_glb(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        data = f.read()
        h.update(data)
    sha = h.hexdigest()
    size = len(data)
    
    magic, version, length = struct.unpack('<4sII', data[:12])
    gltf_json = {}
    if magic == b'glTF':
        chunk_len, chunk_type = struct.unpack('<II', data[12:20])
        if chunk_type == 0x4E4F534A: # JSON
            json_bytes = data[20:20+chunk_len]
            gltf_json = json.loads(json_bytes.decode('utf-8'))
            
    images = gltf_json.get('images', [])
    textures = gltf_json.get('textures', [])
    materials = gltf_json.get('materials', [])
    meshes = gltf_json.get('meshes', [])
    nodes = gltf_json.get('nodes', [])
    asset_meta = gltf_json.get('asset', {})
    
    print(f"=== {os.path.basename(filepath)} ===")
    print(f"  Path: {filepath}")
    print(f"  Size: {size:,} bytes")
    print(f"  SHA-256: {sha}")
    print(f"  Generator: {asset_meta.get('generator', 'Unknown')}")
    print(f"  Meshes: {len(meshes)} | Nodes: {len(nodes)} | Materials: {len(materials)}")
    print(f"  Textures: {len(textures)} | Embedded Images: {len(images)}")
    if images:
        for idx, img in enumerate(images):
            name = img.get('name', f'image_{idx}')
            mime = img.get('mimeType', 'N/A')
            print(f"    - Image [{idx}]: {name} ({mime})")
    else:
        print("    - NONE (No image textures; uses procedural BSDF color parameters only)")
    print("  Materials:")
    for mat in materials:
        mname = mat.get('name', 'unnamed')
        pbr = mat.get('pbrMetallicRoughness', {})
        base_color = pbr.get('baseColorFactor', None)
        metal = pbr.get('metallicFactor', None)
        rough = pbr.get('roughnessFactor', None)
        has_tex = 'baseColorTexture' in pbr
        print(f"    - {mname} (PBR BaseColor: {base_color}, Metal: {metal}, Rough: {rough}, TexMap: {has_tex})")
    print()

print(">>> ASSET INVENTORY & AUDIT")
glbs = sorted(glob.glob('assets/models/*.glb') + glob.glob('*.glb'))
for g in glbs:
    inspect_glb(g)
