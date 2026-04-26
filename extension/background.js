// 메뉴 생성 함수
function createMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "save-to-viberef",
      title: "VibeRef에 저장",
      contexts: ["image"]
    });
  });
}

// 설치 시 또는 업데이트 시 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  createMenus();
});

// 서비스 워커가 시작될 때마다 메뉴 확인
chrome.runtime.onStartup.addListener(() => {
  createMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-to-viberef") {
    const data = {
      url: tab.url,
      imageUrl: info.srcUrl,
      title: tab.title,
      type: 'image'
    };
    
    // 1. Storage에 데이터 저장
    chrome.storage.local.set({ pendingItem: data }, () => {
      // 2. 팝업 자동 오픈 (Chrome 116+ 지원)
      if (typeof chrome.action.openPopup === 'function') {
        chrome.action.openPopup();
      }
      
      // 배지 표시 (구버전 또는 자동 오픈 실패 대비)
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#F5E642" });
    });
  }
});
