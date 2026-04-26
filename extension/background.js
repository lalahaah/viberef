chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-viberef",
    title: "VibeRef에 저장",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-to-viberef") {
    const data = {
      url: tab.url,
      imageUrl: info.srcUrl,
      title: tab.title,
      type: 'image'
    };
    
    // storage에 저장하여 popup에서 읽을 수 있게 함
    chrome.storage.local.set({ pendingItem: data }, () => {
      // 팝업 배지로 알림 (선택사항)
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#F5E642" });
    });
  }
});
