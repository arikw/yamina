// Yamina — service worker.
//
// "On for a site" simply means "Chrome granted us that site". The toolbar
// button asks for the site (turn on) or hands it back (turn off). Chrome keeps
// granted sites until they're removed, and content.js is registered to run on
// exactly the granted sites — so a site stays on across visits and browser
// restarts without clicking again, and nothing runs anywhere else.

const SCRIPT_ID = 'yamina';
const TITLE_ON = 'Yamina: on for this site. Click to turn off.';
const TITLE_OFF = 'Yamina: off for this site. Click to turn on.';

chrome.action.onClicked.addListener(tab => {
  const host = hostOf(tab.url); // readable thanks to activeTab, since the user clicked
  if (!host) { cantRun(tab.id); return; }
  const origins = [`*://${host}/*`];
  // Both calls start before any await: the click counts as a user gesture only
  // until the first await, and the permission prompt needs one. When the site
  // is already granted, request() answers at once without a prompt.
  const wasOn = chrome.permissions.contains({ origins });
  const granted = chrome.permissions.request({ origins });
  Promise.all([wasOn, granted])
    .then(([on, allowed]) => {
      if (on) return turnOff(origins);
      if (allowed) return turnOn(tab.id);
    })
    .catch(() => cantRun(tab.id));
});

function hostOf(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.hostname : null;
  } catch {
    return null;
  }
}

async function turnOn(tabId) {
  await syncRegistration();
  // Registration covers future page loads; this covers the page already open.
  await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
}

async function turnOff(origins) {
  // Tell open tabs first, while we can still see which ones are on this site.
  const tabs = await chrome.tabs.query({ url: origins });
  await Promise.all(tabs.map(t => chrome.tabs.sendMessage(t.id, { type: 'disable' }).catch(() => {})));
  await chrome.permissions.remove({ origins });
  await syncRegistration();
}

// Registers content.js for exactly the granted sites. Runs one at a time, since
// clicks and permission events can overlap.
let syncing = Promise.resolve();
function syncRegistration() {
  syncing = syncing
    .then(async () => {
      const { origins = [] } = await chrome.permissions.getAll();
      const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
      if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
      if (origins.length) {
        await chrome.scripting.registerContentScripts([{
          id: SCRIPT_ID,
          matches: origins,
          js: ['content.js'],
          runAt: 'document_idle',
          persistAcrossSessions: true,
        }]);
      }
    })
    .catch(err => console.error('Yamina: could not register the content script', err));
  return syncing;
}

chrome.runtime.onInstalled.addListener(syncRegistration);
// Also when a site is granted or removed from Chrome's own extension settings.
chrome.permissions.onAdded.addListener(syncRegistration);
chrome.permissions.onRemoved.addListener(syncRegistration);

function cantRun(tabId) {
  // Browser pages (chrome://, the Web Store), local files, or a prompt error.
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#b42318' });
  chrome.action.setBadgeText({ tabId, text: '!' });
  chrome.action.setTitle({ tabId, title: "Yamina can't run on this page." });
}

// content.js reports its state when it starts and whenever it changes.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'state' || !sender.tab) return;
  const tabId = sender.tab.id;
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#1a7f37' });
  chrome.action.setBadgeText({ tabId, text: msg.enabled ? 'ON' : '' });
  chrome.action.setTitle({ tabId, title: msg.enabled ? TITLE_ON : TITLE_OFF });
});
