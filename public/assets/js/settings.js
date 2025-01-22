document.addEventListener('DOMContentLoaded', function () {
  const settingsIcon = document.getElementById('settings-icon');
  const settingsMenu = document.getElementById('settings-menu');
  const closeSettingsButton = document.getElementById('close-settings');
  const saveButton = document.getElementById('save-wisp-url');
  const transportSelector = document.querySelector('.transport-selector');
  const transportSelected = transportSelector.querySelector('.transport-selected');
  const transportOptions = transportSelector.querySelector('.transport-options');
  const themesSelector = document.querySelector('.themes-selector');
  const themesSelected = themesSelector.querySelector('.themes-selected');
  const themesOptions = themesSelector.querySelector('.themes-options');
  const navbarToggle = document.getElementById('navbar-toggle');

  const selectedTheme = localStorage.getItem('selectedTheme') || 'default';
  const savedGlowStyle = localStorage.getItem('glowPointStyle') || '0rem 0rem 1.2rem 0.6rem #443ab6';
  const savedLightBoxShadow = localStorage.getItem('lightBoxShadow') || '0 0 250px 100px #443ab6';
  const savedLightBackgroundImage = localStorage.getItem('lightBackgroundImage') || 'radial-gradient(farthest-corner at 50% 50%, #443ab6)';

  document.body.classList.add(selectedTheme);
  updateGlowPointStyle(savedGlowStyle);
  updateHighlightStyle(selectedTheme);
  updateLightStyle(savedLightBoxShadow, savedLightBackgroundImage);

  const savedH2Color = localStorage.getItem('settingsMenuH2Color') || '#443ab6';
  const settingsTitle = document.querySelector('#settings-menu h2');
  settingsTitle.style.color = savedH2Color;

  const savedBarColor = localStorage.getItem('barColor') || '#443ab6';
  const bar = document.querySelector('.bar');
  bar.style.backgroundColor = savedBarColor;

  themesSelected.textContent = selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1);

  function updateTheme(newTheme, glowStyle) {
    document.body.classList.remove('default', 'sakura');
    document.body.classList.add(newTheme);
    updateGlowPointStyle(glowStyle);
    updateHighlightStyle(newTheme);
    updateLightStyle(newTheme === 'sakura' ? '0 0 250px 100px #ff66cc' : '0 0 250px 100px #443ab6', newTheme === 'sakura' ? 'radial-gradient(farthest-corner at 50% 50%, #ff66cc)' : 'radial-gradient(farthest-corner at 50% 50%, #443ab6)');
    updateSettingsMenuH2Style(newTheme);
    updateBarColor(newTheme);
    localStorage.setItem('selectedTheme', newTheme);
    localStorage.setItem('glowPointStyle', glowStyle);
    themesSelected.textContent = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
    themesOptions.classList.remove('transport-show');
    themesSelected.classList.remove('transport-arrow-active');
    showToast('success', `Theme changed to ${newTheme}`);
  }

  function updateLightStyle(boxShadow, backgroundImage) {
    const lightElement = document.querySelector('.light');
    if (lightElement) {
        lightElement.style.boxShadow = boxShadow;
        lightElement.style.backgroundImage = backgroundImage;

        localStorage.setItem('lightBoxShadow', boxShadow);
        localStorage.setItem('lightBackgroundImage', backgroundImage);
    }
  }

  function updateHighlightStyle(newTheme) {
    const highlightElement = document.querySelector('.highlight');
    if (highlightElement) {
      if (newTheme === 'sakura') {
        highlightElement.style.background = 'linear-gradient(to right, #5f274c,rgb(202, 74, 160), #5f274c)';
        highlightElement.style.webkitBackgroundClip = 'text';
        highlightElement.style.webkitTextFillColor = 'transparent';
      } else {
        highlightElement.style.background = 'linear-gradient(to right, #221d5e, #443ab6, #221d5e)';
        highlightElement.style.webkitBackgroundClip = 'text';
        highlightElement.style.webkitTextFillColor = 'transparent';
      }
    }
  }

  function updateGlowPointStyle(style) {
    const glowPoints = document.querySelectorAll('.glow-point');
    glowPoints.forEach(point => {
      point.style.boxShadow = style;
    });
  }

  function updateSettingsMenuH2Style(theme) {
    const settingsTitle = document.querySelector('#settings-menu h2');
    
    if (theme === 'sakura') {
      settingsTitle.style.color = '#ff66cc'; 
    } else {
      settingsTitle.style.color = '#443ab6'; 
    }
  
    localStorage.setItem('settingsMenuH2Color', settingsTitle.style.color);
  }

  function updateBarColor(theme) {
    const bars = document.querySelectorAll('.bar');
    const barColor = theme === 'sakura' ? '#ff66cc' : '#443ab6';
  
    bars.forEach(bar => {
      bar.style.backgroundColor = barColor;
    });
  
    localStorage.setItem('barColor', barColor);
  }
  
  function applySavedTheme() {
    const savedColor = localStorage.getItem('barColor');
  
    if (savedColor) {
      const bars = document.querySelectorAll('.bar');
      bars.forEach(bar => {
        bar.style.backgroundColor = savedColor;
      });
    }
  }
  
  window.onload = function() {
    applySavedTheme();
  };
  
    themesSelector.addEventListener('click', function(e) {
      e.stopPropagation();
      themesOptions.classList.toggle('transport-show');
      themesSelected.classList.toggle('transport-arrow-active');
    });
  
    const themeOptionsDivs = themesOptions.getElementsByTagName('div');
    for (let i = 0; i < themeOptionsDivs.length; i++) {
      themeOptionsDivs[i].addEventListener('click', function(e) {
        e.stopPropagation();
        const selectedTheme = this.innerHTML.toLowerCase();
        let glowStyle = '0rem 0rem 1.2rem 0.6rem #443ab6';
        if (selectedTheme === 'sakura') {
          glowStyle = '0rem 0rem 1.2rem 0.6rem #ff66cc';
        }
        updateTheme(selectedTheme, glowStyle);
      });
    }

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
      document.dispatchEvent(new CustomEvent('wispUrlChanged', { detail: currentWispUrl }));
      wispInput.value = currentWispUrl;
      showToast('success', `WISP URL successfully updated to: ${currentWispUrl}`);
      location.reload();
    } else {
      console.log("%c[❌]%c Invalid WISP URL. Please enter a valid one.", "color: red; font-weight: bold;", "color: inherit;");
      currentWispUrl = defaultWispUrl;
      localStorage.setItem('customWispUrl', defaultWispUrl);
      wispInput.value = defaultWispUrl;
      showToast('error', "Invalid URL. Reverting back to default...");
      location.reload();
    }
  }

  saveButton.addEventListener('click', () => {
    const customUrl = wispInput.value.trim();
    updateWispServerUrl(customUrl);
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

      showToast('success', `Transport successfully changed to ${selectedValue}`);
      location.reload();
    });
  }

  document.getElementById('proxy-content').classList.add('active');

  function switchTab(tabId, contentId, otherTabId, otherContentId) {
    document.getElementById(otherContentId).classList.remove('active');
    document.getElementById(contentId).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    document.getElementById(otherTabId).classList.remove('active');
  }

  document.getElementById('proxy-tab').addEventListener('click', function() {
    switchTab('proxy-tab', 'proxy-content', 'appearance-tab', 'appearance-content');
  });

  document.getElementById('appearance-tab').addEventListener('click', function() {
    switchTab('appearance-tab', 'appearance-content', 'proxy-tab', 'proxy-content');
  });

  navbarToggle.addEventListener('change', function() {
    if (this.checked) {
      showToast('success', 'Navigation Bar is now enabled.');
    } else {
      showToast('error', 'Navigation Bar is now disabled.');
    }
  });

  navbarToggle.addEventListener('change', function() {
    if (this.checked) {
      showToast('success', 'Navigation Bar is now enabled.');
    } else {
      showToast('error', 'Navigation Bar is now disabled.');
    }
  });

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

});
