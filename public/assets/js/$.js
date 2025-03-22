document.addEventListener('DOMContentLoaded', () => {
	const historyStack = [];
	let currentIndex = -1;
	const refreshIcon = document.getElementById('refreshIcon');
	const fullscreenIcon = document.getElementById('fullscreenIcon');
	const backIcon = document.getElementById('backIcon');
	const forwardIcon = document.getElementById('forwardIcon');
	const iframe = document.getElementById('cool-iframe');
	const erudaLoadingScreen = document.getElementById('erudaLoadingScreen');
	if (!refreshIcon || !fullscreenIcon || !backIcon || !forwardIcon || !iframe) return;
	let loadingFallbackTimeout;
	
	function showLoadingScreen(withToast = true, withAd = true, showEruda = false) {
		const loadingScreen = document.querySelector(".loading-screen");
		if (!loadingScreen) return;
	
		if (erudaLoadingScreen) {
			erudaLoadingScreen.style.display = 'none';
		}
	
		if (showEruda && erudaLoadingScreen) {
			erudaLoadingScreen.style.display = 'block';
		} else if (erudaLoadingScreen) {
			erudaLoadingScreen.style.display = 'none';
		}
	
		if (withAd && !loadingScreen.querySelector('.adsterra-container')) {
			const adContainer = document.createElement('div');
			adContainer.className = 'adsterra-container';
			adContainer.innerHTML = `<p>Sponsored Ad:</p>
				<script type="text/javascript">atOptions = { 'key' : '26bce7e7832b24b139944832990cf69d', 'format' : 'iframe', 'height' : 300, 'width' : 160, 'params' : {} };</script>
				<script type="text/javascript" src="//www.highperformanceformat.com/26bce7e7832b24b139944832990cf69d/invoke.js"></script>`;
			loadingScreen.appendChild(adContainer);
		}
	
		typeof NProgress !== 'undefined' && NProgress.start();
		loadingScreen.style.display = 'flex';
		setTimeout(() => {
			loadingScreen.style.transition = 'opacity 0.5s ease';
			loadingScreen.style.opacity = 1;
		}, 10);
	
		const loadingText = loadingScreen.querySelector(".loading-text");
		loadingText && (loadingText.innerHTML = "We're getting your content ready, please wait...");
	
		withToast && showToast('Consider joining our <a href="https://discord.gg/dJvdkPRheV" target="_blank" class="hover-link">Discord</a>&nbsp;<3');
	
		clearTimeout(loadingFallbackTimeout);
		loadingFallbackTimeout = setTimeout(hideLoadingScreen, 10000);
	}	
	
	function hideLoadingScreen() {
		const loadingScreen = document.querySelector(".loading-screen");
		if (!loadingScreen) return;
		loadingScreen.style.transition = 'opacity 0.5s ease';
		loadingScreen.style.opacity = 0;
		setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
		clearTimeout(loadingFallbackTimeout);
	}
	
	refreshIcon.addEventListener('click', () => {
		refreshIcon.classList.add('spin');
		if (iframe.tagName === 'IFRAME') {
			const currentUrl = iframe.contentWindow.location.href;
			if (normalizeUrl(currentUrl) !== normalizeUrl(historyStack[currentIndex] || '')) addToHistory(currentUrl);
			iframe.contentWindow.location.reload(true);
		}
		setTimeout(() => { refreshIcon.classList.remove('spin'); }, 300);
	});
	
	fullscreenIcon.addEventListener('click', () => {
		if (iframe.tagName === 'IFRAME') {
			if (iframe.requestFullscreen) iframe.requestFullscreen();
			else if (iframe.mozRequestFullScreen) iframe.mozRequestFullScreen();
			else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
			else if (iframe.msRequestFullscreen) iframe.msRequestFullscreen();
		}
	});
	
	backIcon.addEventListener('click', () => {
		if (currentIndex > 0) {
			currentIndex--;
			iframe.src = historyStack[currentIndex];
			showLoadingScreen(false, false);
			updateNavButtons();
			updateDecodedSearchInput();
		}
	});
	
	forwardIcon.addEventListener('click', () => {
		if (currentIndex < historyStack.length - 1) {
			currentIndex++;
			iframe.src = historyStack[currentIndex];
			showLoadingScreen(false, false);
			updateNavButtons();
			updateDecodedSearchInput();
		}
	});
	
	function normalizeUrl(urlStr) {
		try {
			const url = new URL(urlStr);
			url.searchParams.delete("ia");
			return url.toString();
		} catch (e) { return urlStr; }
	}
	
	function addToHistory(url) {
		const normalized = normalizeUrl(url);
		if (currentIndex >= 0 && normalizeUrl(historyStack[currentIndex]) === normalized) return;
		if (currentIndex < historyStack.length - 1) historyStack.splice(currentIndex + 1);
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
		let url = "";
		if (searchInput2) {
			if (currentIndex >= 0 && historyStack[currentIndex]) url = historyStack[currentIndex];
			else if (iframe.src) url = iframe.src;
			searchInput2.value = decodeUrl(url);
			const lockIcon = document.getElementById('lockIcon');
			if (lockIcon) {
				lockIcon.className = decodeUrl(url).startsWith("https://") ? "fa-solid fa-lock" : "fa-solid fa-lock-open";
				lockIcon.style.color = decodeUrl(url).startsWith("https://") ? "white" : "red";
			}
		}
	}
	
	function detectIframeNavigation() {
		try {
			const iframeWindow = iframe.contentWindow;
			const origPushState = iframeWindow.history.pushState;
			const origReplaceState = iframeWindow.history.replaceState;
			iframeWindow.history.pushState = function() { origPushState.apply(this, arguments); handleIframeNavigation(iframeWindow.location.href); };
			iframeWindow.history.replaceState = function() { origReplaceState.apply(this, arguments); handleIframeNavigation(iframeWindow.location.href); };
			iframeWindow.addEventListener('popstate', () => handleIframeNavigation(iframeWindow.location.href));
			iframeWindow.addEventListener('hashchange', () => handleIframeNavigation(iframeWindow.location.href));
		} catch (error) { }
	}
	
	function handleIframeNavigation(url) {
		if (url && normalizeUrl(url) !== normalizeUrl(historyStack[currentIndex] || '')) {
			showLoadingScreen(false, false);
			addToHistory(url);
		}
	}
	
	iframe.addEventListener('load', () => {
		try {
			detectIframeNavigation();
			if (!historyStack.length) updateNavButtons();
			else handleIframeNavigation(iframe.contentWindow.location.href);
			updateDecodedSearchInput();
		} catch (error) {
			console.error("Error during iframe load:", error);
		} finally {
			hideLoadingScreen();
			if (erudaLoadingScreen) erudaLoadingScreen.style.display = 'none';  
		}
	});	
	
	const searchContainer = document.querySelector(".searchContainer");
	const navBar = document.querySelector(".navbar");
	const topBar = document.querySelector(".topbar");
	const searchInput1 = document.getElementById("searchInput");
	const searchInput2 = document.getElementById("searchInputt");
	const movies = document.getElementById("movies");
	const ai = document.getElementById("ai");
	const navbarToggle = document.getElementById("navbar-toggle");
	
	if (navbarToggle && navBar) {
		const savedNavbarState = localStorage.getItem('navbarToggled');
		navbarToggle.checked = savedNavbarState === null ? true : savedNavbarState === 'true';
		navBar.style.display = (iframe.style.display === "block" && navbarToggle.checked) ? "block" : "none";
		navbarToggle.addEventListener("change", () => {
			localStorage.setItem('navbarToggled', navbarToggle.checked);
			navBar.style.display = (iframe.style.display === "block" && navbarToggle.checked) ? "block" : "none";
		});
	}
	
	iframe.style.display = "none";
	window.addEventListener('load', hideLoadingScreen);
	[searchInput1, searchInput2].forEach(input => {
		input && input.addEventListener("keyup", (e) => { if (e.key === "Enter") handleSearch(input.value); });
	});
	movies && movies.addEventListener("click", (e) => { e.preventDefault(); handleSearch("https://xojw.github.io/waves-movies/"); });
	ai && ai.addEventListener("click", (e) => { e.preventDefault(); handleSearch("https://ai.usewaves.site/"); });
	
	function clearBackground() {
		const preserved = [
			document.querySelector(".navbar"),
			document.getElementById("cool-iframe"),
			document.querySelector(".loading-screen"),
			erudaLoadingScreen
		];
		Array.from(document.body.children).forEach(child => { if (!preserved.includes(child)) child.remove(); });
	}
	
	async function handleSearch(query) {
		clearBackground();
		const searchURL = generateSearchUrl(query);
		searchInput2 && (searchInput2.value = searchURL);
		preloadResources(searchURL);
		showLoadingScreen(true, false, false);
		iframe.style.display = "block";
		topBar && (topBar.style.display = "none");
		backIcon.disabled = true;
		forwardIcon.disabled = true;
		try {
			iframe.src = await getUrl(searchURL);
		} catch (error) { }
		historyStack.length = 0;
		currentIndex = -1;
		iframe.onload = () => {
			hideLoadingScreen();
			if (navbarToggle && navbarToggle.checked && navBar) navBar.style.display = "block";
			generateSubject();
			updateDecodedSearchInput();
			try {
				if (iframe.contentDocument && !iframe.contentDocument.getElementById('uv-postmessage-hook')) {
					const script = iframe.contentDocument.createElement('script');
					script.id = 'uv-postmessage-hook';
					script.textContent = `(function(){const origPush=history.pushState;const origReplace=history.replaceState;function notify(){window.parent.postMessage({type:'uv-url-change',url:location.href},'*');}history.pushState=function(){origPush.apply(history,arguments);notify();};history.replaceState=function(){origReplace.apply(history,arguments);notify();};window.addEventListener('popstate',notify);window.addEventListener('hashchange',notify);notify();})();`;
					iframe.contentDocument.head.appendChild(script);
				}
			} catch (e) { /* Suppress error */ }
		};
		iframe.onerror = () => { hideLoadingScreen(); alert('Failed to load content.'); };
	}
	
	window.handleSearch = handleSearch;
	
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
		return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
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
		const icon = icons[iconType] || icons["heart"];
		toast.innerHTML = `${icon}${message} `;
		const progressBar = document.createElement("div");
		progressBar.className = "progress-bar";
		toast.appendChild(progressBar);
		const closeBtn = document.createElement("button");
		closeBtn.className = "toast-close";
		closeBtn.innerHTML = '<i class="fa-solid fa-xmark" style="margin-left: 8px; font-size: 0.8em;"></i>';
		closeBtn.addEventListener("click", () => { toast.classList.add("hide"); setTimeout(() => toast.remove(), 500); });
		toast.appendChild(closeBtn);
		document.body.appendChild(toast);
		setTimeout(() => { toast.classList.add("hide"); setTimeout(() => toast.remove(), 500); }, 3000);
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
	
	function generateSubject() {
		const subjects = ['math', 'science', 'history', 'art', 'programming', 'philosophy'];
		const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
		history.replaceState({}, '', '/learning?subject=' + randomSubject);
	}
	
	function decodeUrl(encodedUrl) {
		try {
			const urlObj = new URL(encodedUrl, window.location.origin);
			const proxyPrefix = (__uv$config && __uv$config.prefix) ? __uv$config.prefix : '/wa/a/';
			if (urlObj.pathname.startsWith(proxyPrefix)) {
				const encodedPart = urlObj.pathname.substring(proxyPrefix.length);
				return (__uv$config && typeof __uv$config.decodeUrl === 'function') ?
					__uv$config.decodeUrl(encodedPart) : decodeURIComponent(encodedPart);
			}
		} catch (e) { }
		return encodedUrl;
	}
	
	window.decodeUrl = decodeUrl;
	window.addEventListener('message', (event) => {
		if (event.data && event.data.type === 'uv-url-change' && event.data.url) {
			if (normalizeUrl(event.data.url) !== normalizeUrl(historyStack[currentIndex] || '')) addToHistory(event.data.url);
		}
	});
	
	window.addToHistory = addToHistory;
	window.updateDecodedSearchInput = updateDecodedSearchInput;
	window.normalizeUrl = normalizeUrl;
});
