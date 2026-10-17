# Anatomy Study Quiz

A static study site for AP Biology anatomy units. It has no build step and no server code. Open `index.html` directly or host it on GitHub Pages.

## Units
| Page | Covers |
|---|---|
| `skeletal.html` | **Skeletal System**: bone structure, bone shapes, microscopic bone, fractures and repair, the skeleton, spine, skull, sinuses, rib cage, limbs, pelvis, joint classes, synovial joints and the knee (24 diagrams, about 150 concept questions) |
| `body.html` | **Body Orientation**: anterior and posterior landmarks, body planes and body cavities (4 diagrams) |

`index.html` is a hub that links to each unit. Each unit saves its own progress.

## Features
- **Study:** each diagram has its labels. Tap a label to hide it or show it, and tap a term in the list to find it on the diagram.
- **Label it:** a numbered blank is highlighted and you name it, either by typing or by multiple choice. Small spelling slips are accepted and flagged. Filler words are optional, so "frontal" counts for "Frontal bone", and so are words in parentheses, so "articular cartilage" counts for "Articular (hyaline) cartilage".
- **Find it:** you're given a term and tap where it goes on the diagram. If a term is labeled more than once, any of its spots counts.
- **Concepts:** multiple-choice questions written from the slide text, plus generated "what does this term mean" questions.
- **Slide notes** (Skeletal unit): fill-in-the-blank sentences from the written part of every slide, answered by typing or multiple choice. There's also a study view per deck where you tap blanks to reveal them. Notes live in `SLIDE_NOTES` in `js/skeletal/content.js`; `{answer|alternate}` marks a blank.
- **Bone functions** (Skeletal unit): a quiz topic covering the five functions of bones and what specific bones and structures do. Pick only that topic to focus on it.
- **Show answered:** a toggle during diagram questions that colors labels already answered in the quiz. Green means right on the first try, orange means right on a retry and red means missed.
- **Repeat missed questions:** a home-page setting, on by default. A missed question comes back 3 questions later until it's answered right. Scores count first tries only.
- **Missed items:** across sessions, anything answered wrong shows up under "Review what you missed" until it's answered right twice in a row. Progress is saved in the browser's localStorage, per device and per unit.

## Run locally
```bash
python3 -m http.server 8765
```
Then open http://localhost:8765.

## Deploy
Pushing to `main` redeploys GitHub Pages automatically.

## Project layout
| Path | What it is |
|---|---|
| `index.html`, `body.html`, `skeletal.html` | Hub and unit pages |
| `css/`, `js/app.js` | Shared app, used by every unit |
| `js/<unit>/content.js` | Unit settings (sections, storage key), term meanings, accepted alternate answers and concept questions. **Edit this to add questions.** |
| `js/<unit>/diagrams.js` | Generated label positions. Don't edit it by hand. |
| `source/<unit>/` | Original figures (slide screenshots or images pulled from the slide decks) |
| `tools/spec_<unit>.py` | Each diagram's crop and label boxes |
| `tools/build_diagrams.py` | Crops `source/` into `images/<unit>/` and writes `js/<unit>/diagrams.js` |

## Adding or fixing a diagram
Label boxes are defined in `tools/spec_<unit>.py` in the original image's pixel coordinates.
After you change them, rebuild and check the red debug boxes:
```bash
python3 tools/build_diagrams.py skeletal --debug
```
This needs Pillow (`pip install pillow`). Delete `images/*/debug_*.png` when you're done; they're git-ignored.

## Adding a unit
1. Put the figures in `source/<unit>/` and write `tools/spec_<unit>.py`. Copy `spec_skeletal.py`; each diagram needs a `section`.
2. Add the unit name to `UNITS` in `tools/build_diagrams.py` and run the build.
3. Write `js/<unit>/content.js`, with `window.UNIT` (sections, storage key), `GLOSSARY`, `ALIASES`, `CONCEPT_QUESTIONS` and, optionally, `SLIDE_NOTES`. Every diagram term needs a glossary entry. A section with no diagrams works as a questions-only topic.
4. Copy `skeletal.html` to `<unit>.html`, point its scripts at the new unit, and add a card to `index.html`.
