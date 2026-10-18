#!/usr/bin/env python3
"""Inline engine, character, story and fonts into one playable HTML file.

usage: build.py stories/<name>.js out/<name>.html "Title" [poster.jpg] [--artifact]
  --artifact  strip doctype/html/head/body tags (for publishing as an Artifact)
"""
import base64, html, json, os, re, sys

KIT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(KIT)

FONTS = [
    ("PStencil", "stencil-900.woff2", 900),
    ("PStencil7", "stencil-700.woff2", 700),
    ("PHead", "archivo-black.woff2", 400),
    ("PHand", "marker.woff2", 400),
]


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    artifact = "--artifact" in sys.argv
    story, out, title = args[0], args[1], args[2]
    poster = args[3] if len(args) > 3 else None
    css = []
    for fam, fn, wt in FONTS:
        b64 = base64.b64encode(open(os.path.join(ROOT, "fonts", fn), "rb").read()).decode()
        css.append(f'@font-face{{font-family:"{fam}";src:url(data:font/woff2;base64,{b64}) format("woff2");font-weight:{wt};font-display:block}}')
    story_src = read(story)
    meta = dict(re.findall(r"^//\s*@(\w+)\s+(.*)$", story_src, re.M))
    mimes = {".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}
    assets = {}
    for name, path in re.findall(r"^//\s*@asset\s+(\w+)\s+(\S+)\s*$", story_src, re.M):
        ext = os.path.splitext(path)[1].lower()
        if ext == ".json":
            assets[name] = json.load(open(os.path.join(ROOT, path)))
            continue
        b64 = base64.b64encode(open(os.path.join(ROOT, path), "rb").read()).decode()
        assets[name] = f"data:{mimes.get(ext, 'application/octet-stream')};base64,{b64}"
    audio_html = ""
    if meta.get("audio") and os.path.exists(os.path.join(ROOT, meta["audio"].strip())):
        ab = base64.b64encode(open(os.path.join(ROOT, meta["audio"].strip()), "rb").read()).decode()
        audio_html = f'<audio id="sound" preload="auto" src="data:audio/mp4;base64,{ab}"></audio>'
    poster_html = ""
    if poster:
        pb = base64.b64encode(open(poster, "rb").read()).decode()
        poster_html = (
            f'<img id="poster" src="data:image/jpeg;base64,{pb}" alt="{html.escape(title)} poster frame">'
            '<p class="note" id="posterNote">This preview is a still. Open the page in a browser to play the animation, or play the MP4.</p>'
        )
    page = read(os.path.join(KIT, "template.html"))
    rep = {
        "{{TITLE}}": html.escape(title),
        "{{HEADLINE}}": meta.get("headline", html.escape(title)),
        "{{SOURCES}}": meta.get("sources", ""),
        "{{FONTS_CSS}}": "\n".join(css),
        "{{POSTER}}": poster_html,
        "{{ENGINE}}": read(os.path.join(KIT, "engine.js")),
        "{{CHARACTER}}": read(os.path.join(KIT, "character.js")),
        "{{STORY}}": story_src,
        "{{ASSETS}}": json.dumps(assets),
        "{{AUDIO}}": audio_html,
        "{{ASPECT}}": meta.get("aspect", "9 / 16").strip(),
        "{{MAXW}}": meta.get("maxw", "460px").strip(),
    }
    for k, v in rep.items():
        page = page.replace(k, v)
    if artifact:
        page = re.sub(r"<!doctype html>\s*", "", page, flags=re.I)
        page = re.sub(r"</?html[^>]*>\s*", "", page)
        page = re.sub(r"</?head>\s*", "", page)
        page = re.sub(r"</?body>\s*", "", page)
        page = re.sub(r'<meta charset="utf-8">\s*', "", page)
        page = re.sub(r'<meta name="viewport"[^>]*>\s*', "", page)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(page)
    print(f"wrote {out} ({len(page) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
