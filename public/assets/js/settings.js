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
    <label>Version 2.8.5</label>
    <label onmouseover="this.querySelector('span').style.color='lime'" onmouseout="this.querySelector('span').style.color='green'">
      Server Status: <span style="color: green; transition: color 0.3s ease;">Running</span>
    </label>
    <p>If you want to see Waves status please visit <a href="https://status.usewaves.site" target="_blank" class="hover-link">https://status.usewaves.site</a>.</p>
    <div style="display: flex; gap: 10px; justify-content: left; align-items: left; margin-top: 10px; margin-bottom: -20px;">
      <label><a href="https://discord.gg/dJvdkPRheV" target="_blank" class="hover-link"><i class="fab fa-discord" style="font-size: 20px;"></i></a></label>
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
			document.dispatchEvent(new CustomEvent('wispUrlChanged', { detail: currentWispUrl }));
			wispInput.value = currentWispUrl;
			showToast('success', `WISP URL successfully updated to: ${currentWispUrl}`);
			location.reload();
		} else {
			currentWispUrl = defaultWispUrl;
			localStorage.setItem('customWispUrl', defaultWispUrl);
			wispInput.value = defaultWispUrl;
			showToast('error', "Invalid URL. Reverting back to default...");
			location.reload();
		}
	}
	saveButton.addEventListener('click', () => {
		updateWispServerUrl(wispInput.value.trim());
	});
	settingsIcon.addEventListener('click', (event) => {
		event.preventDefault();
		toggleSettingsMenu();
	});
	closeSettingsButton.addEventListener('click', toggleSettingsMenu);

	function toggleSettingsMenu() {
		const icon = document.querySelector('#settings-icon i.settings-icon');
		if (settingsMenu.classList.contains('open')) {
			settingsMenu.classList.add('close');
			icon.classList.replace('fa-solid', 'fa-regular');
			setTimeout(() => settingsMenu.classList.remove('open', 'close'), 300);
		} else {
			settingsMenu.classList.add('open');
			icon.classList.replace('fa-regular', 'fa-solid');
			setTimeout(() => settingsMenu.classList.remove('close'), 300);
		}
	}
	transportSelected.addEventListener('click', function(e) {
		e.stopPropagation();
		transportOptions.classList.toggle('transport-show');
		this.classList.toggle('transport-arrow-active');
	});
	Array.from(transportOptions.getElementsByTagName('div')).forEach(option => {
		option.addEventListener('click', function(e) {
			e.stopPropagation();
			const selectedValue = this.textContent;
			transportSelected.textContent = selectedValue;
			localStorage.setItem('transport', selectedValue.toLowerCase());
			transportOptions.classList.remove('transport-show');
			transportSelected.classList.remove('transport-arrow-active');
			document.dispatchEvent(new Event('newTransport', { detail: selectedValue.toLowerCase() }));
			showToast('success', `Transport successfully changed to ${selectedValue}`);
			location.reload();
		});
	});
	document.getElementById('proxy-content').classList.add('active');

	function switchTab(activeTabId, activeContentId, ...others) {
		[others[1], others[3], others[5]].forEach(id => document.getElementById(id).classList.remove('active'));
		[others[0], others[2], others[4]].forEach(id => document.getElementById(id).classList.remove('active'));
		document.getElementById(activeContentId).classList.add('active');
		document.getElementById(activeTabId).classList.add('active');
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
	document.querySelectorAll('.tab-button').forEach(btn => {
		btn.addEventListener('click', function() {
			const icon = this.querySelector('i');
			if (icon.classList.contains('fa-bounce')) return;
			icon.classList.add('fa-bounce');
			setTimeout(() => icon.classList.remove('fa-bounce'), 750);
		});
	});
	navbarToggle.addEventListener('change', function() {
		showToast(this.checked ? 'success' : 'error', `Navigation Bar is now ${this.checked ? 'enabled' : 'disabled'}.`);
	});
	function runScriptIfChecked() {
		let inFrame;
		try { inFrame = window !== top; } catch (e) { inFrame = true; }
		const aboutBlankChecked = JSON.parse(localStorage.getItem("aboutBlankChecked")) || false;
		if (!aboutBlankChecked || inFrame) return;
		const title = localStorage.getItem("siteTitle") || "Google.";
		const icon = localStorage.getItem("faviconURL") || "https://www.google.com/favicon.ico";
		const popup = window.open("", "_blank");
		if (!popup || popup.closed) {
			alert("Failed to load automask. Please allow popups and try again.");
			return;
		}
		popup.document.head.innerHTML = `<title>${title}</title><link rel="icon" href="${icon}">`;
		popup.document.body.innerHTML = `<iframe style="height:100%;width:100%;border:none;position:fixed;top:0;right:0;left:0;bottom:0;" src="/"></iframe>`;
		window.location.replace("https://bisd.schoology.com/home");
	}
	document.getElementById("aboutblank-toggle").addEventListener("change", function() {
		localStorage.setItem("aboutBlankChecked", JSON.stringify(this.checked));
		showToast(this.checked ? 'success' : 'error', `About:Blank is now ${this.checked ? 'enabled' : 'disabled'}.`);
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
			success: '<i class="fa-regular fa-check-circle" style="margin-right:8px;"></i>',
			error: '<i class="fa-regular fa-times-circle" style="margin-right:8px;"></i>',
			info: '<i class="fa-regular fa-info-circle" style="margin-right:8px;"></i>',
			warning: '<i class="fa-regular fa-exclamation-triangle" style="margin-right:8px;"></i>'
		};
		toast.innerHTML = `${icons[type] || ''}${message}`;
		const progressBar = document.createElement('div');
		progressBar.className = 'progress-bar';
		toast.appendChild(progressBar);
		const closeBtn = document.createElement('button');
		closeBtn.className = 'toast-close';
		closeBtn.innerHTML = '<i class="fa-regular fa-xmark" style="margin-left:8px;font-size:0.8em;"></i>';
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
});