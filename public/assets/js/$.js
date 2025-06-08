document.addEventListener('DOMContentLoaded', () => {
    window.APP = {};

    const iframe = document.getElementById('cool-iframe');
    const erudaLoadingScreen = document.getElementById('erudaLoadingScreen');
    const searchInput1 = document.getElementById('searchInput');
    const movies = document.getElementById('movies');
    const ai = document.getElementById('ai');
    const topBar = document.querySelector('.topbar');
    const refreshIcon = document.getElementById('refreshIcon');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    const backIcon = document.getElementById('backIcon');
    const forwardIcon = document.getElementById('forwardIcon');
    const searchInput2 = document.getElementById('searchInputt');
    const lockIcon = document.getElementById('lockIcon');
    const navbarToggle = document.getElementById('navbar-toggle');
    const navBar = document.querySelector('.navbar');

    const historyStack = [];
    let currentIndex = -1;
    const originalTitle = document.title;
    let isLoading = false;

    if (!iframe || !refreshIcon || !fullscreenIcon || !backIcon || !forwardIcon) {
        return;
    }

    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        @keyframes slideLeft {0% { transform: translateX(0); } 50% { transform: translateX(-5px); } 100% { transform: translateX(0); }}
        @keyframes slideRight {0% { transform: translateX(0); } 50% { transform: translateX(5px); } 100% { transform: translateX(0); }}
        .button-animate-back { animation: slideLeft 0.3s ease-in-out; }
        .button-animate-forward { animation: slideRight 0.3s ease-in-out; }
        .spin { animation: spinAnimation 0.3s linear; }
        @keyframes spinAnimation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;
    document.head.appendChild(animationStyle);

    function showLoadingScreen(withToast = true) {
        if (isLoading) return;
        isLoading = true;
        if (typeof NProgress !== 'undefined') NProgress.start();

        if (withToast) {
            showToast(
                'Consider joining our <a href="https://discord.gg/dJvdkPRheV" target="_blank" class="hover-link">Discord</a>&nbsp;<3',
                'success',
                'heart'
            );
        }
    }

    function hideLoadingScreen() {
        if (!isLoading) return;
        if (typeof NProgress !== 'undefined') NProgress.done();
        document.title = originalTitle;
        isLoading = false;
        if (erudaLoadingScreen) erudaLoadingScreen.style.display = 'none';
    }

    function normalizeUrl(urlStr) {
        if (!urlStr || urlStr === 'about:blank') return urlStr;
        try {
            const url = new URL(urlStr);
            url.searchParams.delete('ia');
            return url.toString();
        } catch {
            return urlStr;
        }
    }

    function decodeUrl(encodedUrl) {
        if (!encodedUrl) return '';
        try {
            const prefix = (typeof __uv$config !== 'undefined' && __uv$config.prefix) ? __uv$config.prefix : '/wa/a/';
            const decodeFunction = (typeof __uv$config !== 'undefined' && __uv$config.decodeUrl) ? __uv$config.decodeUrl : decodeURIComponent;
            const urlObject = new URL(encodedUrl, window.location.origin);
            if (urlObject.pathname.startsWith(prefix)) {
                const encodedPart = urlObject.pathname.slice(prefix.length);
                return decodeFunction(encodedPart) + urlObject.search + urlObject.hash;
            }
        } catch {}
        try {
            return decodeURIComponent(encodedUrl);
        } catch {
            return encodedUrl;
        }
    }

    function updateNavButtons() {
        if (!backIcon || !forwardIcon) return;
        const canGoBack = currentIndex > 0;
        const canGoForward = currentIndex < historyStack.length - 1;
        backIcon.disabled = !canGoBack;
        forwardIcon.disabled = !canGoForward;
        backIcon.classList.toggle('disabled', !canGoBack);
        forwardIcon.classList.toggle('disabled', !canGoForward);
    }

    function updateDecodedSearchInput() {
        if (!searchInput2) return;
        let currentUrl = '';
        if (currentIndex >= 0 && historyStack[currentIndex]) {
            currentUrl = historyStack[currentIndex];
        } else if (iframe.src && iframe.src !== 'about:blank') {
            currentUrl = iframe.src;
        }
        const decoded = decodeUrl(currentUrl);
        searchInput2.value = decoded;

        if (lockIcon) {
            const isSecure = decoded.startsWith('https://');
            lockIcon.className = isSecure ? 'fa-regular fa-lock' : 'fa-regular fa-lock-open';
        }
    }

    function addToHistory(url, isReplacingCurrent = false) {
        if (!url || url === 'about:blank') return;

        const normalizedNewUrl = normalizeUrl(url);
        const currentHistoryEntry = historyStack[currentIndex];
        const normalizedCurrentHistoryEntry = currentIndex >= 0 ? normalizeUrl(currentHistoryEntry) : null;

        if (isReplacingCurrent && currentIndex >= 0) {
            if (normalizedCurrentHistoryEntry !== normalizedNewUrl || currentHistoryEntry !== url) {
                historyStack[currentIndex] = url;
            } else {
                return;
            }
        } else {
            if (normalizedCurrentHistoryEntry === normalizedNewUrl && currentHistoryEntry === url) {
                return;
            }
            if (currentIndex < historyStack.length - 1) {
                historyStack.splice(currentIndex + 1);
            }
            historyStack.push(url);
            currentIndex++;
        }
        updateNavButtons();
        updateDecodedSearchInput();
    }

    function generateSubject() {
        const subjects = ['math', 'science', 'history', 'art', 'programming', 'philosophy'];
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
        try {
            history.replaceState({}, '', `/learning?subject=${randomSubject}`);
        } catch (e) {}
    }

    function setupIframeNavigationListeners() {
        try {
            const iframeWindow = iframe.contentWindow;
            if (!iframeWindow || iframeWindow === window || iframeWindow.location.href === 'about:blank') return;

            const handleNav = (isReplace = false) => {
                setTimeout(() => {
                    try {
                        const newUrlInIframe = iframeWindow.location.href;
                        if (newUrlInIframe === 'about:blank' && historyStack[currentIndex] === 'about:blank') return;
                        addToHistory(newUrlInIframe, isReplace);
                    } catch (e) {}
                }, 0);
            };

            if (!iframeWindow.history.pushState.__isPatched) {
                const originalPushState = iframeWindow.history.pushState;
                iframeWindow.history.pushState = function(...args) {
                    originalPushState.apply(this, args);
                    handleNav(false);
                };
                iframeWindow.history.pushState.__isPatched = true;
            }
            if (!iframeWindow.history.replaceState.__isPatched) {
                const originalReplaceState = iframeWindow.history.replaceState;
                iframeWindow.history.replaceState = function(...args) {
                    originalReplaceState.apply(this, args);
                    handleNav(true);
                };
                iframeWindow.history.replaceState.__isPatched = true;
            }

            iframeWindow.removeEventListener('popstate', iframeWindow.__popstateHandler);
            iframeWindow.__popstateHandler = () => handleNav(false);
            iframeWindow.addEventListener('popstate', iframeWindow.__popstateHandler);

            iframeWindow.removeEventListener('hashchange', iframeWindow.__hashchangeHandler);
            iframeWindow.__hashchangeHandler = () => handleNav(false);
            iframeWindow.addEventListener('hashchange', iframeWindow.__hashchangeHandler);
        } catch (error) {}
    }

    iframe.addEventListener('loadstart', () => {
        showLoadingScreen(false);
        if (navbarToggle && navbarToggle.checked && navBar) {
            navBar.style.display = 'block';
        }
    });

    iframe.addEventListener('load', () => {
        hideLoadingScreen();
        try {
            const newUrl = iframe.contentWindow ? iframe.contentWindow.location.href : iframe.src;
            if (newUrl && newUrl !== 'about:blank') {
                if (currentIndex === -1 || normalizeUrl(historyStack[currentIndex]) !== normalizeUrl(newUrl) || historyStack[currentIndex] !== newUrl) {
                    addToHistory(newUrl);
                } else if (historyStack[currentIndex] !== newUrl) {
                    addToHistory(newUrl, true);
                }
            } else if (newUrl === 'about:blank' && historyStack.length > 0 && historyStack[currentIndex] !== 'about:blank') {
                if (currentIndex > 0) {
                    const previousUrl = historyStack[currentIndex - 1];
                    currentIndex--;
                    iframe.src = previousUrl;
                    return;
                }
            }
            setupIframeNavigationListeners();
            generateSubject();
            if (navbarToggle && navbarToggle.checked && navBar) {
                navBar.style.display = 'block';
            }
        } catch (error) {} finally {
            updateNavButtons();
            updateDecodedSearchInput();
        }
    });

    iframe.addEventListener('error', () => {
        hideLoadingScreen();
        showToast('Error: Could not load page content.', 'error', 'times-circle');
        updateNavButtons();
        updateDecodedSearchInput();
    });

    function toggleButtonAnimation(button, animationClass) {
        if (button) {
            button.classList.add(animationClass);
            setTimeout(() => button.classList.remove(animationClass), 200);
        }
    }

    backIcon.addEventListener('click', () => {
        toggleButtonAnimation(backIcon, 'button-animate-back');
        if (currentIndex > 0) {
            currentIndex--;
            showLoadingScreen(false);
            iframe.src = historyStack[currentIndex];
            updateNavButtons();
            updateDecodedSearchInput();
        }
    });

    forwardIcon.addEventListener('click', () => {
        toggleButtonAnimation(forwardIcon, 'button-animate-forward');
        if (currentIndex < historyStack.length - 1) {
            currentIndex++;
            showLoadingScreen(false);
            iframe.src = historyStack[currentIndex];
            updateNavButtons();
            updateDecodedSearchInput();
        }
    });

    refreshIcon.addEventListener('click', () => {
        if (refreshIcon) refreshIcon.classList.add('spin');
        if (iframe.contentWindow) {
            showLoadingScreen(false);
            const currentIframeUrl = iframe.contentWindow.location.href;
            if (normalizeUrl(currentIframeUrl) !== normalizeUrl(historyStack[currentIndex] || '')) {
                addToHistory(currentIframeUrl);
            }
            iframe.contentWindow.location.reload(true);
        }
        if (refreshIcon) setTimeout(() => refreshIcon.classList.remove('spin'), 300);
    });

    fullscreenIcon.addEventListener('click', () => {
        if (iframe.requestFullscreen) iframe.requestFullscreen();
        else if (iframe.mozRequestFullScreen) iframe.mozRequestFullScreen();
        else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
        else if (iframe.msRequestFullscreen) iframe.msRequestFullscreen();
    });

    function generateSearchUrl(query) {
        query = query.trim();
        if (!query) return `https://duckduckgo.com/?q=&ia=web`;

        if (/^[a-zA-Z]+:\/\//.test(query)) {
            try {
                new URL(query);
                return query;
            } catch (e) {}
        }

        if (/^(localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)?$/.test(query) || query.toLowerCase() === "localhost") {
            if (!query.toLowerCase().startsWith("http:") && !query.toLowerCase().startsWith("https:")) {
                return `http://${query}`;
            }
            return query;
        }

        try {
            const urlWithHttps = new URL(`https://${query}`);
            if (urlWithHttps.hostname &&
                urlWithHttps.hostname.includes('.') &&
                !urlWithHttps.hostname.endsWith('.') &&
                urlWithHttps.hostname !== '.' &&
                urlWithHttps.hostname.split('.').pop().length >= 2 &&
                !/^\d+$/.test(urlWithHttps.hostname.split('.').pop())
            ) {
                return urlWithHttps.toString();
            }
        } catch (e) {}

        return `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`;
    }

    async function getUrl(url) {
        if (typeof __uv$config !== 'undefined' && __uv$config.encodeUrl) {
            return Promise.resolve(__uv$config.prefix + __uv$config.encodeUrl(url));
        }
        return Promise.resolve(url);
    }

    function clearBackground() {
        const preservedElements = [
            navBar, iframe, document.querySelector('.loading-screen'),
            erudaLoadingScreen, topBar
        ].filter(el => el != null);
        Array.from(document.body.children).forEach(child => {
            if (!preservedElements.includes(child) && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE' && !child.classList.contains('toast')) {
                child.remove();
            }
        });
    }

    async function handleSearch(query) {
        if (!query || !query.trim()) {
            showToast('Please enter something in the Search Bar.', 'error', 'warning');
            return;
        }
        clearBackground();
        let searchURL = generateSearchUrl(query);

        historyStack.length = 0;
        currentIndex = -1;
        updateNavButtons();
        showLoadingScreen(true);
        iframe.style.display = 'block';
        if (topBar) topBar.style.display = 'flex';
        if (navBar && navbarToggle && navbarToggle.checked) navBar.style.display = 'block';

        let finalUrlToLoad;
        if (searchURL.startsWith(window.location.origin + '/assets/g/')) {
            finalUrlToLoad = searchURL;
        } else if (searchURL.startsWith('/assets/g/')) {
            finalUrlToLoad = new URL(searchURL, window.location.origin).href;
        } else {
            try {
                const tempUrl = new URL(searchURL);
                if (tempUrl.origin === window.location.origin && tempUrl.pathname.startsWith('/assets/g/')) {
                    finalUrlToLoad = tempUrl.href;
                } else {
                    finalUrlToLoad = await getUrl(searchURL);
                }
            } catch (e) {
                finalUrlToLoad = await getUrl(searchURL);
            }
        }

        if (searchInput2) searchInput2.value = decodeUrl(finalUrlToLoad);
        iframe.src = finalUrlToLoad;
    }
    window.APP.handleSearch = handleSearch;

    [searchInput1, searchInput2].forEach(input => {
        if (input) {
            input.addEventListener('keyup', e => {
                if (e.key === 'Enter') {
                    const queryValue = input.value.trim();
                    if (queryValue) {
                        APP.handleSearch(queryValue);
                        if (input === searchInput1) searchInput1.value = '';
                    } else {
                        showToast('Please enter something in the Search Bar.', 'error', 'warning');
                    }
                }
            });
            if (input === searchInput2) {
                input.addEventListener('focus', updateDecodedSearchInput);
            }
        }
    });

    if (movies) movies.addEventListener('click', e => {
        e.preventDefault();
        APP.handleSearch('https://movies.usewaves.site/');
    });
    if (ai) ai.addEventListener('click', e => {
        e.preventDefault();
        APP.handleSearch('https://ai.usewaves.site/');
    });

    function showToast(message, type = 'success', iconType = 'check') {
        const toast = document.createElement('div');
        toast.className = `toast show ${type}`;
        const icons = {
            'check': 'fa-regular fa-check-circle',
            'times-circle': 'fa-regular fa-times-circle',
            'info': 'fa-regular fa-info-circle',
            'warning': 'fa-regular fa-exclamation-triangle',
            'heart': 'fa-solid fa-heart'
        };
        toast.innerHTML = `<i class="${icons[iconType] || icons.heart}" style="margin-right: 8px;"></i>${message}`;
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        toast.appendChild(progressBar);
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark" style="margin-left: 8px; font-size: 0.8em;"></i>';
        closeBtn.onclick = () => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 500);
        };
        toast.appendChild(closeBtn);
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    if (navbarToggle && navBar && iframe) {
        const savedNavbarState = localStorage.getItem('navbarToggled');
        navbarToggle.checked = savedNavbarState !== 'false';

        const updateNavbarDisplayBasedOnToggle = () => {
            if (iframe.style.display === 'block') {
                navBar.style.display = navbarToggle.checked ? 'block' : 'none';
            } else {
                navBar.style.display = 'none';
            }
        };
        updateNavbarDisplayBasedOnToggle();

        navbarToggle.addEventListener('change', () => {
            localStorage.setItem('navbarToggled', navbarToggle.checked.toString());
            updateNavbarDisplayBasedOnToggle();
        });

        window.APP.updateNavbarDisplay = updateNavbarDisplayBasedOnToggle;
    }

    window.addEventListener('load', () => {
        let iframeInitiallyHidden = true;
        if (iframe.src && iframe.src !== 'about:blank') {
            iframeInitiallyHidden = false;
        }

        if (iframeInitiallyHidden) {
            hideLoadingScreen();
            if (topBar) topBar.style.display = 'flex';
            iframe.style.display = 'none';
        } else {
            if (topBar) topBar.style.display = 'flex';
            iframe.style.display = 'block';
        }

        if (window.APP.updateNavbarDisplay) window.APP.updateNavbarDisplay();
        updateNavButtons();
        updateDecodedSearchInput();
    });

    window.APP.decodeUrl = decodeUrl;
    window.APP.normalizeUrl = normalizeUrl;
});