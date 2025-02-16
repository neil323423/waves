document.addEventListener("DOMContentLoaded", function () {
  const navbarHTML = `
    <div class="navbar">
      <ul class="nav-links">
        <li><a id="backIcon" href="#"><img src="/assets/images/icons/back.png" alt="Back"></a></li>
        <li><a id="refreshIcon" href="#"><img src="/assets/images/icons/refresh.png" alt="Refresh"></a></li>
        <li><a id="forwardIcon" href="#"><img src="/assets/images/icons/forward.png" alt="Forward"></a></li>
        <li>
          <div class="search-containersmall">
            <div class="small-searchbar">
              <input class="waves" type="text" id="searchInputt" placeholder="Search for a query or enter a URL..." autocomplete="off">
            </div>
          </div>
        </li>
        <li><a id="erudaIcon" href="#"><img src="/assets/images/icons/eruda.png" alt="Eruda"></a></li>
        <li><a id="fullscreenIcon" href="#"><img src="/assets/images/icons/fullscreen.png" alt="Full-Screen"></a></li>
        <li><a href="/"><img src="/assets/images/icons/out.png" alt="X out"></a></li>
      </ul>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', navbarHTML);
});

const historyStack = [];
let currentIndex = -1;

document.getElementById('refreshIcon').addEventListener('click', function () {
  const refreshIcon = document.getElementById('refreshIcon');
  refreshIcon.classList.add('spin');
  const iframe = document.getElementById('proxy-iframe');
  if (iframe && iframe.tagName === 'IFRAME') {
    const currentUrl = iframe.contentWindow.location.href;
    if (historyStack[currentIndex] !== currentUrl) {
      addToHistory(currentUrl);
    }
    iframe.contentWindow.location.reload(true);
  }
  setTimeout(() => {
    refreshIcon.classList.remove('spin');
  }, 300);
});

document.getElementById('fullscreenIcon').addEventListener('click', function () {
  const iframe = document.getElementById('proxy-iframe');
  if (iframe && iframe.tagName === 'IFRAME') {
    iframe.requestFullscreen();
  }
});

document.getElementById('backIcon').addEventListener('click', function () {
  if (currentIndex > 0) {
    currentIndex--;
    const iframe = document.getElementById('proxy-iframe');
    if (iframe && iframe.tagName === 'IFRAME') {
      iframe.src = historyStack[currentIndex];
    }
    updateNavButtons();
  }
});

document.getElementById('forwardIcon').addEventListener('click', function () {
  if (currentIndex < historyStack.length - 1) {
    currentIndex++;
    const iframe = document.getElementById('proxy-iframe');
    if (iframe && iframe.tagName === 'IFRAME') {
      iframe.src = historyStack[currentIndex];
    }
    updateNavButtons();
  }
});

function addToHistory(url) {
  if (currentIndex < historyStack.length - 1) {
  }
  if (url && !url.includes('%60') && !historyStack.includes(url)) {
    historyStack.push(url);
    currentIndex++;
  }
  updateNavButtons();
}

function updateNavButtons() {
  const backIcon = document.getElementById('backIcon');
  const forwardIcon = document.getElementById('forwardIcon');
  if (currentIndex <= 0) {
    backIcon.classList.add('disabled');
    backIcon.disabled = true;
  } else {
    backIcon.classList.remove('disabled');
    backIcon.disabled = false;
  }
  if (currentIndex >= historyStack.length - 1) {
    forwardIcon.classList.add('disabled');
    forwardIcon.disabled = true;
  } else {
    forwardIcon.classList.remove('disabled');
    forwardIcon.disabled = false;
  }
}

window.addToHistory = addToHistory;

const iframe = document.getElementById('proxy-iframe');

function detectIframeNavigation() {
  const iframeWindow = iframe.contentWindow;
  const originalPushState = iframeWindow.history.pushState;
  const originalReplaceState = iframeWindow.history.replaceState;
  iframeWindow.history.pushState = function () {
    originalPushState.apply(this, arguments);
    handleIframeNavigation(iframeWindow.location.href);
  };
  iframeWindow.history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    handleIframeNavigation(iframeWindow.location.href);
  };
  iframeWindow.addEventListener('popstate', () => {
    handleIframeNavigation(iframeWindow.location.href);
  });
  iframeWindow.addEventListener('hashchange', () => {
    handleIframeNavigation(iframeWindow.location.href);
  });
}

function handleIframeNavigation(url) {
  if (url && url !== historyStack[currentIndex] && !url.includes('%60') && !historyStack.includes(url)) {
    addToHistory(url);
  }
}

iframe.addEventListener('load', () => {
  try {
    detectIframeNavigation();
    if (historyStack.length === 0) {
      updateNavButtons();
    } else {
      handleIframeNavigation(iframe.contentWindow.location.href);
    }
  } catch (error) {
    console.error("Error detecting iframe navigation:", error);
  }
});