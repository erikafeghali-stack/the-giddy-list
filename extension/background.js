// The Giddy List Chrome Extension - Background Service Worker

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page on install
    chrome.tabs.create({
      url: 'https://thegiddylist.com/extension/welcome'
    });
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openGiddyList') {
    chrome.tabs.create({ url: 'https://thegiddylist.com' });
    sendResponse({ success: true });
  }

  if (request.action === 'openLogin') {
    chrome.tabs.create({ url: 'https://thegiddylist.com/login' });
    sendResponse({ success: true });
  }

  return true;
});

// Optional: Add context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addToGiddyList',
    title: 'Add to The Giddy List',
    contexts: ['page', 'link', 'image']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addToGiddyList') {
    // Open the popup (or a dedicated add page)
    chrome.action.openPopup();
  }
});
