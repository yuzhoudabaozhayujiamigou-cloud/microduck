from pathlib import Path
import re
import json

html_path = Path(r"C:\Users\15859025055\Desktop\Microduck——一款可以教你各种新把戏的小型双足机器人 _ Pollen Robotics.html")
out_dir = Path(r"E:\写一个软件\microduck\docs\research")
out_dir.mkdir(parents=True, exist_ok=True)

html = html_path.read_text(encoding="utf-8", errors="replace")
print("len", len(html))

title = re.search(r"<title>(.*?)</title>", html, re.I)
print("TITLE", title.group(1) if title else None)

# Pretty-print-ish: insert newlines before tags of interest
pretty = re.sub(r"><(div|section|header|footer|nav|h1|h2|h3|p|button|a|img|video|source|span|ul|li|article)", r">\n<\1", html)
pretty_path = out_dir / "saved-page-pretty.html"
pretty_path.write_text(pretty[:400000], encoding="utf-8")
print("pretty written", pretty_path, "chars", min(len(pretty), 400000))

imgs = re.findall(r"<img\b[^>]*>", html, re.I)
print("img tags", len(imgs))
img_rows = []
for t in imgs:
    src = re.search(r'src="([^"]+)"', t)
    srcset = re.search(r'srcset="([^"]+)"', t)
    alt = re.search(r'alt="([^"]*)"', t)
    img_rows.append({
        "src": src.group(1) if src else None,
        "srcset": srcset.group(1)[:400] if srcset else None,
        "alt": alt.group(1) if alt else None,
        "raw": t[:400],
    })

urls = re.findall(r'(?:src|href|poster|srcset)="([^"]+)"', html)
flat = []
for u in urls:
    parts = re.split(r"\s+", u.replace(",", " "))
    for p in parts:
        if p.startswith("http") or p.startswith("./") or p.startswith("/"):
            flat.append(p)

asset_ext = (".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".mp4", ".webm", ".woff2", ".woff", ".css", ".js", ".avif")
assets = []
seen = set()
for u in flat:
    low = u.lower().split("?")[0]
    if any(low.endswith(ext) or ext[1:] in low for ext in asset_ext) or "image" in low or "video" in low or "mux" in low:
        if u not in seen:
            seen.add(u)
            assets.append(u)

print("assets", len(assets))

# Visible text-ish: strip scripts/styles
text_html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
text_html = re.sub(r"<style[\s\S]*?</style>", " ", text_html, flags=re.I)
text_html = re.sub(r"<[^>]+>", "\n", text_html)
lines = [re.sub(r"\s+", " ", x).strip() for x in text_html.splitlines()]
lines = [x for x in lines if x and len(x) > 1]
# unique-ish consecutive
dedup = []
for x in lines:
    if not dedup or dedup[-1] != x:
        dedup.append(x)

(out_dir / "saved-text.txt").write_text("\n".join(dedup[:800]), encoding="utf-8")
(out_dir / "saved-assets.json").write_text(json.dumps({"imgs": img_rows, "assets": assets[:300]}, indent=2, ensure_ascii=False), encoding="utf-8")

print("text lines", len(dedup))
print("--- TEXT SAMPLE ---")
for x in dedup[:120]:
    print(x[:200])
print("--- ASSETS SAMPLE ---")
for a in assets[:80]:
    print(a[:250])
