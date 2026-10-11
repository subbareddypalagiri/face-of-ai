import bpy

scene = bpy.context.scene
emitter = scene.objects.get("unin.vfx.rain_emitter")
proto = scene.objects.get("unin.vfx.raindrop_proto")

print("=== RAIN VFX AUDIT START ===")
if not emitter:
    print("EMITTER_NOT_FOUND")
else:
    print(f"EMITTER: {emitter.name} at {emitter.location.to_tuple(2)}")
    print(f"PROTO: {proto.name if proto else 'NOT_FOUND'}")
    if proto:
        print(f"  Proto Dimensions: {proto.dimensions.to_tuple(3)}")
        print(f"  Proto Hide Render: {proto.hide_render}")
    
    depsgraph = bpy.context.evaluated_depsgraph_get()
    
    for f in [1, 30, 60, 90, 120]:
        scene.frame_set(f)
        depsgraph = bpy.context.evaluated_depsgraph_get()
        eval_emitter = emitter.evaluated_get(depsgraph)
        ps = eval_emitter.particle_systems[0] if eval_emitter.particle_systems else None
        if ps:
            particles = ps.particles
            active_count = sum(1 for p in particles if p.alive_state == 'ALIVE')
            locations = [p.location.to_tuple(2) for p in particles if p.alive_state == 'ALIVE']
            z_min = min((p.location.z for p in particles if p.alive_state == 'ALIVE'), default=None)
            z_max = max((p.location.z for p in particles if p.alive_state == 'ALIVE'), default=None)
            print(f"FRAME_{f}: Total particles: {len(particles)} | Alive: {active_count} | Z range: ({z_min}, {z_max})")

print("=== RAIN VFX AUDIT END ===")
