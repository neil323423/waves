document.addEventListener('DOMContentLoaded', function () {
  const settingsMenu = document.getElementById('settings-menu');
  settingsMenu.innerHTML = `
    <h2>Settings</h2>
    <div class="settings-tabs">
      <button class="tab-button active" id="proxy-tab">
        <i class="fa-regular fa-server"></i> Proxy
      </button>
      <button class="tab-button" id="cloak-tab">
        <i class="fa-regular fa-user-secret"></i> Cloak
      </button>
      <button class="tab-button" id="appearance-tab">
        <i class="fa-regular fa-palette"></i> Appearance
      </button>
      <button class="tab-button" id="info-tab">
        <i class="fa-regular fa-info"></i> Info
      </button>
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
      <p>Recommended to keep this as default.</p>
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
    </div>

    <div id="info-content" class="tab-content">
      <label>Version 2.8.7</label>
      <label 
        onmouseover="this.querySelector('span').style.color='lime'" 
        onmouseout="this.querySelector('span').style.color='green'">
        Server Status: 
        <span style="color: green; transition: color 0.3s ease; font-size: 0.95em;">Running</span>
      </label>
      <label 
        onmouseover="this.querySelector('span').style.color='lime'" 
        onmouseout="this.querySelector('span').style.color='green'">
        Server Speed: 
        <span id="server-speed" style="color: green; transition: color 0.3s ease; font-size: 0.95em;">Checking...</span>
      </label>
      <label 
        onmouseover="this.querySelector('span').style.color='#dadada'" 
        onmouseout="this.querySelector('span').style.color='#949494'">
        Server Uptime: 
        <span id="server-uptime" style="color: #949494; transition: color 0.3s ease; font-size: 0.95em;">Calculating...</span>
      </label>
      <label 
        onmouseover="this.querySelector('span').style.color='#dadada'" 
        onmouseout="this.querySelector('span').style.color='#949494'">
        Server Specs: 
        <span id="server-specs" style="color: #949494; transition: color 0.3s ease; font-size: 0.95em;">Loading...</span>
      </label>
      <p>Having any problems? Join our Discord Server below or open an issue on GitHub for support.</p>
      <div style="display: flex; gap: 10px; justify-content: left; align-items: left; margin-top: 10px; margin-bottom: -20px;">
        <label>
          <a href="https://discord.gg/dJvdkPRheV" target="_blank" class="hover-link">
            <i class="fab fa-discord" style="font-size: 20px;"></i>
          </a>
        </label>
        <label>
          <a href="https://github.com/xojw/waves" target="_blank" class="hover-link">
            <i class="fab fa-github" style="font-size: 20px;"></i>
          </a>
        </label>
      </div>
    </div>

    <button id="close-settings">
      <i class="fa-regular fa-times"></i>
    </button>
  `;

  const settingsIcon = document.getElementById('settings-icon');
  const closeSettingsBtn = document.getElementById('close-settings');
  const saveWispBtn = document.getElementById('save-wisp-url');
  const transportSelector = document.querySelector('.transport-selector');
  const transportSelected = transportSelector.querySelector('.transport-selected');
  const transportOptions = transportSelector.querySelector('.transport-options');
  const navbarToggle = document.getElementById('navbar-toggle');
  const defaultWispUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/w/`;
  let currentWispUrl = localStorage.getItem('customWispUrl') || defaultWispUrl;
  const wispInput = document.querySelector("#wisp-server");
  wispInput.value = currentWispUrl;
  let isToggling = false;

  function isValidUrl(url) {
    try {
      const p = new URL(url);
      return (p.protocol === "wss:" || p.protocol === "ws:") && url.endsWith('/');
    } catch (_) {
      return false;
    }
  }

  function updateWispServerUrl(url) {
    if (isValidUrl(url)) {
      currentWispUrl = url;
      localStorage.setItem('customWispUrl', url);
      document.dispatchEvent(new CustomEvent('wispUrlChanged', { detail: currentWispUrl }));
      showToast('success', `Wisp Server URL changed to: ${currentWispUrl}`);
    } else {
      currentWispUrl = defaultWispUrl;
      localStorage.setItem('customWispUrl', defaultWispUrl);
      document.dispatchEvent(new CustomEvent('wispUrlChanged', { detail: currentWispUrl }));
      showToast('error', "Invalid URL. Reverting to default...");
    }
  }

  function updateServerInfo() {
    const speedSpan = document.getElementById('server-speed');
    const uptimeSpan = document.getElementById('server-uptime');
    const specsSpan = document.getElementById('server-specs');
    let uptimeInterval;

    fetch('/api/info')
      .then(response => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(data => {
        if (data?.speed) {
          const updateUptimeDisplay = () => {
            const uptime = Date.now() - data.startTime;
            const days = Math.floor(uptime / 86400000);
            const hours = Math.floor((uptime % 86400000) / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const seconds = Math.floor((uptime % 60000) / 1000);
            uptimeSpan.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
          };

          updateUptimeDisplay();
          clearInterval(uptimeInterval);
          uptimeInterval = setInterval(updateUptimeDisplay, 1000);

          speedSpan.textContent = `${data.speed} (${data.averageLatency}ms)`;
          specsSpan.textContent = data.specs;
        }
        setTimeout(updateServerInfo, 10000);
      })
      .catch(() => {
        speedSpan.textContent = 'Connection error';
        setTimeout(updateServerInfo, 30000);
      });
  }

  function initializeInfo() {
    const infoTab = document.getElementById('info-tab');
    const infoContent = document.getElementById('info-content');

    const startMonitoring = () => {
      updateServerInfo();
      infoTab.removeEventListener('click', startMonitoring);
    };

    if (infoContent.classList.contains('active')) {
      updateServerInfo();
    } else {
      infoTab.addEventListener('click', startMonitoring, { once: true });
    }
  }

  function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type} show`;
    const icons = {
      success: '<i class="fa-regular fa-check-circle"></i>',
      error: '<i class="fa-regular fa-times-circle"></i>',
      info: '<i class="fa-regular fa-info-circle"></i>',
      warning: '<i class="fa-regular fa-exclamation-triangle"></i>'
    };
    toast.innerHTML = `${icons[type]||''}${message}`;
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    toast.appendChild(progressBar);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '<i class="fa-regular fa-xmark"></i>';
    closeBtn.addEventListener('click', () => {
      toast.classList.replace('show', 'hide');
      setTimeout(() => toast.remove(), 500);
    });
    toast.appendChild(closeBtn);
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.replace('show', 'hide');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  saveWispBtn.addEventListener('click', () => updateWispServerUrl(wispInput.value.trim()));
  settingsIcon.addEventListener('click', e => {
    e.preventDefault();
    toggleSettingsMenu();
  });
  closeSettingsBtn.addEventListener('click', toggleSettingsMenu);

  function toggleSettingsMenu() {
    if (isToggling) return;
    isToggling = true;
    const icon = document.querySelector('#settings-icon i.settings-icon');
    if (settingsMenu.classList.contains('open')) {
      settingsMenu.classList.add('close');
      icon.classList.replace('fa-solid', 'fa-regular');
      setTimeout(() => {
        settingsMenu.classList.remove('open', 'close');
        isToggling = false;
      }, 300);
    } else {
      settingsMenu.classList.add('open');
      icon.classList.replace('fa-regular', 'fa-solid');
      setTimeout(() => {
        settingsMenu.classList.remove('close');
        isToggling = false;
      }, 300);
    }
  }

  transportSelected.addEventListener('click', e => {
    e.stopPropagation();
    transportOptions.classList.toggle('transport-show');
    transportSelected.classList.toggle('transport-arrow-active');
  });

  Array.from(transportOptions.getElementsByTagName('div')).forEach(option => {
    option.addEventListener('click', function (e) {
      e.stopPropagation();
      const val = this.textContent;
      transportSelected.textContent = val;
      localStorage.setItem('transport', val.toLowerCase());
      transportOptions.classList.remove('transport-show');
      transportSelected.classList.remove('transport-arrow-active');
      document.dispatchEvent(new CustomEvent('newTransport', { detail: val.toLowerCase() }));
      showToast('success', `Transport changed to ${val}`);
    });
  });

  document.getElementById('proxy-content').classList.add('active');

  function switchTab(activeTab, activeContent, ...others) {
    others.forEach(id => document.getElementById(id).classList.remove('active'));
    document.getElementById(activeTab).classList.add('active');
    document.getElementById(activeContent).classList.add('active');
  }

  document.getElementById('proxy-tab').addEventListener('click', () => switchTab('proxy-tab', 'proxy-content', 'cloak-tab', 'cloak-content', 'appearance-tab', 'appearance-content', 'info-tab', 'info-content'));
  document.getElementById('cloak-tab').addEventListener('click', () => switchTab('cloak-tab', 'cloak-content', 'proxy-tab', 'proxy-content', 'appearance-tab', 'appearance-content', 'info-tab', 'info-content'));
  document.getElementById('appearance-tab').addEventListener('click', () => switchTab('appearance-tab', 'appearance-content', 'proxy-tab', 'proxy-content', 'cloak-tab', 'cloak-content', 'info-tab', 'info-content'));
  document.getElementById('info-tab').addEventListener('click', () => switchTab('info-tab', 'info-content', 'proxy-tab', 'proxy-content', 'cloak-tab', 'cloak-content', 'appearance-tab', 'appearance-content'));

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', function () {
      const icon = this.querySelector('i');
      if (!icon.classList.contains('fa-bounce')) {
        icon.classList.add('fa-bounce');
        setTimeout(() => icon.classList.remove('fa-bounce'), 750);
      }
    });
  });

  navbarToggle.addEventListener('change', function () {
    showToast(this.checked ? 'success' : 'error', `Navigation Bar ${this.checked ? 'enabled' : 'disabled'}`);
  });

  initializeInfo();
});