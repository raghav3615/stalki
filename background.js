const ext = typeof browser !== "undefined" ? browser : chrome;
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
  const data = await ext.storage.local.get([todayKey]);
  const todayData = data[todayKey] || {};
  todayData[domain] = (todayData[domain] || 0) + ms;
  await ext.storage.local.set({ [todayKey]: todayData });
}

ext.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await ext.tabs.get(tabId);
  const now = Date.now();
  if (activeDomain) await saveTime(activeDomain, now - lastActivated);
  activeTabId = tabId;
  activeDomain = getDomain(tab.url);
  lastActivated = now;
});

ext.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    const now = Date.now();
    if (activeDomain) saveTime(activeDomain, now - lastActivated);
    activeDomain = getDomain(changeInfo.url);
    lastActivated = now;
  }
});

ext.windows.onFocusChanged.addListener(async (windowId) => {
  const now = Date.now();
  if (activeDomain) await saveTime(activeDomain, now - lastActivated);
  if (windowId === ext.windows.WINDOW_ID_NONE) {
    activeTabId = null;
    activeDomain = null;
  } else {
    const tabs = await ext.tabs.query({ active: true, windowId });
    const tab = tabs[0];
    if (tab) {
      activeTabId = tab.id;
      activeDomain = getDomain(tab.url);
      lastActivated = now;
    }
  }
});

ext.runtime.onStartup.addListener(() => {
  activeTabId = null;
  activeDomain = null;
  lastActivated = Date.now();
});

ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "getOngoingTime") {
    if (activeDomain && lastActivated) {
      sendResponse({
        domain: activeDomain,
        ms: Date.now() - lastActivated
      });
    } else {
      sendResponse({});
    }
    return true; // async
  }
});

if (ext.contextMenus && ext.contextMenus.onClicked) {
  ext.runtime.onInstalled.addListener(() => {
    ext.contextMenus.create({
      id: "loadTabData",
      title: "Load Tab Data",
      contexts: ["action"]
    });
  });

  ext.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "loadTabData") {
      ext.runtime.sendMessage({ type: "forceReload" });
    }
  });
}