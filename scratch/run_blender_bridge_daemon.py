# scratch/run_blender_bridge_daemon.py
"""
Background runner for UNIN Blender Live Bridge (Port 8192)
Pumps the bridge task queue continuously on the main thread.
"""
import sys
import os
import time

# Add workspace to sys.path so unin_blender_live_bridge can be imported
workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if workspace_dir not in sys.path:
    sys.path.insert(0, workspace_dir)

import unin_blender_live_bridge as bridge

bridge.register()
print("[DAEMON] UNIN Blender Live Bridge active on port 8192. Pumping main loop...", flush=True)

try:
    while True:
        bridge.process_task_queue()
        time.sleep(0.02)
except KeyboardInterrupt:
    print("[DAEMON] Shutting down bridge...", flush=True)
    bridge.unregister()
