# CSAE 104 Web Programming: course site

Interactive lecture and laboratory pages for CSAE 104 (MERN to PERN), built from the 18-week syllabus and the slide decks.
Lecture and laboratory are separate sections. Weeks 1 to 3 (HTML and CSS) and Weeks 10 and 11 (PostgreSQL) have no deck of their own yet.
Weeks 1 to 8 follow the revised syllabus (HTML, CSS and layout in Weeks 1 to 3; the web and JavaScript in Week 4; async JavaScript, Node and Git in Week 5; Express and REST in Week 6; validation and MongoDB in Week 7).
The decks for those weeks are the earlier ones and are linked as "Earlier deck" on the week pages, so they follow the old week order.
Every week page also has a "Where this fits in the syllabus" panel taken from Part III of the syllabus.

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
