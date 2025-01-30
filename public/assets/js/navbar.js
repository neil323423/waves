const historyStack = [];
let currentIndex = -1;

document.getElementById('refreshIcon').addEventListener('click', function () {
    const refreshIcon = document.getElementById('refreshIcon');
    refreshIcon.classList.add('spin');

    const iframe = document.getElementById('proxy-iframe');
    if (iframe && iframe.tagName === 'IFRAME') {
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
        historyStack.splice(currentIndex + 1);
    }
    historyStack.push(url);
    currentIndex++;
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
    if (url && url !== historyStack[currentIndex]) {
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
