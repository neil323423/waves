const erudaIcon = document.getElementById('erudaIcon');
const iframe = document.querySelector('.iframe');
const erudaLoadingScreen = document.getElementById('erudaLoadingScreen');

let erudaLoaded = false;
let loadingTimeout;
let errorMessageDisplayed = false;

erudaIcon.addEventListener('click', () => {
  if (!iframe || !iframe.contentDocument || !iframe.contentWindow) {
    console.error('Iframe is not available.');
    return;
  }

  erudaLoadingScreen.textContent = 'Eruda is loading...';
  erudaLoadingScreen.style.display = 'block';
  clearTimeout(loadingTimeout);

  loadingTimeout = setTimeout(() => {
    if (!errorMessageDisplayed) {
      erudaLoadingScreen.textContent = 'Error: Eruda is taking too long to load.';
      errorMessageDisplayed = true;
    }
    erudaLoadingScreen.style.display = 'none';
  }, 10000);

  if (erudaLoaded && iframe.contentWindow.eruda) {
    iframe.contentWindow.eruda.destroy();
    erudaLoaded = false;
    clearTimeout(loadingTimeout);
    erudaLoadingScreen.style.display = 'none';
  } else if (!erudaLoaded) {
    const script = iframe.contentDocument.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    script.async = true;

    script.onload = () => {
      clearTimeout(loadingTimeout);
      if (iframe.contentWindow.eruda) {
        iframe.contentWindow.eruda.init();
        iframe.contentWindow.eruda.show();
        erudaLoaded = true;
      }
      erudaLoadingScreen.style.display = 'none';
    };

    script.onerror = () => {
      clearTimeout(loadingTimeout);
      if (!errorMessageDisplayed) {
        erudaLoadingScreen.textContent = 'Error loading Eruda. Please try again later.';
        errorMessageDisplayed = true;
      }
      erudaLoadingScreen.style.display = 'none';
    };

    iframe.contentDocument.head.appendChild(script);
  }
});
