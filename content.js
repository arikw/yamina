// Yamina — content script. Runs only on sites switched on (background.js
// registers it for exactly those). Every text block — div, p, li, heading,
// blockquote — whose own text is mostly (over half) Hebrew or Arabic letters
// is set right-to-left and right-aligned.
//
// "Own text" leaves out text inside nested blocks, so each block is judged by
// the text it holds directly: a div whose text all sits in <p>s is left alone
// and each <p> is judged on its own (a Hebrew paragraph and an English one in
// the same message each get their own direction). And a page-wide wrapper
// never flips just because the page is mostly Hebrew.

(() => {
  // Switched off and on again in the same tab: this script is already here.
  if (globalThis.yamina) { globalThis.yamina.setEnabled(true); return; }

  const BLOCK_TAGS = new Set(['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE']);
  const BLOCKS = [...BLOCK_TAGS].join(',').toLowerCase();
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
  const MARK = 'data-yamina'; // "rtl" or "ltr" on every block that has letters of its own
  const STYLE_ID = 'yamina-style';

  // Letters only: spaces, digits, punctuation and emoji don't count either way.
  // The lookahead leaves out Hebrew/Arabic vowel marks, which aren't letters.
  const LETTER = /\p{L}/gu;
  const RTL_LETTER = /(?=\p{L})[\p{Script=Hebrew}\p{Script=Arabic}]/gu;

  // An English block inside a Hebrew one would inherit right-to-left, so it is
  // marked "ltr" and set back. A flipped list item keeps its bullet inside it:
  // the list's indent is still on the left, so an outside bullet would hang
  // off the right edge.
  const CSS = `
    [${MARK}="rtl"] { direction: rtl !important; text-align: right !important; }
    [${MARK}="rtl"] [${MARK}="ltr"] { direction: ltr !important; text-align: left !important; }
    li[${MARK}="rtl"] { list-style-position: inside !important; }
  `;

  let enabled = false;

  function ownText(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
        if (BLOCK_TAGS.has(node.tagName) || SKIP.has(node.tagName)) return NodeFilter.FILTER_REJECT; // skip its whole subtree
        return NodeFilter.FILTER_SKIP; // look inside <span>, <b>, <a>, …
      },
    });
    let text = '';
    while (walker.nextNode()) text += walker.currentNode.data;
    return text;
  }

  function check(block) {
    const text = ownText(block);
    const letters = text.match(LETTER)?.length || 0;
    if (!letters) { block.removeAttribute(MARK); return; }
    const rtl = text.match(RTL_LETTER)?.length || 0;
    block.setAttribute(MARK, rtl / letters > 0.5 ? 'rtl' : 'ltr');
  }

  // ---- checking in the browser's idle time ----
  // Blocks to check wait in `pending` and are checked only while the browser
  // has nothing else to do, a few milliseconds at a time, so scrolling and
  // typing never wait on us. The 1 s timeout keeps a constantly busy page from
  // putting it off forever.
  const pending = new Set();
  let idleHandle = 0;

  function schedule() {
    if (!idleHandle && pending.size) idleHandle = requestIdleCallback(work, { timeout: 1000 });
  }

  function work(deadline) {
    idleHandle = 0;
    for (const block of pending) {
      if (deadline.timeRemaining() < 1 && !deadline.didTimeout) break;
      pending.delete(block);
      if (block.isConnected) check(block);
    }
    schedule(); // anything left goes into the next idle moment
  }

  // Pages keep changing (chats, infinite scroll, typing): queue only the
  // blocks that changed and the new ones.
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      queueOwner(m.target);
      m.addedNodes.forEach(node => {
        queueOwner(node);
        if (node.nodeType === Node.ELEMENT_NODE) node.querySelectorAll(BLOCKS).forEach(b => pending.add(b));
      });
    }
    schedule();
  });

  function queueOwner(node) {
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const block = el?.closest(BLOCKS);
    if (block) pending.add(block);
  }

  function setEnabled(on) {
    if (on === enabled) return;
    enabled = on;
    if (on) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      (document.head || document.documentElement).append(style);
      document.querySelectorAll(BLOCKS).forEach(b => pending.add(b));
      schedule();
      observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });
    } else {
      observer.disconnect();
      cancelIdleCallback(idleHandle);
      idleHandle = 0;
      pending.clear();
      document.getElementById(STYLE_ID)?.remove();
      document.querySelectorAll(`[${MARK}]`).forEach(b => b.removeAttribute(MARK));
    }
    report();
  }

  function report() {
    chrome.runtime.sendMessage({ type: 'state', enabled }).catch(() => { /* service worker restarting */ });
  }

  // Switched off: background.js tells every open tab of the site.
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'disable') setEnabled(false);
  });

  globalThis.yamina = { setEnabled };
  setEnabled(true);
})();
