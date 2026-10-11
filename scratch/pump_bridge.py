# scratch/pump_bridge.py
import time
import sys

print("[PUMP] Starting background pump for startup bridge...", flush=True)

# Find process_task_queue in globals or modules
ptq = globals().get("process_task_queue")
if not ptq:
    import sys
    for mod in sys.modules.values():
        if hasattr(mod, "process_task_queue"):
            ptq = getattr(mod, "process_task_queue")
            break

if not ptq:
    print("[PUMP_ERROR] process_task_queue not found!", flush=True)
    sys.exit(1)

print("[PUMP] Found process_task_queue! Entering pump loop...", flush=True)
while True:
    ptq()
    time.sleep(0.02)
