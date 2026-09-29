# Chrome Web Store listing

Everything to fill in on the developer console, in its order. Build the package
with `tools/pack.sh` (→ `dist/yamina-<version>.zip`); regenerate the icons with
`tools/make-icons.py` and the images from `store/src/*.html` (see below).

## Package

Upload `dist/yamina-<version>.zip`.

## Store listing tab

**Title** and **summary** come from `manifest.json`:
- Yamina – Auto RTL for Hebrew & Arabic
- Right-aligns Hebrew and Arabic text on the sites you switch it on for.

**Description:**

```
Yamina lines up Hebrew and Arabic text the right way on sites that weren't built for it — chat apps, AI assistants, documents, forums.

Click the Yamina button on a site to switch it on there. From then on, every paragraph, list item, heading or text box that is mostly Hebrew or Arabic is set right-to-left and right-aligned, so sentences start on the right and the question mark lands at the end, where it belongs. English text and code on the same page stay left-to-right.

• Per site: on only where you switch it on. It stays on across visits and browser restarts; click the button again to switch it off.
• Smart: each paragraph gets its own direction, decided by counting its words, so mixed Hebrew and English messages come out right.
• Live: handles new messages as they arrive, infinite scroll, and text as you type.
• Light: checks only what changed, in the browser's idle time, so scrolling and typing never wait on it.
• Private: no permissions at install. The first click on a site asks for access to that site only. Nothing is collected or sent anywhere — there are no servers.

Open source: https://github.com/arikw/yamina
```

**Category:** Make Chrome Yours → Accessibility (alternative: Productivity → Tools)

**Language:** English

**Graphic assets:**

| Field | File | Size |
|---|---|---|
| Store icon | `store/icon-128.png` | 128×128 (art 96×96 with transparent margin) |
| Screenshot 1 | `store/screenshot-1-chat.jpg` | 1280×800 |
| Screenshot 2 | `store/screenshot-2-doc.jpg` | 1280×800 |
| Small promo tile | `store/promo-small-440x280.jpg` | 440×280 |
| Marquee promo tile (optional) | `store/promo-marquee-1400x560.jpg` | 1400×560 |

**Homepage URL:** https://github.com/arikw/yamina
**Support URL:** https://github.com/arikw/yamina/issues

## Privacy tab

**Single purpose:**

```
Sets Hebrew and Arabic text right-to-left and right-aligned on the websites the user switches the extension on for.
```

**Permission justifications:**

- `activeTab`:
  ```
  When the user clicks the toolbar button, reads the current tab's address to know which site to switch on or off.
  ```
- `scripting`:
  ```
  Runs the script that right-aligns Hebrew and Arabic text, only on the sites the user switched on, and in the open tab right after switching it on.
  ```
- Host permission (`optional_host_permissions`):
  ```
  Nothing is granted at install. Each site is requested individually when the user clicks the button on it, so the script can run there on later visits too; clicking again removes that site's access.
  ```

**Remote code:** No, I am not using remote code.

**Data usage:** tick none of the data types. Tick all three certifications
(not sold to third parties; not used for unrelated purposes; not used for
creditworthiness or lending).

**Privacy policy URL:** https://github.com/arikw/yamina/blob/master/PRIVACY.md

## Distribution tab

Free · Public · All regions.

## Rebuilding the images

The pages in `store/src/` run the real `content.js`, so the "With Yamina" side
is exactly what the extension does. From the project folder:
`python3 -m http.server 8000`, then open e.g.
`http://localhost:8000/store/src/shot-chat.html` in a 1280×800 window and take
a screenshot (`promo.html` has both promo tiles, at 440×280 and 1400×560).
Fonts come from Google Fonts, so it needs a network connection.
