const style = document.createElement('style');
style.textContent = `
@keyframes slideLeft {0% { transform: translateX(0); } 50% { transform: translateX(-5px); } 100% { transform: translateX(0); }}
@keyframes slideRight {0% { transform: translateX(0); } 50% { transform: translateX(5px); } 100% { transform: translateX(0); }}
.button-animate-back { animation: slideLeft 0.2s ease-in-out; }
.button-animate-forward { animation: slideRight 0.2s ease-in-out; }
`;
document.head.appendChild(style);

const historyStack = [];
let currentIndex = -1;

document.getElementById('refreshIcon').addEventListener('click', function () {
  const refreshIcon = document.getElementById('refreshIcon');
  refreshIcon.classList.add('spin');
  const iframe = document.getElementById('cool-iframe');
  if (iframe && iframe.tagName === 'IFRAME') {
    const currentUrl = iframe.contentWindow.location.href;
    if (normalizeUrl(currentUrl) !== normalizeUrl(historyStack[currentIndex] || '')) {
      addToHistory(currentUrl);
    }
    iframe.contentWindow.location.reload(true);
  }
  setTimeout(() => { refreshIcon.classList.remove('spin'); }, 300);
});

document.getElementById('fullscreenIcon').addEventListener('click', function () {
  const iframe = document.getElementById('cool-iframe');
  if (iframe && iframe.tagName === 'IFRAME') {
    iframe.requestFullscreen();
  }
});

document.getElementById('backIcon').addEventListener('click', function () {
  const backIcon = document.getElementById('backIcon');
  backIcon.classList.add('button-animate-back');
  setTimeout(() => { backIcon.classList.remove('button-animate-back'); }, 200);
  if (currentIndex > 0) {
    currentIndex--;
    const iframe = document.getElementById('cool-iframe');
    if (iframe && iframe.tagName === 'IFRAME') {
      iframe.src = historyStack[currentIndex];
    }
    updateNavButtons();
    window.updateDecodedSearchInput();
  }
});

document.getElementById('forwardIcon').addEventListener('click', function () {
  const forwardIcon = document.getElementById('forwardIcon');
  forwardIcon.classList.add('button-animate-forward');
  setTimeout(() => { forwardIcon.classList.remove('button-animate-forward'); }, 200);
  if (currentIndex < historyStack.length - 1) {
    currentIndex++;
    const iframe = document.getElementById('cool-iframe');
    if (iframe && iframe.tagName === 'IFRAME') {
      iframe.src = historyStack[currentIndex];
    }
    updateNavButtons();
    window.updateDecodedSearchInput();
  }
});

function normalizeUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    url.searchParams.delete("ia");
    return url.toString();
  } catch (e) {
    return urlStr;
  }
}

function addToHistory(url) {
  const normalized = normalizeUrl(url);
  if (currentIndex >= 0 && normalizeUrl(historyStack[currentIndex]) === normalized) return;
  if (currentIndex < historyStack.length - 1) {
    historyStack.splice(currentIndex + 1);
  }
  historyStack.push(url);
  currentIndex++;
  updateNavButtons();
  window.updateDecodedSearchInput();
}

function updateNavButtons() {
  const backIcon = document.getElementById('backIcon');
  const forwardIcon = document.getElementById('forwardIcon');
  backIcon.disabled = (currentIndex <= 0);
  forwardIcon.disabled = (currentIndex >= historyStack.length - 1);
  backIcon.classList.toggle('disabled', currentIndex <= 0);
  forwardIcon.classList.toggle('disabled', currentIndex >= historyStack.length - 1);
}

function updateDecodedSearchInput() {
  const searchInput2 = document.getElementById('searchInputt');
  if (searchInput2) {
    if (currentIndex >= 0 && historyStack[currentIndex]) {
      searchInput2.value = decodeUrl(historyStack[currentIndex]);
    } else {
      const iframe = document.getElementById('cool-iframe');
      if (iframe && iframe.src) {
        searchInput2.value = decodeUrl(iframe.src);
      }
    }
  }
}

window.addToHistory = addToHistory;
window.updateDecodedSearchInput = updateDecodedSearchInput;
window.normalizeUrl = normalizeUrl;

const iframe = document.getElementById('cool-iframe');

function detectIframeNavigation() {
  try {
    const iframeWindow = iframe.contentWindow;
    const origPushState = iframeWindow.history.pushState;
    const origReplaceState = iframeWindow.history.replaceState;
    iframeWindow.history.pushState = function () {
      origPushState.apply(this, arguments);
      handleIframeNavigation(iframeWindow.location.href);
    };
    iframeWindow.history.replaceState = function () {
      origReplaceState.apply(this, arguments);
      handleIframeNavigation(iframeWindow.location.href);
    };
    iframeWindow.addEventListener('popstate', () => { handleIframeNavigation(iframeWindow.location.href); });
    iframeWindow.addEventListener('hashchange', () => { handleIframeNavigation(iframeWindow.location.href); });
  } catch (error) {
    console.error("Error detecting iframe navigation:", error);
  }
}

function handleIframeNavigation(url) {
  if (url && normalizeUrl(url) !== normalizeUrl(historyStack[currentIndex] || '')) {
    addToHistory(url);
  }
}

iframe.addEventListener('load', () => {
  try {
    detectIframeNavigation();
    if (historyStack.length === 0) {
      addToHistory(iframe.contentWindow.location.href);
    } else {
      handleIframeNavigation(iframe.contentWindow.location.href);
    }
  } catch (error) {
    console.error("Error detecting iframe navigation:", error);
  }
});
