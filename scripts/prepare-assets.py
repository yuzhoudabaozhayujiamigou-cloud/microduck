from pathlib import Path
import re
import shutil
import urllib.request

ROOT = Path(r"E:\写一个软件\microduck")
SAVED = Path(r"C:\Users\15859025055\Desktop\Microduck——一款可以教你各种新把戏的小型双足机器人 _ Pollen Robotics_files")
HTML = Path(r"C:\Users\15859025055\Desktop\Microduck——一款可以教你各种新把戏的小型双足机器人 _ Pollen Robotics.html")
PUBLIC = ROOT / "public"
ASSETS = PUBLIC / "assets" / "microduck"
ASSETS.mkdir(parents=True, exist_ok=True)
(PUBLIC / "brand").mkdir(parents=True, exist_ok=True)
(PUBLIC / "fonts").mkdir(parents=True, exist_ok=True)
(ROOT / "docs" / "research").mkdir(parents=True, exist_ok=True)

html = HTML.read_text(encoding="utf-8", errors="replace")

# Extract emotion CSS for key classes
wanted = [
    "mui-bcklhs", "mui-1pz5c8f", "mui-8sqeuy", "mui-18fjpmy", "mui-etfx21",
    "mui-1631b76", "mui-yuxl5", "mui-c9i0mp", "mui-zb2u1n", "mui-lxrapp",
    "mui-ar2nja", "mui-13mp3a4", "mui-1xa0a60", "mui-gnu3r2", "mui-1ekjaju",
    "mui-m9azeb", "mui-63jk0g", "mui-qrjte2", "mui-begbe9", "mui-v60m7i",
    "mui-t1mr93", "mui-1wndfyq", "mui-y8sxps", "mui-1y5g1ol", "mui-1g7hdmi",
    "mui-t4q4et", "mui-1l0pv1e", "mui-s5nskt", "mui-88hplh", "mui-145zdk8",
    "mui-q6ojre", "anton_7fd6c1db", "mui-131olys", "mui-1jhgx1n", "mui-vx1qex",
]
css_blocks = re.findall(r"<style[^>]*>(.*?)</style>", html, re.I | re.S)
all_css = "\n".join(css_blocks)
found = {}
for cls in wanted:
    matches = re.findall(r"\." + re.escape(cls) + r"[^{]*\{[^}]+\}", all_css)
    if matches:
        found[cls] = matches[:8]
(ROOT / "docs" / "research" / "extracted-css.txt").write_text(
    "\n\n".join(f"{k}\n" + "\n".join(v) for k, v in found.items()),
    encoding="utf-8",
)
print("css classes", len(found))

local_copy = [
    "squad.webp", "tap-tap.webp", "closeup.webp", "playtime.webp", "watching.webp",
    "kickabout.webp", "desk.webp", "carried.webp", "screentime.webp", "skate.webp",
    "stickers.webp", "playroom.webp", "morning.webp", "bedroom.webp", "walkabout.webp",
    "pack-robot.webp", "pack-charger.webp", "pack-dev.webp", "pack-accessories.webp",
    "bomb.webp", "duck-head-mark.webp", "duck-head-mark-open.webp",
    "pollen-logo-icon.svg", "hf-logo.svg", "sleeping-reachy.svg",
    "reachy-eating-a-cookie.svg", "24px.svg",
]
for name in local_copy:
    src = SAVED / name
    if src.exists():
        dest_dir = PUBLIC / "brand" if name.endswith(".svg") or name.startswith("duck-") or name == "bomb.webp" else ASSETS / "photos"
        dest_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest_dir / name)
        print("copied", name, src.stat().st_size)
    else:
        print("missing local", name)

base = "https://pollen-robotics.com"
remote = [
    "/_next/static/media/5c285b27cdda1fe8-s.p.2_mbdogr7ni8i.woff2",
    "/_next/static/media/9e9f04e3c37952ab-s.p.0pan85mumqyf3.woff2",
    "/assets/pollen-mark.png",
    "/apple-touch-icon.png",
    "/assets/og/og-microduck-squad-v2.jpg",
    "/assets/microduck/microduck-hero.webm",
    "/assets/microduck/microduck-hero.mp4",
    "/assets/microduck/launch-film-poster.jpg",
    "/assets/microduck/launch-film.webm",
    "/assets/microduck/launch-film.mp4",
    "/assets/microduck/moves-portrait-alpha/posters/walk.png",
    "/assets/microduck/moves-portrait-alpha/walk.webm",
    "/assets/microduck/moves-portrait-alpha/posters/sitstand.png",
    "/assets/microduck/moves-portrait-alpha/sitstand.webm",
    "/assets/microduck/moves-portrait-alpha/posters/kickL.png",
    "/assets/microduck/moves-portrait-alpha/kickL.webm",
    "/assets/microduck/moves-portrait-alpha/posters/grab.png",
    "/assets/microduck/moves-portrait-alpha/grab.webm",
    "/assets/microduck/moves-portrait-alpha/posters/drive.png",
    "/assets/microduck/moves-portrait-alpha/drive.webm",
    "/assets/microduck/moves-portrait-alpha/posters/standup.png",
    "/assets/microduck/moves-portrait-alpha/standup.webm",
    "/assets/microduck/gallery/roller-skating-poster.jpg",
    "/assets/microduck/gallery/roller-skating.mp4",
    "/assets/microduck/gallery/balance-recovery-poster.jpg",
    "/assets/microduck/gallery/balance-recovery.mp4",
    "/assets/microduck/gallery/squad-standup-poster.jpg",
    "/assets/microduck/gallery/squad-standup.mp4",
    "/assets/microduck/gallery/chorale-poster.jpg",
    "/assets/microduck/gallery/chorale.mp4",
    "/assets/microduck/gallery/grab-and-carry-poster.jpg",
    "/assets/microduck/gallery/grab-and-carry.mp4",
]

# extra likely 3d / colour assets
extra = [
    "/assets/microduck/colourways/cream.webp",
    "/assets/microduck/colourways/graphite.webp",
    "/assets/microduck/colourways/lavender.webp",
    "/assets/microduck/colourways/sky.webp",
    "/assets/microduck/models/microduck.glb",
    "/assets/microduck/microduck.glb",
    "/models/microduck.glb",
]

opener = urllib.request.build_opener()
opener.addheaders = [("User-Agent", "Mozilla/5.0 MicroduckClone")]
urllib.request.install_opener(opener)

def fetch(path: str) -> None:
    url = base + path
    rel = path.lstrip("/")
    if rel.startswith("_next/"):
        dest = PUBLIC / "fonts" / Path(rel).name
    elif rel.startswith("assets/microduck/"):
        dest = PUBLIC / rel
    elif rel.endswith(".png") or rel.endswith(".jpg"):
        dest = PUBLIC / "brand" / Path(rel).name
    else:
        dest = PUBLIC / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 1000:
        print("skip", dest)
        return
    try:
        print("GET", url)
        urllib.request.urlretrieve(url, dest)
        print(" saved", dest, dest.stat().st_size)
    except Exception as e:
        print(" FAIL", url, e)
        if dest.exists():
            dest.unlink()

for path in remote:
    fetch(path)
for path in extra:
    fetch(path)

print("done")
