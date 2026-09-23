# Anatomy Study Quiz

A static study site for body landmarks (anterior and posterior), body planes and body cavities.
It has no build step and no server code. Open `index.html` directly or host it on GitHub Pages.

## Features
- **Study:** each diagram has its labels. Tap a label to hide it or show it, and tap a term in the glossary to find it on the diagram.
- **Label it:** a numbered blank is highlighted and you name it, either by typing (small spelling slips are accepted and flagged) or by multiple choice.
- **Find it:** you're given a term and tap where it goes on the diagram.
- **Concepts:** multiple-choice questions on term meanings, planes and cavities.
- **Show answered:** a toggle during diagram questions that colors labels already answered in the quiz. Green means right on the first try, orange means right on a retry and red means missed.
- **Repeat missed questions:** a home-page setting, on by default. A missed question comes back 3 questions later until it's answered right. Scores count first tries only.
- **Missed items:** across sessions, anything answered wrong shows up under "Review what you missed" until it's answered right twice in a row. Progress is saved in the browser's localStorage, so it's per device.

## Run locally
```bash
python3 -m http.server 8765
```
Then open http://localhost:8765. Opening `index.html` directly works too.

## Deploy to GitHub Pages
1. Create a GitHub repo and push this folder to it.
2. In the repo, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
3. The site will be at `https://<username>.github.io/<repo>/` within a minute or two.

## Project layout
| Path | What it is |
|---|---|
| `index.html`, `css/`, `js/app.js` | The app |
| `js/content.js` | Term meanings, accepted alternate answers and concept questions. **Edit this to add questions.** |
| `js/diagrams.js` | Generated label positions. Don't edit it by hand. |
| `source/` | The original slide screenshots |
| `tools/build_diagrams.py` | Crops `source/` into `images/` and writes `js/diagrams.js` |

## Adding or fixing a diagram
Label boxes are defined in `tools/build_diagrams.py` in the original screenshot's pixel coordinates.
After you change them, rebuild and check the red debug boxes:
```bash
python3 tools/build_diagrams.py --debug
```
This needs Pillow (`pip install pillow`). Delete `images/debug_*.png` when you're done; they're git-ignored.
For a new diagram, add an entry to `DIAGRAMS` in the build script, add its terms to `GLOSSARY` in `js/content.js`, and add a topic to `TOPICS` in `js/app.js`.
