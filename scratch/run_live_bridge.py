import sys
import os
import time

bridge_path = os.path.join(os.path.dirname(__file__), "..", "unin_blender_live_bridge.py")
with open(bridge_path, "r", encoding="utf-8") as f:
    code = f.read()

exec(code, globals())

print("[UNIN_Astra_Bridge] Dedicated background task loop started.")
try:
    while True:
        process_task_queue()
        time.sleep(0.05)
except Exception as e:
    print("[UNIN_Astra_Bridge] Loop error:", e)
