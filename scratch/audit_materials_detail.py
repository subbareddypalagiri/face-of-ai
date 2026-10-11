import bpy

print("=== MATERIALS & TEXTURES AUDIT START ===")

for mat in bpy.data.materials:
    print(f"\nMATERIAL: {mat.name} (use_nodes={mat.use_nodes})")
    if mat.use_nodes and mat.node_tree:
        for node in mat.node_tree.nodes:
            inputs = []
            if node.type == 'BSDF_PRINCIPLED':
                for inp_name in ['Base Color', 'Metallic', 'Roughness', 'IOR', 'Normal']:
                    if inp_name in node.inputs:
                        inp = node.inputs[inp_name]
                        if inp.is_linked:
                            from_node = inp.links[0].from_node
                            inputs.append(f"{inp_name}<-LINK({from_node.type}:{from_node.name})")
                        else:
                            val = inp.default_value
                            if hasattr(val, '__len__'):
                                val_str = f"({', '.join(f'{v:.2f}' for v in val[:4])})"
                            else:
                                val_str = f"{val:.2f}"
                            inputs.append(f"{inp_name}={val_str}")
            print(f"  NODE: {node.type:20} | {node.name:25} | {', '.join(inputs)}")
    else:
        print("  NO NODES")

print("\n--- IMAGE TEXTURE FILES ---")
img_count = len(bpy.data.images)
print(f"Total Image Datablocks: {img_count}")
for img in bpy.data.images:
    print(f"  IMAGE: {img.name:20} | Filepath: {img.filepath} | Size: {img.size[0]}x{img.size[1]} | Packed: {img.packed_file is not None}")

print("\n--- UV LAYERS PER MESH OBJECT ---")
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        uv_names = [l.name for l in obj.data.uv_layers]
        print(f"  OBJ: {obj.name:36} | UV Layers: {uv_names}")

print("=== MATERIALS & TEXTURES AUDIT END ===")
