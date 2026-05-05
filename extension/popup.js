const API_URL = 'https://viberef-wheat.vercel.app/api/items';

const translations = {
  ko: {
    labelTitle: '페이지 제목',
    labelUrl: 'URL',
    labelCollection: '컬렉션',
    labelTags: '태그',
    labelMemo: '메모',
    optionNoCollection: '컬렉션 선택 안함',
    placeholderTags: '미니멀, SaaS, 웹디자인',
    placeholderMemo: '메모를 입력하세요...',
    saveBtn: '저장하기',
    savingBtn: '저장 중...',
    statusSuccess: '저장 완료 ✓',
    errorAuth: 'VibeRef에 로그인해주세요.',
    errorServer: '서버에 연결할 수 없습니다.'
  },
  en: {
    labelTitle: 'Page Title',
    labelUrl: 'URL',
    labelCollection: 'Collection',
    labelTags: 'Tags',
    labelMemo: 'Memo',
    optionNoCollection: 'No collection',
    placeholderTags: 'minimal, SaaS, web design',
    placeholderMemo: 'Enter your thoughts...',
    saveBtn: 'Save',
    savingBtn: 'Saving...',
    statusSuccess: 'Saved ✓',
    errorAuth: 'Please login to VibeRef.',
    errorServer: 'Cannot connect to server.'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const pageTitleInput = document.getElementById('pageTitle');
  const pageUrlInput = document.getElementById('pageUrl');
  const collectionSelect = document.getElementById('collection');
  const tagsInput = document.getElementById('tags');
  const memoInput = document.getElementById('memo');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');
  const errorDiv = document.getElementById('error');
  const langToggle = document.getElementById('langToggle');

  let currentLang = 'ko';
  let initialScreenshotUrl = '';

  const updateLanguage = (lang) => {
    currentLang = lang;
    langToggle.textContent = lang.toUpperCase();
    const t = translations[lang];
    
    document.getElementById('labelTitle').textContent = t.labelTitle;
    document.getElementById('labelUrl').textContent = t.labelUrl;
    document.getElementById('labelCollection').textContent = t.labelCollection;
    document.getElementById('labelTags').textContent = t.labelTags;
    document.getElementById('labelMemo').textContent = t.labelMemo;
    document.getElementById('optionNoCollection').textContent = t.optionNoCollection;
    
    tagsInput.placeholder = t.placeholderTags;
    memoInput.placeholder = t.placeholderMemo;
    
    if (saveBtn.style.display !== 'none') {
      saveBtn.textContent = t.saveBtn;
    }
    statusDiv.textContent = t.statusSuccess;
  };

  // 0. 언어 설정 불러오기
  const { language } = await chrome.storage.local.get('language');
  if (language) updateLanguage(language);
  else updateLanguage('ko');

  langToggle.addEventListener('click', () => {
    const newLang = currentLang === 'ko' ? 'en' : 'ko';
    updateLanguage(newLang);
    chrome.storage.local.set({ language: newLang });
  });

  // 1. 초기 데이터 설정 (현재 탭 또는 우클릭 데이터)
  const populateForm = (data) => {
    if (!data) return;
    pageTitleInput.value = data.title || '';
    pageUrlInput.value = data.url || '';
    initialScreenshotUrl = data.imageUrl || '';
    chrome.action.setBadgeText({ text: "" });
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ITEM_CAPTURED') {
      populateForm(message.data);
    }
  });

  const { pendingItem } = await chrome.storage.local.get('pendingItem');
  if (pendingItem) {
    populateForm(pendingItem);
  } else {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs[0]) {
      pageTitleInput.value = tabs[0].title || '';
      pageUrlInput.value = tabs[0].url || '';
    }
  }

  // 2. 컬렉션 목록 가져오기
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    if (data.collections) {
      data.collections.forEach(col => {
        const option = document.createElement('option');
        option.value = col.id;
        option.textContent = col.name;
        collectionSelect.appendChild(option);
      });
    } else if (data.error === 'Unauthorized') {
      errorDiv.textContent = translations[currentLang].errorAuth;
      errorDiv.style.display = 'block';
      saveBtn.disabled = true;
    }
  } catch (err) {
    console.error('Failed to fetch collections:', err);
    errorDiv.textContent = translations[currentLang].errorServer;
    errorDiv.style.display = 'block';
  }

  // 3. 저장 버튼 클릭 이벤트
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = translations[currentLang].savingBtn;
    errorDiv.style.display = 'none';

    const payload = {
      title: pageTitleInput.value,
      url: pageUrlInput.value,
      collection_id: collectionSelect.value,
      tags: tagsInput.value,
      memo: memoInput.value,
      screenshot_url: initialScreenshotUrl
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        chrome.storage.local.remove('pendingItem');
        statusDiv.style.display = 'block';
        saveBtn.style.display = 'none';
        setTimeout(() => window.close(), 1500);
      } else {
        throw new Error(result.error || '저장 실패');
      }
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.style.display = 'block';
      saveBtn.disabled = false;
      saveBtn.textContent = translations[currentLang].saveBtn;
    }
  });
});
