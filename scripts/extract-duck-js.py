from pathlib import Path
import re

src = Path(r"C:\Users\15859025055\Desktop\Microduck——一款可以教你各种新把戏的小型双足机器人 _ Pollen Robotics_files")
out = Path(r"E:\写一个软件\microduck\docs\research")
out.mkdir(parents=True, exist_ok=True)

files = [
    src / "392zsnmwjwkse.js.下载",
    src / "2biqquxg91qqe.js.下载",
    src / "40n4mp15te3lp.js.下载",
]

needles = [
    "createDuckScene",
    "microduck-3d",
    "GLTFLoader",
    "DEFAULT_VARIANT",
    "getVariantSwatches",
    "setVariant",
    "quack",
    ".glb",
    ".gltf",
    "BoxGeometry",
    "SphereGeometry",
    "CapsuleGeometry",
    "headDome",
    "bodyShell",
    "left_hip_pitch",
    "AudioContext",
    "pointermove",
]

blob = ""
for f in files:
    if f.exists():
        blob += f"\n\n===== {f.name} {f.stat().st_size} =====\n"
        blob += f.read_text(encoding="utf-8", errors="replace")

print("blob", len(blob))
for n in needles:
    print(n, blob.count(n))

urls = sorted(set(re.findall(r"['\"](/[^'\"]+\.(?:glb|gltf|json|stl|bin|mp3|wav|ogg)[^'\"]*)['\"]", blob))
)
print("urls", urls)

# Extract module 23990 from 392 file
text = (src / "392zsnmwjwkse.js.下载").read_text(encoding="utf-8", errors="replace")
idx = text.find("23990,e=>{")
print("23990 idx", idx)
if idx >= 0:
    chunk = text[idx : idx + 25000]
    (out / "duck-module-23990.txt").write_text(chunk, encoding="utf-8")
    print("wrote 23990", len(chunk))

idx = text.find("66843,e=>{")
print("66843 idx", idx)
if idx >= 0:
    chunk = text[idx : idx + 12000]
    (out / "duck-module-66843.txt").write_text(chunk, encoding="utf-8")
    print("wrote 66843", len(chunk))

# 79696 animation in 2biq file
text2 = (src / "2biqquxg91qqe.js.下载").read_text(encoding="utf-8", errors="replace")
idx = text2.find("79696,e=>{")
print("79696 idx", idx)
if idx >= 0:
    chunk = text2[idx : idx + 20000]
    (out / "duck-module-79696.txt").write_text(chunk, encoding="utf-8")
    print("wrote 79696", len(chunk))

# find 86793 - might be a chunk map
for f in src.glob("*.下载"):
    t = f.read_text(encoding="utf-8", errors="replace")
    if "createDuckScene" in t:
        print("createDuckScene in", f.name, t.count("createDuckScene"))
    if "86793" in t and "createDuckScene" in t:
        print("both in", f.name)
