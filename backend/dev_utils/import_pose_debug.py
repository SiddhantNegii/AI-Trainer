import sys
import os
import traceback

pose_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'ml_models', 'pose_detection'))
sys.path.insert(0, pose_dir)
print("Added to sys.path:", pose_dir)

try:
    import pose_detector
    import exercise_analyzer
    print("OK: imports succeeded")
except BaseException as e:
    print("ERROR during import:", repr(e))
    tb = traceback.format_exc()
    log_file = os.path.join(os.path.dirname(__file__), "import_pose_debug.log")
    with open(log_file, "w", encoding="utf-8") as f:
        f.write(tb)
    print("Traceback written to:", log_file)
