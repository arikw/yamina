# Yamina – Auto RTL for Hebrew & Arabic

A Chrome extension. Click its toolbar button on a site to switch it on there:
every `<div>` whose text is mostly (over 50%) Hebrew or Arabic letters is set
right-to-left and right-aligned. Click again to switch it off.

- **Per site** = per hostname (`mail.google.com` and `gmail.com` are separate).
  A site stays on across visits and browser restarts until you switch it off.
- **Only a div's own text counts** — text inside nested divs is left out.
  Otherwise a page-wide wrapper would flip whenever the page is mostly Hebrew
  and mirror the whole site's layout. Wrappers with no text of their own are
  never touched.
- **Letters only** — spaces, digits, punctuation and emoji don't count either way.
- An English block inside a flipped Hebrew one is set back to left-to-right.
- Keeps working as the page changes (chat messages arriving, typing into an
  editable box).
- The button shows **ON** where it's active, and **!** on pages it can't run on
  (browser pages like `chrome://`, the Web Store, local files).

## Permissions

None at install. The first click on a site asks Chrome for access to **that
site only**; switching the site off gives the access back. Being on for a site
*is* holding its permission: Chrome keeps granted sites until they're removed,
and the extension registers its script for exactly those sites, so nothing runs
anywhere else. Sites can also be removed from the extension's page in Chrome
(`chrome://extensions` → Details → Site access).

- `activeTab` — lets the button read the current tab's address when clicked.
- `scripting` — runs the script on the sites that are on.
- `optional_host_permissions: *://*/*` — the upper bound of what may be
  requested, one site at a time; nothing is granted until you click.

## Install (unpacked)

1. Chrome → `chrome://extensions` → turn on **Developer mode** (top right).
2. **Load unpacked** → pick this folder.

After changing the code: the circular arrow on the extension's card, then
reload the tab.

## Files

- `manifest.json` — Manifest V3.
- `background.js` — the toolbar button: asks for / gives back the site, keeps
  the script registered for exactly the granted sites, shows the badge.
- `content.js` — the behavior on the page: checking the divs, watching the page
  for changes.
- `icons/` — drawn by `tools/make-icons.py` (Python standard library only).
- `test/demo.html` — one example per rule. Serve it over HTTP to try it (the
  extension doesn't run on local files), e.g. `python3 -m http.server` in this
  folder, then open `http://localhost:8000/test/demo.html`.
