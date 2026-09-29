// Shared by the store-image pages: runs the real content.js on the page (with
// a stand-in for the extension API), then clears it from the "before" panels
// so the two sides show the page without and with Yamina.
(async () => {
  const fake = { runtime: { sendMessage: async () => {}, onMessage: { addListener() {} } } };
  const code = await (await fetch('../../content.js')).text();
  new Function('chrome', code)(fake);
  await new Promise(r => setTimeout(r, 400)); // content.js checks in idle time
  document.querySelectorAll('.before [data-yamina]').forEach(el => el.removeAttribute('data-yamina'));
  await document.fonts.ready;
  document.body.dataset.ready = '1';
})();
