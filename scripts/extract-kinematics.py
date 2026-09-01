from pathlib import Path
import re

src = Path(r"C:\Users\15859025055\Desktop\Microduck——一款可以教你各种新把戏的小型双足机器人 _ Pollen Robotics_files")
out = Path(r"E:\写一个软件\microduck\docs\research")

text = (src / "023quq2n032us.js.下载").read_text(encoding="utf-8", errors="replace")
print("023 len", len(text))
for n in ["loadKinematics", "buildRig", "setJoint", "setJawOpen", "SITTING_POSE", "groundFullBody", "stl", "microduck-3d", "STLLoader"]:
    print(n, text.count(n))

idx = text.find("31225,e=>{")
print("31225 idx", idx)
if idx < 0:
    idx = text.find("function")
chunk = text[idx: idx + 80000] if idx >= 0 else text[:80000]
(out / "duck-module-31225.txt").write_text(chunk, encoding="utf-8")
print("wrote", len(chunk))

urls = sorted(set(re.findall(r"['\"](/[^'\"]+)['\"]", text)))
print("all urls")
for u in urls:
    print(u)

stls = sorted(set(re.findall(r"[A-Za-z0-9_\-]+\.stl", text)))
print("stls", stls)
