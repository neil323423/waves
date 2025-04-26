document.addEventListener('DOMContentLoaded', function() {
	const settingsMenu = document.getElementById('settings-menu');
	settingsMenu.innerHTML = `
  <h2>Settings</h2>
  <div class="settings-tabs">
    <button class="tab-button active" id="proxy-tab"><i class="fa-regular fa-server"></i> Proxy</button>
    <button class="tab-button" id="cloak-tab"><i class="fa-regular fa-user-secret"></i> Cloak</button>
    <button class="tab-button" id="appearance-tab"><i class="fa-regular fa-palette"></i> Appearance</button>
    <button class="tab-button" id="info-tab"><i class="fa-regular fa-info"></i> Info</button>
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
    <label>Version 2.3.5</label>
    <label onmouseover="this.querySelector('span').style.color='lime'" onmouseout="this.querySelector('span').style.color='green'">
      Server Status: <span style="color: green; transition: color 0.3s ease;">Running</span>
    </label>
    <p>If you want to see Waves status please visit <a href="https://status.usewaves.site" target="_blank" class="hover-link">https://status.usewaves.site</a>.</p>
    <div style="display: flex; gap: 10px; justify-content: left; align-items: left; margin-top: 10px; margin-bottom: -20px;">
      <label><a href="https://discord.gg/wves" target="_blank" class="hover-link"><i class="fab fa-discord" style="font-size: 20px;"></i></a></label>
      <label><a href="https://github.com/xojw/waves" target="_blank" class="hover-link"><i class="fab fa-github" style="font-size: 20px;"></i></a></label>
    </div>
  </div>
  <button id="close-settings"><i class="fa-regular fa-times"></i></button>
  `;
	const settingsIcon = document.getElementById('settings-icon');
	const closeSettingsButton = document.getElementById('close-settings');
	const saveButton = document.getElementById('save-wisp-url');
	const transportSelector = document.querySelector('.transport-selector');
	const transportSelected = transportSelector.querySelector('.transport-selected');
	const transportOptions = transportSelector.querySelector('.transport-options');
	const navbarToggle = document.getElementById('navbar-toggle');
	const defaultWispUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/w/`;
	let currentWispUrl = localStorage.getItem('customWispUrl') || defaultWispUrl;
	const wispInput = document.querySelector("#wisp-server");
	wispInput.value = currentWispUrl;

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
			document.dispatchEvent(new CustomEvent('wispUrlChanged', {
				detail: currentWispUrl
			}));
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
		const icon = document.querySelector('#settings-icon i.settings-icon');
		if (settingsMenu.classList.contains('open')) {
		  settingsMenu.classList.add('close');
		  icon.classList.remove('fa-solid');
		  icon.classList.add('fa-regular');
		  setTimeout(() => {
			settingsMenu.classList.remove('open', 'close');
		  }, 300);
		} else {
		  settingsMenu.classList.add('open');
		  icon.classList.remove('fa-regular');
		  icon.classList.add('fa-solid');
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
			const event = new Event('newTransport', {
				detail: selectedValue.toLowerCase()
			});
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
		const defaultTitle = "Google.";
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
	document.getElementById("aboutblank-toggle").addEventListener("change", function() {
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
		const icons = {
			success: '<i class="fa-regular fa-check-circle" style="margin-right: 8px;"></i>',
			error: '<i class="fa-regular fa-times-circle" style="margin-right: 8px;"></i>',
			info: '<i class="fa-regular fa-info-circle" style="margin-right: 8px;"></i>',
			warning: '<i class="fa-regular fa-exclamation-triangle" style="margin-right: 8px;"></i>'
		};
		const icon = icons[type] || '';
		toast.innerHTML = `${icon}${message}`;
		const progressBar = document.createElement('div');
		progressBar.className = 'progress-bar';
		toast.appendChild(progressBar);
		const closeBtn = document.createElement('button');
		closeBtn.className = 'toast-close';
		closeBtn.innerHTML = '<i class="fa-regular fa-xmark" style="margin-left: 8px; font-size: 0.8em;"></i>';
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