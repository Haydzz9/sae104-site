# CSAE 104 Web Programming: course site

Interactive lecture and laboratory pages for CSAE 104 (MERN to PERN), built from the 18-week syllabus and the slide decks.
Lecture and laboratory are separate sections. Every week links to its original `.pptx` file, except Weeks 10 and 11 (PostgreSQL), which have no deck yet.

## Publish on GitHub Pages
1. Create a repository and upload everything in this folder (keep the folder structure).
2. In the repository, open **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
4. After a minute, the site is live at `https://<your-username>.github.io/<repository-name>/`.

You can also open `index.html` directly from your computer; it works without a server.

## What is in the folder
| Path | Purpose |
|---|---|
| `index.html`, `lecture.html`, `laboratory.html`, `week.html` | The pages |
| `assets/` | Styles, scripts, code highlighter |
| `data/lecture.js`, `data/laboratory.js` | All slide content, as data |
| `downloads/` | The original `.pptx` decks |

## Features for students
Search (press `/`), light and dark theme, copy buttons on code, a step-by-step lab with checkboxes,
multiple-choice quizzes with shuffled choices, notes boxes for open questions, and progress saved in the browser.

## Note on quiz answers
The slide decks do not contain an answer key, so the answers used by the quizzes were worked out
from the question text. Please review them in `data/lecture.js` (field `answer`, the zero-based index of the
correct option in the original order) before sharing with students.
