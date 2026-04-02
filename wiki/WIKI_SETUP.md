# Wiki setup notes

This folder contains GitHub Wiki-ready markdown pages.

## How to use these files

### Option 1: Keep them in the main repo

Commit the `wiki/` folder directly into the repository so the documentation lives alongside the code.

### Option 2: Use the GitHub Wiki feature

GitHub Wikis are stored in a separate repository.

To use these files as your GitHub Wiki content:

1. Enable the Wiki tab in the GitHub repository settings if needed.
2. Open the repository Wiki once so GitHub creates the wiki repo.
3. Clone the wiki repo locally. It usually ends with `.wiki.git`.
4. Copy the contents of this folder into that wiki repo.
5. Commit and push.

## Suggested first pass

- Put `Home.md` on the wiki home page.
- Keep `_Sidebar.md` in place for navigation.
- Add `_Footer.md` only if you want a footer rendered on all pages.

## Naming note

Most links in these files use GitHub Wiki page naming so they map cleanly to wiki URLs.
Governance links that point to repository-root docs use absolute GitHub URLs so they also work when this folder is mirrored into a separate wiki repository.
