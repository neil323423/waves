document.addEventListener('DOMContentLoaded', () => {
  const historyStack = [];
  let currentIndex = -1;
  const refreshIcon = document.getElementById('refreshIcon');
  const fullscreenIcon = document.getElementById('fullscreenIcon');
  const backIcon = document.getElementById('backIcon');
  const forwardIcon = document.getElementById('forwardIcon');
  const iframe = document.getElementById('cool-iframe');
  refreshIcon.addEventListener('click', function () {
    refreshIcon.classList.add('spin');
    if (iframe && iframe.tagName === 'IFRAME') {
      const currentUrl = iframe.contentWindow.location.href;
      if (normalizeUrl(currentUrl) !== normalizeUrl(historyStack[currentIndex] || '')) {
        addToHistory(currentUrl);
      }
      iframe.contentWindow.location.reload(true);
    }
    setTimeout(() => {
      refreshIcon.classList.remove('spin');
    }, 300);
  });
  fullscreenIcon.addEventListener('click', function () {
    if (iframe && iframe.tagName === 'IFRAME') {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      } else if (iframe.mozRequestFullScreen) {
        iframe.mozRequestFullScreen();
      } else if (iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
      } else if (iframe.msRequestFullscreen) {
        iframe.msRequestFullscreen();
      }
    }
  });
  backIcon.addEventListener('click', function () {
    if (currentIndex > 0) {
      currentIndex--;
      if (iframe && iframe.tagName === 'IFRAME') {
        iframe.src = historyStack[currentIndex];
      }
      updateNavButtons();
      updateDecodedSearchInput();
    }
  });
  forwardIcon.addEventListener('click', function () {
    if (currentIndex < historyStack.length - 1) {
      currentIndex++;
      if (iframe && iframe.tagName === 'IFRAME') {
        iframe.src = historyStack[currentIndex];
      }
      updateNavButtons();
      updateDecodedSearchInput();
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
    updateDecodedSearchInput();
  }
  function updateNavButtons() {
    backIcon.disabled = (currentIndex <= 0);
    forwardIcon.disabled = (currentIndex >= historyStack.length - 1);
    backIcon.classList.toggle('disabled', currentIndex <= 0);
    forwardIcon.classList.toggle('disabled', currentIndex >= historyStack.length - 1);
  }
  function updateDecodedSearchInput() {
    const searchInput2 = document.getElementById('searchInputt');
    if (searchInput2) {
      let url = "";
      if (currentIndex >= 0 && historyStack[currentIndex]) {
        url = historyStack[currentIndex];
        searchInput2.value = decodeUrl(url);
      } else {
        if (iframe && iframe.src) {
          url = iframe.src;
          searchInput2.value = decodeUrl(url);
        }
      }
      const lockIcon = document.getElementById('lockIcon');
      if (lockIcon) {
        const decodedUrl = decodeUrl(url);
        if (decodedUrl.startsWith("https://")) {
          lockIcon.className = "fa-solid fa-lock";
          lockIcon.style.color = "white";
        } else {
          lockIcon.className = "fa-solid fa-lock-open";
          lockIcon.style.color = "red";
        }
      }
    }
  }
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
      iframeWindow.addEventListener('popstate', () => {
        handleIframeNavigation(iframeWindow.location.href);
      });
      iframeWindow.addEventListener('hashchange', () => {
        handleIframeNavigation(iframeWindow.location.href);
      });
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
        updateNavButtons();
      } else {
        handleIframeNavigation(iframe.contentWindow.location.href);
      }
      updateDecodedSearchInput();
    } catch (error) {
      console.error("Error detecting iframe navigation:", error);
    }
  });
  const searchContainer = document.querySelector(".search-container");
  const navBar = document.querySelector(".navbar");
  const topBar = document.querySelector(".top-bar");
  const searchInput1 = document.getElementById("searchInput");
  const searchInput2 = document.getElementById("searchInputt");
  const loadingScreen = document.querySelector(".loading-screen");
  const games = document.getElementById("games");
  const movies = document.getElementById("movies");
  const ai = document.getElementById("ai");
  const navbarToggle = document.getElementById("navbar-toggle");
  const savedNavbarState = localStorage.getItem('navbarToggled');
  navbarToggle.checked = savedNavbarState === null ? true : savedNavbarState === 'true';
  navBar.style.display = (iframe.style.display === "block" && navbarToggle.checked) ? "block" : "none";
  navbarToggle.addEventListener("change", () => {
    localStorage.setItem('navbarToggled', navbarToggle.checked);
    navBar.style.display = (iframe.style.display === "block" && navbarToggle.checked) ? "block" : "none";
  });
  iframe.style.display = "none";
  window.addEventListener('load', () => {
    hideLoadingScreen();
  });
  [searchInput1, searchInput2].forEach(input => {
    input.addEventListener("keyup", (e) => {
      if (e.key === "Enter") handleSearch(input.value);
    });
  });
  games.addEventListener("click", (e) => {
    e.preventDefault();
    handleSearch("https://crazygames.com/");
  });
  movies.addEventListener("click", (e) => {
    e.preventDefault();
    handleSearch("https://xojw.github.io/waves-movies/");
  });
  ai.addEventListener("click", (e) => {
    e.preventDefault();
    handleSearch("https://chat.vercel.ai/");
  });
  async function handleSearch(query) {
    const searchURL = generateSearchUrl(query);
    searchInput2.value = searchURL;
    preloadResources(searchURL);
    showLoadingScreen();
    searchContainer.style.display = "none";
    iframe.style.display = "block";
    topBar.style.display = "none";
    backIcon.disabled = true;
    forwardIcon.disabled = true;
    iframe.src = await getUrl(searchURL);
    historyStack.length = 0;
    currentIndex = -1;
    iframe.onload = () => {
      hideLoadingScreen();
      if (navbarToggle.checked) navBar.style.display = "block";
      generateError();
      updateDecodedSearchInput();
      try {
        if (iframe.contentDocument && !iframe.contentDocument.getElementById('uv-postmessage-hook')) {
          const script = iframe.contentDocument.createElement('script');
          script.id = 'uv-postmessage-hook';
          script.textContent = `(function(){const origPush=history.pushState;const origReplace=history.replaceState;function notify(){window.parent.postMessage({type:'uv-url-change',url:location.href},'*');}history.pushState=function(){origPush.apply(history,arguments);notify();};history.replaceState=function(){origReplace.apply(history,arguments);notify();};window.addEventListener('popstate',notify);window.addEventListener('hashchange',notify);notify();})();`;
          iframe.contentDocument.head.appendChild(script);
        }
      } catch (e) {}
    };
    iframe.onerror = () => {
      hideLoadingScreen();
      alert('Failed to load content.');
    };
  }
  function generateSearchUrl(query) {
    try {
      const url = new URL(query);
      return url.toString();
    } catch {
      try {
        const url = new URL(`https://${query}`);
        if (url.hostname.includes(".")) return url.toString();
      } catch {}
    }
    return `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
  }
  function showToast(message, type = "success", iconType = "check") {
    const toast = document.createElement("div");
    toast.className = `toast show ${type}`;
    const icons = {
      success: '<i class="fa-solid fa-check-circle" style="margin-right: 8px;"></i>',
      error: '<i class="fa-solid fa-times-circle" style="margin-right: 8px;"></i>',
      info: '<i class="fa-solid fa-info-circle" style="margin-right: 8px;"></i>',
      warning: '<i class="fa-solid fa-exclamation-triangle" style="margin-right: 8px;"></i>',
      heart: '<i class="fa-solid fa-heart" style="margin-right: 8px;"></i>'
    };
    const icon = icons[iconType] || icons['heart'];
    toast.innerHTML = `${icon}${message} `;
    const closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark" style="margin-left: 8px; font-size: 0.8em;"></i>';
    closeBtn.addEventListener("click", () => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 500);
    });
    toast.appendChild(closeBtn);
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }
  function showLoadingScreen(withToast = true) {
    loadingScreen.style.display = 'flex';
    setTimeout(() => {
      loadingScreen.style.transition = 'opacity 0.5s ease';
      loadingScreen.style.opacity = 1;
    }, 10);
    loadingScreen.querySelector(".loading-text").innerHTML = "Were getting your content ready, please wait...";
    if (withToast) {
      showToast('Consider joining our <a href="https://discord.gg/dJvdkPRheV" target="_blank" class="hover-link">Discord</a>&nbsp;<3');
    }
  }
  function hideLoadingScreen() {
    loadingScreen.style.transition = 'opacity 0.5s ease';
    loadingScreen.style.opacity = 0;
    setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
  }
  function preloadResources(url) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = url;
    link.as = "fetch";
    document.head.appendChild(link);
  }
  function getUrl(url) {
    return Promise.resolve(__uv$config.prefix + __uv$config.encodeUrl(url));
  }
  function generateError() {
    const code = '404';
    history.replaceState({}, '', '/error?code=' + code);
  }
  function decodeUrl(encodedUrl) {
    try {
      const urlObj = new URL(encodedUrl, window.location.origin);
      const proxyPrefix = __uv$config && __uv$config.prefix ? __uv$config.prefix : '/$/';
      if (urlObj.pathname.startsWith(proxyPrefix)) {
        const encodedPart = urlObj.pathname.substring(proxyPrefix.length);
        if (__uv$config && typeof __uv$config.decodeUrl === 'function') {
          return __uv$config.decodeUrl(encodedPart);
        }
        return decodeURIComponent(encodedPart);
      }
    } catch (e) {}
    return encodedUrl;
  }
  window.decodeUrl = decodeUrl;
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'uv-url-change' && event.data.url) {
      if (normalizeUrl(event.data.url) !== normalizeUrl(historyStack[currentIndex] || '')) {
        addToHistory(event.data.url);
      }
    }
  });
  window.addToHistory = addToHistory;
  window.updateDecodedSearchInput = updateDecodedSearchInput;
  window.normalizeUrl = normalizeUrl;
});
