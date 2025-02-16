document.addEventListener('DOMContentLoaded', function () {
  const settingsMenu = document.getElementById('settings-menu');
  settingsMenu.innerHTML = `
  <h2>Settings</h2>
  <div class="settings-tabs">
    <button class="tab-button active" id="proxy-tab"><i class="fas fa-network-wired"></i> Proxy</button>
    <button class="tab-button" id="cloak-tab"><i class="fas fa-user-secret"></i> Cloak</button>
    <button class="tab-button" id="appearance-tab"><i class="fas fa-palette"></i> Appearance</button>
    <button class="tab-button" id="info-tab"><i class="fas fa-info"></i> Info</button>
  </div>
  <div id="proxy-content" class="tab-content">
    <label for="transport-selector">Transport</label>
    <p>Transport is how the proxy will send information.</p>
    <div class="transport-selector">
      <div class="transport-selected">Epoxy</div>
      <div class="transport-options">
        <div>Epoxy</div>
        <div>Libcurl</div>
      </div>
    </div>
    <label for="wisp-server">Wisp Server</label>
    <p>Enter a different Wisp Server to connect to.</p>
    <p>The server URL must begin with <code>ws(s)://</code> and end with a <code>/</code>.</p>
    <input type="text" id="wisp-server" placeholder="Wisp Server URL Here..." autocomplete="off">
    <button id="save-wisp-url">Save</button>
  </div>
  <div id="cloak-content" class="tab-content">
    <label for="aboutblank-toggle">About:Blank</label>
    <p>Turn this on to go into about:blank every time the page loads (Recommended).</p>
    <input type="checkbox" id="aboutblank-toggle">
  </div>
  <div id="appearance-content" class="tab-content">
    <label for="navbar-toggle">Navigation Bar</label>
    <p>Keep this on for the navigation bar when searching (Recommended).</p>
    <input type="checkbox" id="navbar-toggle">
    <label for="themes-selector">Themes</label>
    <p>Choose your preferred theme.</p>
    <div class="themes-selector">
      <div class="themes-selected">Default</div>
      <div class="themes-options">
        <div>Default</div>
        <div>Sakura</div>
        <div>Emerald</div>
      </div>
    </div>
  </div>
  <div id="info-content" class="tab-content">
    <label>Version 1.4.0</label>
    <label onmouseover="this.querySelector('span').style.color='lime'" onmouseout="this.querySelector('span').style.color='green'">
      Server Status: <span style="color: green; transition: color 0.3s ease;">Running</span>
    </label>
    <p>If you want to see Waves up time please visit <a href="https://uptime.macha.icu" target="_blank" class="hover-link">https://uptime.macha.icu</a>.</p>
    <div style="display: flex; gap: 10px; justify-content: left; align-items: left; margin-top: 10px; margin-bottom: -20px;">
      <label><a href="https://discord.gg/656PtwMx3H" target="_blank" class="hover-link"><i class="fab fa-discord" style="font-size: 20px;"></i></a></label>
      <label><a href="https://github.com/xojw/waves" target="_blank" class="hover-link"><i class="fab fa-github" style="font-size: 20px;"></i></a></label>
    </div>
  </div>
  <button id="close-settings"><i class="fas fa-times"></i></button>
  `;
  const settingsIcon = document.getElementById('settings-icon');
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
  themesSelected.textContent = selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1);
  function updateTheme(newTheme, glowStyle) {
    document.body.classList.remove('default', 'sakura', 'emerald');
    document.body.classList.add(newTheme);
    updateGlowPointStyle(glowStyle);
    updateHighlightStyle(newTheme);
    let lightColor, gradientColor;
    switch (newTheme) {
      case 'sakura':
        lightColor = '0 0 250px 100px #ff66cc';
        gradientColor = 'radial-gradient(farthest-corner at 50% 50%, #ff66cc)';
        break;
      case 'emerald':
        lightColor = '0 0 250px 100px #50C878';
        gradientColor = 'radial-gradient(farthest-corner at 50% 50%, #50C878)';
        break;
      default:
        lightColor = '0 0 250px 100px #443ab6';
        gradientColor = 'radial-gradient(farthest-corner at 50% 50%, #443ab6)';
        break;
    }
    updateLightStyle(lightColor, gradientColor);
    updateSettingsMenuH2Style(newTheme);
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
      let gradientStyle;
      switch (newTheme) {
        case 'sakura':
          gradientStyle = 'linear-gradient(to right, #5f274c, rgb(202, 74, 160), #5f274c)';
          break;
        case 'emerald':
          gradientStyle = 'linear-gradient(to right, #1A5F1A, #50C878, #1A5F1A)';
          break;
        default:
          gradientStyle = 'linear-gradient(to right, #221d5e, #443ab6, #221d5e)';
          break;
      }
      highlightElement.style.background = gradientStyle;
      highlightElement.style.webkitBackgroundClip = 'text';
      highlightElement.style.webkitTextFillColor = 'transparent';
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
    switch (theme) {
      case 'sakura':
        settingsTitle.style.color = '#ff66cc';
        break;
      case 'emerald':
        settingsTitle.style.color = '#50C878';
        break;
      default:
        settingsTitle.style.color = '#443ab6';
        break;
    }
    localStorage.setItem('settingsMenuH2Color', settingsTitle.style.color);
  }
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
      switch (selectedTheme) {
        case 'sakura':
          glowStyle = '0rem 0rem 1.2rem 0.6rem #ff66cc';
          break;
        case 'emerald':
          glowStyle = '0rem 0rem 1.2rem 0.6rem #50C878';
          break;
        default:
          glowStyle = '0rem 0rem 1.2rem 0.6rem #443ab6';
          break;
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
  function switchTab(tabId, contentId, otherTabId1, otherContentId1, otherTabId2, otherContentId2, otherTabId3, otherContentId3) {
    document.getElementById(otherContentId1).classList.remove('active');
    document.getElementById(otherContentId2).classList.remove('active');
    document.getElementById(otherContentId3).classList.remove('active');
    document.getElementById(otherTabId1).classList.remove('active');
    document.getElementById(otherTabId2).classList.remove('active');
    document.getElementById(otherTabId3).classList.remove('active');
    document.getElementById(contentId).classList.add('active');
    document.getElementById(tabId).classList.add('active');
  }
  document.getElementById('proxy-tab').addEventListener('click', function() {
    switchTab('proxy-tab', 'proxy-content', 'appearance-tab', 'appearance-content', 'cloak-tab', 'cloak-content', 'info-tab', 'info-content');
  });
  document.getElementById('cloak-tab').addEventListener('click', function() {
    switchTab('cloak-tab', 'cloak-content', 'proxy-tab', 'proxy-content', 'appearance-tab', 'appearance-content', 'info-tab', 'info-content');
  });
  document.getElementById('appearance-tab').addEventListener('click', function() {
    switchTab('appearance-tab', 'appearance-content', 'proxy-tab', 'proxy-content', 'cloak-tab', 'cloak-content', 'info-tab', 'info-content');
  });
  document.getElementById('info-tab').addEventListener('click', function() {
    switchTab('info-tab', 'info-content', 'proxy-tab', 'proxy-content', 'appearance-tab', 'appearance-content', 'cloak-tab', 'cloak-content');
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
  function runScriptIfChecked() {
    let inFrame;
    try {
      inFrame = window !== top;
    } catch (e) {
      inFrame = true;
    }
    const aboutBlankChecked = JSON.parse(localStorage.getItem("aboutBlankChecked")) || false;
    if (!aboutBlankChecked || inFrame) {
      return;
    }
    const defaultTitle = "🌊 Google";
    const defaultIcon = "https://www.google.com/favicon.ico";
    const title = localStorage.getItem("siteTitle") || defaultTitle;
    const icon = localStorage.getItem("faviconURL") || defaultIcon;
    const iframeSrc = "/";
    const popup = window.open("", "_blank");
    if (!popup || popup.closed) {
      alert("Failed to load automask. Please allow popups and try again.");
      return;
    }
    popup.document.head.innerHTML = `
        <title>${title}</title>
        <link rel="icon" href="${icon}">
    `;
    popup.document.body.innerHTML = `
        <iframe style="height: 100%; width: 100%; border: none; position: fixed; top: 0; right: 0; left: 0; bottom: 0;" src="${iframeSrc}"></iframe>
    `;
    window.location.replace("https://bisd.schoology.com/home");
  }
  document.getElementById("aboutblank-toggle").addEventListener("change", function () {
    localStorage.setItem("aboutBlankChecked", JSON.stringify(this.checked));
    if (this.checked) {
      showToast('success', 'About:Blank is now enabled.');
    } else {
      showToast('error', 'About:Blank is now disabled.');
    }
    runScriptIfChecked();
  });
  window.addEventListener("load", function() {
    const aboutBlankChecked = JSON.parse(localStorage.getItem("aboutBlankChecked")) || false;
    document.getElementById("aboutblank-toggle").checked = aboutBlankChecked;
    runScriptIfChecked();
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