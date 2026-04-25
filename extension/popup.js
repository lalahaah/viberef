const API_URL = 'https://viberef-wheat.vercel.app/api/items';

document.addEventListener('DOMContentLoaded', async () => {
  const pageTitleInput = document.getElementById('pageTitle');
  const pageUrlInput = document.getElementById('pageUrl');
  const collectionSelect = document.getElementById('collection');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');
  const errorDiv = document.getElementById('error');

  // 1. 현재 탭 정보 가져오기
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    pageTitleInput.value = tab.title || '';
    pageUrlInput.value = tab.url || '';
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
      errorDiv.textContent = 'VibeRef에 로그인해주세요.';
      errorDiv.style.display = 'block';
      saveBtn.disabled = true;
    }
  } catch (err) {
    console.error('Failed to fetch collections:', err);
    errorDiv.textContent = '서버에 연결할 수 없습니다.';
    errorDiv.style.display = 'block';
  }

  // 3. 저장 버튼 클릭 이벤트
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';
    errorDiv.style.display = 'none';

    const payload = {
      title: pageTitleInput.value,
      url: pageUrlInput.value,
      collection_id: collectionSelect.value,
      tags: document.getElementById('tags').value,
      memo: document.getElementById('memo').value
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
      saveBtn.textContent = '저장하기';
    }
  });
});
