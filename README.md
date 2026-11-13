# CSAE 104 Web Programming: course site

Interactive lecture and laboratory pages for CSAE 104 (MERN to PERN), built from the 18-week syllabus and the slide decks.
Lecture and laboratory are separate sections. Every week links to a `.pptx` deck. Weeks 1 to 11 were rebuilt from the site content to follow the revised syllabus (the Week 12 and 13 lecture decks only had their week references corrected).
Every week page also has a "Where this fits in the syllabus" panel taken from Part III of the syllabus.

## Documentation
- **Students:** [docs/STUDENT-GUIDE.md](docs/STUDENT-GUIDE.md) (also on the site: How it works, `guide.html`, and a Getting started page with a weekly routine and a Git and GitHub walkthrough, `start.html`)
- **Instructor:** [docs/INSTRUCTOR-GUIDE.md](docs/INSTRUCTOR-GUIDE.md) (setup, weekly routine, grading, troubleshooting)
- **Specification:** [docs/SYSTEM-SPECIFICATION.md](docs/SYSTEM-SPECIFICATION.md) (architecture, data, rules, interface, security)

## Monitoring student progress
Progress is saved in each student's browser and sent automatically to a Google Sheet that only the instructor opens: one row per student, with progress, submitted GitHub links, scores and flags for students who are behind, inactive or not registered. Students register once and can see their own scores on the site.
Setup and day-to-day use are in [docs/INSTRUCTOR-GUIDE.md](docs/INSTRUCTOR-GUIDE.md); the short technical setup is `instructor/google-sheet-setup.md`.

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
