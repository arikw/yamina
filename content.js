// Yamina — content script. Runs only on sites switched on (background.js
// registers it for exactly those). Every <div> whose own text is mostly (over
// half) Hebrew or Arabic letters is set right-to-left and right-aligned.
//
// "Own text" leaves out text inside nested <div>s. Otherwise, on a page that
// is mostly Hebrew, the page-wide wrapper divs would flip too and mirror the
// whole site's layout; this way only the blocks that hold the text change.

(() => {
  // Switched off and on again in the same tab: this script is already here.
  if (globalThis.yamina) { globalThis.yamina.setEnabled(true); return; }

  const MARK = 'data-yamina'; // "rtl" or "ltr" on every div that has letters of its own
  const STYLE_ID = 'yamina-style';

  // Letters only: spaces, digits, punctuation and emoji don't count either way.
  // The lookahead leaves out Hebrew/Arabic vowel marks, which aren't letters.
  const LETTER = /\p{L}/gu;
  const RTL_LETTER = /(?=\p{L})[\p{Script=Hebrew}\p{Script=Arabic}]/gu;
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);

  // An English block inside a Hebrew one would inherit right-to-left, so it
  // is marked "ltr" and set back.
  const CSS = `
    [${MARK}="rtl"] { direction: rtl !important; text-align: right !important; }
    [${MARK}="rtl"] [${MARK}="ltr"] { direction: ltr !important; text-align: left !important; }
  `;

  let enabled = false;
  const pending = new Set();
  let flushTimer = 0;

  function ownText(div) {
    const walker = document.createTreeWalker(div, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
        if (node.tagName === 'DIV' || SKIP.has(node.tagName)) return NodeFilter.FILTER_REJECT; // skip its whole subtree
        return NodeFilter.FILTER_SKIP; // look inside <p>, <span>, …
      },
    });
    let text = '';
    while (walker.nextNode()) text += walker.currentNode.data;
    return text;
  }

  function check(div) {
    const text = ownText(div);
    const letters = text.match(LETTER)?.length || 0;
    if (!letters) { div.removeAttribute(MARK); return; }
    const rtl = text.match(RTL_LETTER)?.length || 0;
    div.setAttribute(MARK, rtl / letters > 0.5 ? 'rtl' : 'ltr');
  }

  // Pages keep changing (chats, feeds, typing); re-check only the divs touched.
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      queueOwner(m.target);
      m.addedNodes.forEach(node => {
        queueOwner(node);
        if (node.nodeType === Node.ELEMENT_NODE) node.querySelectorAll('div').forEach(d => pending.add(d));
      });
    }
    if (pending.size && !flushTimer) flushTimer = setTimeout(flush, 100);
  });

  function queueOwner(node) {
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const div = el?.closest('div');
    if (div) pending.add(div);
  }

  function flush() {
    flushTimer = 0;
    for (const div of pending) if (div.isConnected) check(div);
    pending.clear();
  }

  function setEnabled(on) {
    if (on === enabled) return;
    enabled = on;
    if (on) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      (document.head || document.documentElement).append(style);
      document.querySelectorAll('div').forEach(check);
      observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });
    } else {
      observer.disconnect();
      clearTimeout(flushTimer);
      flushTimer = 0;
      pending.clear();
      document.getElementById(STYLE_ID)?.remove();
      document.querySelectorAll(`[${MARK}]`).forEach(d => d.removeAttribute(MARK));
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
