document.addEventListener('DOMContentLoaded', function () {
  const settingsIcon = document.getElementById('settings-icon');
  const settingsMenu = document.getElementById('settings-menu');
  const closeSettingsButton = document.getElementById('close-settings');
  const saveButton = document.getElementById('save-wisp-url');
  const transportSelector = document.querySelector('.transport-selector');
  const transportSelected = transportSelector.querySelector('.transport-selected');
  const transportOptions = transportSelector.querySelector('.transport-options');
  
  const defaultWispUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/w/`;
  let currentWispUrl = localStorage.getItem('customWispUrl') || defaultWispUrl;
  
  const wispInput = document.querySelector("#wisp-server");
  wispInput.value = localStorage.getItem('customWispUrl') || defaultWispUrl;

  function isValidUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return (parsedUrl.protocol === "wss:" || parsedUrl.protocol === "ws:") && url.endsWith('/');
    } catch (_) {
      return false;
    }
  }

  function updateWispServerUrl(url) {
    if (isValidUrl(url)) {
      currentWispUrl = url;
      localStorage.setItem('customWispUrl', url);
      console.log(`%c[✔]%c WISP URL updated to: ${currentWispUrl}`, "color: green; font-weight: bold;", "color: inherit;");
      document.dispatchEvent(new CustomEvent('wispUrlChanged', { detail: currentWispUrl }));
      wispInput.value = currentWispUrl;

      showToast('success', `WISP URL successfully updated to: ${currentWispUrl}`);
    } else {
      console.log("%c[❌]%c Invalid WISP URL. Please enter a valid one.", "color: red; font-weight: bold;", "color: inherit;");
      
      wispInput.value = wispInput.value || defaultWispUrl;
      currentWispUrl = wispInput.value; 

      showToast('error', "Invalid URL. Reverting to default...");
    }
  }

  function showErrorMessage(message) {
    const errorMsg = document.createElement('p');
    errorMsg.className = 'error-message';
    errorMsg.textContent = message;
    wispInput.parentElement.appendChild(errorMsg);
    setTimeout(() => {
      errorMsg.remove();
    }, 3000); 
  }

  function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type} show`; 
    toast.textContent = message;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => {
        toast.remove();
      }, 500);
    });

    toast.appendChild(closeBtn);

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('show'); 
      toast.classList.add('hide');
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 3000);
  }

  saveButton.addEventListener('click', () => {
    const customUrl = wispInput.value.trim();
    updateWispServerUrl(customUrl); 
  });

  transportSelector.addEventListener("click", (event) => {
    const transportOption = event.target.textContent.toLowerCase();
    if (transportOption === "epoxy" || transportOption === "libcurl") {
      showToast('success', `Transport option set to ${transportOption}`);
    } else {
      showToast('error', 'Unknown transport option selected');
    }
  });

  settingsIcon.addEventListener('click', (event) => {
    event.preventDefault();
    toggleSettingsMenu();
  });

  closeSettingsButton.addEventListener('click', () => {
    toggleSettingsMenu();
  });

  function toggleSettingsMenu() {
    if (settingsMenu.classList.contains('open')) {
      settingsMenu.classList.add('close');
      setTimeout(() => {
        settingsMenu.classList.remove('open', 'close');
      }, 300);
    } else {
      settingsMenu.classList.add('open');
      setTimeout(() => {
        settingsMenu.classList.remove('close');
      }, 300);
    }
  }

  transportSelected.addEventListener('click', function(e) {
    e.stopPropagation();
    transportOptions.classList.toggle('transport-show');
    this.classList.toggle('transport-arrow-active');
  });

  const optionDivs = transportOptions.getElementsByTagName('div');
  for (let i = 0; i < optionDivs.length; i++) {
    optionDivs[i].addEventListener('click', function(e) {
      e.stopPropagation();
      const selectedValue = this.innerHTML;
      transportSelected.innerHTML = selectedValue;
      localStorage.setItem('transport', selectedValue.toLowerCase());
      transportOptions.classList.remove('transport-show');
      transportSelected.classList.remove('transport-arrow-active');
      
      const event = new Event('newTransport', { detail: selectedValue.toLowerCase() });
      document.dispatchEvent(event);

      showToast('success', `Transport option changed to ${selectedValue}`);
    });
  }

  document.addEventListener('click', function(e) {
    if (!transportSelector.contains(e.target)) {
      transportOptions.classList.remove('transport-show');
      transportSelected.classList.remove('transport-arrow-active');
    }
  });
});
