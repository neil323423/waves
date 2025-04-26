const style = document.createElement('style');
style.textContent = `
@keyframes slideLeft {0% { transform: translateX(0); } 50% { transform: translateX(-5px); } 100% { transform: translateX(0); }}
@keyframes slideRight {0% { transform: translateX(0); } 50% { transform: translateX(5px); } 100% { transform: translateX(0); }}
.button-animate-back { animation: slideLeft 0.3s ease-in-out; }
.button-animate-forward { animation: slideRight 0.3s ease-in-out; }
`;
document.head.appendChild(style);

const historyStack = [];
let currentIndex = -1;
const elements = {
	refreshIcon: document.getElementById('refreshIcon'),
	fullscreenIcon: document.getElementById('fullscreenIcon'),
	backIcon: document.getElementById('backIcon'),
	forwardIcon: document.getElementById('forwardIcon'),
	searchInput2: document.getElementById('searchInputt'),
	iframe: document.getElementById('cool-iframe')
};
const originalTitle = document.title;
let loadingFallbackTimeout;

elements.refreshIcon.addEventListener('click', handleRefresh);
elements.fullscreenIcon.addEventListener('click', handleFullscreen);
elements.backIcon.addEventListener('click', handleBack);
elements.forwardIcon.addEventListener('click', handleForward);

function showLoadingScreen() {
	if (typeof NProgress !== 'undefined') {
		NProgress.start();
		document.title = 'Loading... <3';
		setTimeout(() => {
			if (typeof NProgress !== 'undefined') NProgress.done();
		}, 10000);
	}
}

function hideLoadingScreen() {
	if (typeof NProgress !== 'undefined') NProgress.done();
	document.title = originalTitle;
}

function handleRefresh() {
	elements.refreshIcon.classList.add('spin');
	const iframe = elements.iframe;
	const currentUrl = iframe.contentWindow.location.href;
	if (normalizeUrl(currentUrl) !== normalizeUrl(historyStack[currentIndex] || '')) {
		addToHistory(currentUrl);
	}
	iframe.contentWindow.location.reload(true);
	setTimeout(() => elements.refreshIcon.classList.remove('spin'), 300);
}

function handleFullscreen() {
	const iframe = elements.iframe;
	if (iframe && iframe.tagName === 'IFRAME') iframe.requestFullscreen();
}

function handleBack() {
	toggleButtonAnimation(elements.backIcon, 'button-animate-back');
	if (currentIndex > 0) {
		currentIndex--;
		updateIframeSrc();
	}
}

function handleForward() {
	toggleButtonAnimation(elements.forwardIcon, 'button-animate-forward');
	if (currentIndex < historyStack.length - 1) {
		currentIndex++;
		updateIframeSrc();
	}
}

function toggleButtonAnimation(button, animationClass) {
	button.classList.add(animationClass);
	setTimeout(() => button.classList.remove(animationClass), 200);
}

function normalizeUrl(urlStr) {
	try {
		const url = new URL(urlStr);
		url.searchParams.delete('ia');
		return url.toString();
	} catch (e) {
		return urlStr;
	}
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

function updateIframeSrc() {
	showLoadingScreen();
	elements.iframe.src = historyStack[currentIndex];
	updateNavButtons();
	updateDecodedSearchInput();
}

function updateNavButtons() {
	const isAtStart = currentIndex <= 0;
	const isAtEnd = currentIndex >= historyStack.length - 1;
	elements.backIcon.disabled = isAtStart;
	elements.forwardIcon.disabled = isAtEnd;
	elements.backIcon.classList.toggle('disabled', isAtStart);
	elements.forwardIcon.classList.toggle('disabled', isAtEnd);
}

function updateDecodedSearchInput() {
	if (elements.searchInput2) {
		const url = historyStack[currentIndex] || elements.iframe.src;
		elements.searchInput2.value = decodeUrl(url);
	}
}

function decodeUrl(url) {
	try {
		return decodeURIComponent(url);
	} catch (e) {
		return url;
	}
}

window.addToHistory = addToHistory;
window.updateDecodedSearchInput = updateDecodedSearchInput;
window.normalizeUrl = normalizeUrl;

function detectIframeNavigation() {
	try {
		const iframeWindow = elements.iframe.contentWindow;
		const pushState = iframeWindow.history.pushState;
		const replaceState = iframeWindow.history.replaceState;
		iframeWindow.history.pushState = function() {
			pushState.apply(this, arguments);
			handleIframeNavigation(iframeWindow.location.href);
		};
		iframeWindow.history.replaceState = function() {
			replaceState.apply(this, arguments);
			handleIframeNavigation(iframeWindow.location.href);
		};
		iframeWindow.addEventListener('popstate', () => handleIframeNavigation(iframeWindow.location.href));
		iframeWindow.addEventListener('hashchange', () => handleIframeNavigation(iframeWindow.location.href));
	} catch (error) {}
}

function handleIframeNavigation(rawUrl) {
	let urlStr = rawUrl;
	try {
		urlStr = decodeUrl(rawUrl);
	} catch {}
	try {
		const u = new URL(urlStr);
		if (u.hostname.endsWith('duckduckgo.com')) {
			if (typeof NProgress !== 'undefined') NProgress.done();
			return;
		}
	} catch (e) {}
	if (normalizeUrl(urlStr) !== normalizeUrl(historyStack[currentIndex] || '')) {
		showLoadingScreen();
		addToHistory(urlStr);
	} else {
		hideLoadingScreen();
	}
}

elements.iframe.addEventListener('load', () => {
	try {
		detectIframeNavigation();
		if (historyStack.length === 0) {
			addToHistory(elements.iframe.contentWindow.location.href);
		} else {
			handleIframeNavigation(elements.iframe.contentWindow.location.href);
		}
	} catch (error) {}
	hideLoadingScreen();
});