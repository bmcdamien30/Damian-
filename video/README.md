# Paper-cut videos

Two short videos drawn entirely in code, plus the kit that makes them.

## GarnettWork: How Market Memory Is Made

A 33-second, 16:9 (1920×1080) presentation with sound, in a spray-paint and notebook-paper style.

- `out/garnettwork.mp4`: the video, with soundtrack
- `out/garnettwork.html`: playable page (press Sound on)
- `stories/garnettwork.js`: the scenes and the sound cue list
- `out/garnettwork-vertical.mp4` and `out/garnettwork-vertical.html`: the 9:16 (1080×1920) cut for TikTok, Reels and Shorts, from `stories/garnettwork-vertical.js`. It keeps the same timing and cue list, so it uses the same soundtrack.

It walks the evidence pipeline from the site (listing, identity, market evidence, decision, receipt, outcome, Market Memory) using the site's PS5 development fixture, labeled EXAMPLE on screen. The soundtrack (a 96 BPM boom-bap bed plus spray, stamp, rip, printer and marker effects) is synthesized by `kit/audio.py` from the cue list:

```bash
node kit/record.js out/garnettwork.html --sfx cues.json
python3 kit/audio.py cues.json soundtrack.wav
```

## Everything ChatGPT Does

A 73-second, 9:16 (1080×1920) silent explainer about what ChatGPT can do, made in a torn-paper and spray-stencil collage style. Every frame is drawn in code.

- `out/chatgpt.mp4`: the video to post (silent; captions carry the story)
- `out/chatgpt.html`: the same animation as a playable web page

### Scenes

| Time | Scene | What it covers |
|---|---|---|
| 0:00 | Title | Stencil card + spray reveal |
| 0:05 | What is it | Launched Nov 30, 2022; 1.2 billion weekly users (OpenAI, Sept 2026) |
| 0:11 | Ask | Chat: questions, explanations, brainstorming |
| 0:17 | Write | Emails, essays, poems, stories; editing, summarizing, translating |
| 0:22 | Code | Writing and fixing code; Codex coding agent |
| 0:28 | Create | Making and editing images |
| 0:33 | Talk & see | Voice and camera |
| 0:39 | Search | Web search and deep research reports |
| 0:44 | Learn | Study mode and memory |
| 0:49 | Agent | Agent mode on its own cloud computer; dots (24/7 agents) |
| 0:55 | Build | GPT-6 Intelligent UI mini apps; Sites, shopping try-on, Finances |
| 1:02 | Check it | "ChatGPT can make mistakes. Check important info." |
| 1:07 | End | You're the boss + sources |

Facts were checked on Oct 16, 2026 against OpenAI's release notes, help center and announcements, plus TechCrunch. The full source list is in the comment header of `stories/chatgpt.js`.

### Rebuild

```bash
python3 kit/build.py stories/chatgpt.js out/chatgpt.html "Everything ChatGPT Does" [poster.jpg]
node kit/record.js out/chatgpt.html out/chatgpt.mp4 --samples 3            # full render
node kit/record.js out/chatgpt.html --stills 1.2,8.5 --outdir stills --res 0.5 --samples 1
```

`record.js` takes `--from-frame/--to-frame` so long renders can run as parallel slices, joined with `ffmpeg -f concat -c copy`.

## Kit

- `kit/engine.js`: paper renderer (torn edges, fringe, grain, bevel, shadows, 8 Hz boil), springs, camera, captions, stamps, spray-stencil lettering, spray strokes and splats, lined writing paper, image stickers, and transitions (portal in/out, bleed, whip, page rip, torn-sheet wipes)
- `kit/audio.py`: soundtrack synthesizer (music bed and sound effects from oscillators and filtered noise)
- `kit/character.js`: the original character "Pip" with rigged arms, blink, breathing and props
- `fonts/`: Big Shoulders Stencil Display and Archivo Black (SIL Open Font License), Permanent Marker (Apache 2.0)

No real people or other companies' logos are drawn; other companies appear only as text. The GarnettWork video uses GarnettWork's own lion logo.
