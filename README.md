# Aerospace Study Deck

A flashcard study app for the "Journey of Flight" (aerospace) deck. It's a
single static page — no build step, no server, no dependencies — that also
installs as an offline-capable PWA.

## Structure

- `index.html` — the app (UI + logic). Loads card data from `data.json` and
  `progress.json` at runtime.
- `data.json` — all flashcard content (definitions, concepts, people/aircraft, etc).
  Edit this file (or use the app's built-in edit features) to update the deck content.
- `progress.json` — your mastery marks, notes, "All sections" order, and card edits.
  This is the file that keeps you in sync across devices — see below.
- `manifest.json` / `sw.js` / `icons/` — PWA install metadata and the offline cache.

### How `data.json` is organised

The deck has five sections — Definitions, Concepts, People / Aircraft,
Miscellaneous, Planets — and each card is a JSON array:

```jsonc
["Helium", "safer than hydrogen"]   // two entries: a term/definition pair, flippable
["Fixed gear cheaper, retractable reduces drag"]   // one entry: a single-sided fact
```

The two entries at the top of the section picker — **Terms & Definitions** and
**Facts & Concepts** — are *cross-section views*, not stored sections. The app
derives them at load time by slicing the whole deck into pair cards and fact
cards. Adding a card to any section automatically puts it in the right view;
there's nothing to keep in sync by hand.

## Studying

| Key | Action |
| --- | --- |
| `Space` | Flip the card |
| `←` `→` | Previous / next card |
| `M` / `R` / `G` | Mark mastered / needs review / know some |
| `S` | Shuffle, or restore the original order |
| `E` | Edit the current card |
| `N` | Toggle notes |
| `J` | Jump to a card number |
| `F` | Fullscreen |
| `/` | Search every card |
| `?` | Show this list in the app |
| `Esc` | Close any menu, panel or dialog |

Search covers the whole deck (terms and definitions), ranks exact and
term matches first, and jumps straight to the card's own section when you pick
a result. Cards you've edited are searchable by their edited text.

### The interface

- **Top bar** — section picker on the row below it, plus search (`/`) and the
  tools menu. The battery and clock live here too, so they stay visible when
  you're studying fullscreen.
- **Progress block** — the mastered percentage, one meter split by status, and
  the count chips. The chips *are* the filter: tap "Review" to study only the
  cards you've flagged. There's no separate filter dropdown to keep in step
  with the numbers.
- **Card** — tap or press `Space` to flip. Its top edge is coloured by status.
  The edit and notes buttons sit in the card's top-right corner and are visible
  without hovering, so they work on a phone.
- **Notes** — a bottom sheet on phones and laptops; on a wide screen (≥1560px)
  it docks beside the card instead.
- **Mastery buttons** — pinned to the bottom of the screen on phones so they
  stay under your thumb.

The app follows your system light/dark preference; there's no separate setting.

## How syncing works

There's no traditional server, but there are two ways `progress.json` gets kept
in sync across devices:

### Option A: GitHub sync (recommended — no manual git commands)

The app can commit `progress.json` straight to this repo via the GitHub REST
API, right from the browser, every time you mark a card, add a note, or shuffle:

1. Open the menu (⋯) → **Connect GitHub sync**.
2. Enter the repo as `owner/name` (auto-filled if you're on a `*.github.io` URL),
   the branch (default `main`), and a GitHub **personal access token**.
   Use a fine-grained token scoped to just this repo with **Contents: Read and
   write** permission — nothing else. The token is stored only in this browser's
   `localStorage`; it's never sent anywhere but `api.github.com`.
3. From then on, every change auto-commits to `progress.json` (debounced ~2.5s
   after you stop making changes) — no `git add`/`commit`/`push` needed.
4. GitHub Pages redeploys automatically within roughly 30-60 seconds of the
   commit. Open (or reload) the site on another device and it'll have picked up
   the change.

Because a token lives in browser storage, only connect this on devices you
trust, and revoke the token from GitHub's settings if a device is lost. **Menu →
Disconnect GitHub sync** forgets the token locally (it doesn't revoke it on
GitHub's side).

#### When the "changes waiting to sync" banner appears

While you're online, changes just sync — the footer reads *Syncing to GitHub…*
for a couple of seconds and then *Synced to GitHub*, and no banner appears. The
banner is reserved for the two cases where the automatic sync genuinely can't
finish on its own:

- **Edits made while offline.** They can't be pushed blindly, because another
  device may have changed `progress.json` in the meantime, so on reconnect the
  banner offers a review: it lists exactly what this device changed, then merges
  it into whatever is on GitHub now rather than overwriting it.
- **A sync that failed** (bad token, revoked permission, GitHub down). The
  banner says the changes couldn't reach GitHub and lets you retry.

Two things this deliberately does *not* do: announce the ~2.5s debounce window
that every ordinary online edit passes through, and treat the copy of
`progress.json` served by GitHub Pages as the current truth. Pages can lag a
commit by 30-60 seconds, so a fetched copy that's older than what the app has
already pushed is ignored rather than adopted as the sync baseline — otherwise a
background poll would keep inventing "unsynced changes" on a device that is
online and perfectly in sync.

#### When the deck itself changes

Mastery marks and notes are stored against a card's **position** in `data.json`
(`aerospace::ch3::8`), not against its text. So if cards are added to or removed
from the deck, every position after that point now names a different card, and
any device still holding the old layout would put your marks on the wrong ones.

The app guards against this by recording the deck's shape alongside your
progress. When it starts up and finds the shape has changed, it treats
`progress.json` as the truth and rebuilds this device's copy from it, rather
than merging the two — merging is what would resurrect the stale positions.

If the deck changed but `progress.json` can't be reached (you're offline), the
footer reads *Deck changed — reconnect to sync your marks* and the app
deliberately **stops pushing** until it can reconcile, so a device that's out of
date can't overwrite good progress. Keep studying; the next start-up that
reaches `progress.json` sorts it out and resumes syncing.

If you edit `data.json` by hand, remember to update `progress.json` in the same
change — matching cards up by text, not by position.

### Option B: manual file + git (no token required)

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
- **Restore Original Order** (or pressing `S` again) reverts back to
  `data.json`'s natural section-by-section concatenation order — the deck's
  true default — regardless of whatever order happens to be loaded from
  `progress.json`. That way, if `progress.json` was last saved mid-shuffle,
  the menu correctly shows "Restore Original Order" instead of "Shuffle",
  since the currently-loaded order really is a shuffled one relative to the
  deck's default.

Individual named sections (Definitions, Concepts, People/Aircraft, etc.) are
untouched and keep their own natural per-section order as always.

## What's NOT in progress.json

Things that stay purely local to each browser (not synced): current card
position, active filter, text size, direction (term→def vs def→term), and
fullscreen state. These are minor per-session preferences, not progress, so
there was no reason to make them part of the sync file.

## Offline / caching

`sw.js` precaches the app shell so it opens without a network connection.
`index.html` and `data.json` are fetched **network-first** (falling back to the
cache when offline), so a redeploy shows up on the very next load rather than
the one after it. `progress.json` is never cached — the app always needs a live
read of it to know the true sync state.

Bump `CACHE_NAME` in `sw.js` whenever you change the app shell, so old caches
get cleared on activation.
