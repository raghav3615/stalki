let activeTabId = null;
let activeDomain = null;
let lastActivated = Date.now();

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function getTodayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // e.g., "2024-06-09"
}

async function saveTime(domain, ms) {
  if (!domain) return;
  const todayKey = getTodayKey();
  const data = await chrome.storage.local.get([todayKey]);
  const todayData = data[todayKey] || {};
  todayData[domain] = (todayData[domain] || 0) + ms;
  await chrome.storage.local.set({ [todayKey]: todayData });
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  const now = Date.now();
  if (activeDomain) await saveTime(activeDomain, now - lastActivated);
  activeTabId = tabId;
  activeDomain = getDomain(tab.url);
  lastActivated = now;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    const now = Date.now();
    if (activeDomain) saveTime(activeDomain, now - lastActivated);
    activeDomain = getDomain(changeInfo.url);
    lastActivated = now;
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  const now = Date.now();
  if (activeDomain) await saveTime(activeDomain, now - lastActivated);
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    activeTabId = null;
    activeDomain = null;
  } else {
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    if (tab) {
      activeTabId = tab.id;
      activeDomain = getDomain(tab.url);
      lastActivated = now;
    }
  }
});

chrome.runtime.onStartup.addListener(() => {
  activeTabId = null;
  activeDomain = null;
  lastActivated = Date.now();
});