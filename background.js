const ext = typeof browser !== "undefined" ? browser : chrome;

let activeTabId = null;
let activeDomain = null;
let lastActivated = Date.now();
let isTracking = true;
let trackingInterval = null;

// Minimum time threshold (5 seconds) to avoid noise from quick tab switches
const MIN_TRACKING_TIME = 5000;

function getDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. prefix for consistency
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function getTodayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // e.g., "2024-06-09"
}

async function saveTime(domain, ms) {
  if (!domain || ms < MIN_TRACKING_TIME) return;
  
  const todayKey = getTodayKey();
  const data = await ext.storage.local.get([todayKey]);
  const todayData = data[todayKey] || {};
  todayData[domain] = (todayData[domain] || 0) + ms;
  await ext.storage.local.set({ [todayKey]: todayData });
  
  // Notify popup of changes for real-time updates
  try {
    ext.runtime.sendMessage({ type: "dataUpdated" });
  } catch (e) {
    // Popup might not be open, ignore error
  }
}

// Periodic saving to prevent data loss
function startPeriodicSaving() {
  if (trackingInterval) return;
  
  trackingInterval = setInterval(async () => {
    if (activeDomain && isTracking) {
      const now = Date.now();
      const timeSpent = now - lastActivated;
      
      if (timeSpent >= MIN_TRACKING_TIME) {
        await saveTime(activeDomain, timeSpent);
        lastActivated = now;
      }
    }
  }, 30000); // Save every 30 seconds
}

function stopPeriodicSaving() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
}

// Enhanced tab activation handler
ext.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await ext.tabs.get(tabId);
    const now = Date.now();
    
    // Save time for previous domain
    if (activeDomain && isTracking) {
      const timeSpent = now - lastActivated;
      await saveTime(activeDomain, timeSpent);
    }
    
    activeTabId = tabId;
    activeDomain = getDomain(tab.url);
    lastActivated = now;
    isTracking = true;
    
    // Start periodic saving if not already running
    startPeriodicSaving();
  } catch (error) {
    console.error('Error in onActivated:', error);
  }
});

// Enhanced tab update handler
ext.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    const now = Date.now();
    
    // Save time for previous domain
    if (activeDomain && isTracking) {
      const timeSpent = now - lastActivated;
      await saveTime(activeDomain, timeSpent);
    }
    
    activeDomain = getDomain(changeInfo.url);
    lastActivated = now;
  }
});

// Enhanced window focus handler
ext.windows.onFocusChanged.addListener(async (windowId) => {
  const now = Date.now();
  
  // Save time for current domain before focus change
  if (activeDomain && isTracking) {
    const timeSpent = now - lastActivated;
    await saveTime(activeDomain, timeSpent);
  }
  
  if (windowId === ext.windows.WINDOW_ID_NONE) {
    // Browser lost focus
    activeTabId = null;
    activeDomain = null;
    isTracking = false;
    stopPeriodicSaving();
  } else {
    // Browser gained focus
    try {
      const tabs = await ext.tabs.query({ active: true, windowId });
      const tab = tabs[0];
      if (tab) {
        activeTabId = tab.id;
        activeDomain = getDomain(tab.url);
        lastActivated = now;
        isTracking = true;
        startPeriodicSaving();
      }
    } catch (error) {
      console.error('Error in onFocusChanged:', error);
    }
  }
});

// Handle browser startup
ext.runtime.onStartup.addListener(() => {
  activeTabId = null;
  activeDomain = null;
  lastActivated = Date.now();
  isTracking = true;
  startPeriodicSaving();
});

// Handle extension installation/startup
ext.runtime.onInstalled.addListener(() => {
  activeTabId = null;
  activeDomain = null;
  lastActivated = Date.now();
  isTracking = true;
  startPeriodicSaving();
});

// Enhanced message handler
ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "getOngoingTime") {
    if (activeDomain && lastActivated && isTracking) {
      const ongoingTime = Date.now() - lastActivated;
      sendResponse({
        domain: activeDomain,
        ms: ongoingTime >= MIN_TRACKING_TIME ? ongoingTime : 0
      });
    } else {
      sendResponse({});
    }
    return true; // async
  }
  
  if (msg.type === "forceReload") {
    // Handle force reload from context menu
    return true;
  }
});

// Handle browser shutdown - save any remaining time
ext.runtime.onSuspend?.addListener(async () => {
  if (activeDomain && isTracking) {
    const now = Date.now();
    const timeSpent = now - lastActivated;
    await saveTime(activeDomain, timeSpent);
  }
  stopPeriodicSaving();
});

// Context menu for debugging/manual refresh
if (ext.contextMenus && ext.contextMenus.onClicked) {
  ext.runtime.onInstalled.addListener(() => {
    ext.contextMenus.create({
      id: "refreshData",
      title: "Refresh Stalki Data",
      contexts: ["action"]
    });
    
    ext.contextMenus.create({
      id: "clearData",
      title: "Clear All Data",
      contexts: ["action"]
    });
  });

  ext.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "refreshData") {
      ext.runtime.sendMessage({ type: "forceReload" });
    } else if (info.menuItemId === "clearData") {
      if (confirm("Are you sure you want to clear all tracking data?")) {
        await ext.storage.local.clear();
        ext.runtime.sendMessage({ type: "forceReload" });
      }
    }
  });
}