# Aerospace Study Deck

A flashcard study app for the "Journey of Flight" (aerospace) deck.

## Structure

- `index.html` — the app (UI + logic). Loads card data from `data.json` and
  `progress.json` at runtime.
- `data.json` — all flashcard content (terms, definitions, concepts, people/aircraft, etc).
  Edit this file (or use the app's built-in edit features) to update the deck content.
- `progress.json` — your mastery marks, notes, "All sections" order, and card edits.
  This is the file that keeps you in sync across devices — see below.

## How syncing works

There's no server. `progress.json` is just a plain file in this repo that the app
reads on every load and can write to directly. The workflow is:

1. Study on device A. The app writes your mastery marks / notes / order into
   `progress.json` on disk (see "Connecting the file" below).
2. `git add progress.json && git commit -m "Update progress" && git push`
3. On device B: `git pull`, then reload the page (or re-deploy if you're using
   GitHub Pages) — the app reads the updated `progress.json` and you're caught up.

It's the same mental model as `data.json`: a file you edit and push, except the
app writes it *for* you.

### Connecting the file (Chrome / Edge / other Chromium browsers)

These browsers support the File System Access API, which lets a webpage write to
a real file on disk with your permission:

1. Open the menu (⋯) → **Connect progress.json**.
2. Pick the `progress.json` file in this repo folder.
3. From then on, every change (marking a card, adding a note, shuffling) writes
   straight to that file. The menu item becomes **Re-sync progress.json** if you
   ever want to force an immediate write.

The browser will remember the connection for the session; if it asks for
permission again after a reload, just allow it.

### Firefox / Safari / iOS (no direct file-write support)

The menu item becomes **Download progress.json** instead. Clicking it downloads
a fresh copy with your current progress — move/replace it into the repo folder,
then commit and push as usual.

## Setting up GitHub Pages (one-time)

```bash
git init
git add .
git commit -m "Initial commit: aerospace study deck"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then in the GitHub repo: **Settings → Pages → Source: Deploy from branch → main → / (root)**.

GitHub will give you a URL like:

```
https://<your-username>.github.io/<repo-name>/
```

Open that URL on any device — phone, laptop, whatever.

## Making updates from any device

```bash
git pull                      # get latest data.json / progress.json
# study, edit content, whatever
git add data.json progress.json
git commit -m "Update deck content / progress"
git push
```

GitHub Pages redeploys automatically within a minute or two of any push to `main`.

Note: on GitHub Pages, connecting `progress.json` via the File System Access API
points at your *local clone* of the repo, not the live site — the site is
read-only to browsers. So the real loop is: study on the live site or locally →
sync/download `progress.json` into your local clone → commit & push → other
devices `git pull` and reload the live site to pick it up.

## Running locally (optional, recommended if you want direct file-writing)

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/index.html — from a local server, "Connect
progress.json" can point directly at the file in your working copy, so saving
your progress and committing it is as simple as studying, then running
`git add progress.json && git commit && git push`.

(Opening `index.html` directly via `file://` won't work either way — the browser
blocks the `fetch()` calls that load `data.json` and `progress.json`.)

## About "All sections" order

`progress.json`'s `order` field is the order for "All sections" specifically.
- **Shuffle** scrambles the current view as usual.
- **Restore Original Order** (or pressing `S` again) reverts back to whatever
  order is stored in `progress.json` — not data.json's raw section-by-section
  concatenation.

Individual named sections (Definitions, Concepts, People/Aircraft, etc.) are
untouched and keep their own natural per-section order as always.

## What's NOT in progress.json

Things that stay purely local to each browser (not synced): current card
position, active filter, text size, direction (term→def vs def→term), and
fullscreen state. These are minor per-session preferences, not progress, so
there was no reason to make them part of the sync file.
