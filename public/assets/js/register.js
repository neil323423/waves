document.addEventListener('DOMContentLoaded', function() {
	const defaultWispUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/w/`;
	let currentWispUrl = localStorage.getItem('customWispUrl') || defaultWispUrl;
	const wispUrl = currentWispUrl;
	const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

	async function registerSW() {
		try {
			if (!navigator.serviceWorker) {
				console.log("%c[⚠️]%c Service Workers are not supported by this browser.", "color: orange; font-weight: bold;", "color: black;");
				return;
			}

			await ensureWebSocketConnection(wispUrl);

			console.log("%c[⚙️]%c Registering Service Worker...", "color: #007bff; font-weight: bold;", "color: #007bff;");
			await navigator.serviceWorker.register("/wah/sw.js", {
				scope: '/wah/a/'
			});
			console.log("%c[✅]%c Service Worker registered successfully.", "color: green; font-weight: bold;", "color: green;");

			const savedTransport = localStorage.getItem('transport') || "epoxy";
			switchTransport(savedTransport);
			updateTransportUI(savedTransport);

			console.log(`%c[🚀]%c Using ${savedTransport} transport.`, "color: #ffffff 255, 255); font-weight: bold;", "color: #ffffff;");

		} catch (error) {
			logError(error, 'An error occurred during Service Worker registration or WebSocket connection');
		}
	}

	async function ensureWebSocketConnection(url) {
		return new Promise((resolve, reject) => {
			console.log("%c[🌐]%c Establishing WebSocket connection...", "color: #007bff; font-weight: bold;", "color: #007bff;");
			const ws = new WebSocket(url);

			ws.onopen = () => {
				console.log("%c[✅]%c WebSocket connection established.", "color: green; font-weight: bold;", "color: green;");
				resolve(ws);
			};

			ws.onerror = (error) => {
				logError(error, 'Failed to establish WebSocket connection');
				reject(error);
			};

			ws.onclose = (event) => {
				if (event.code !== 1000) {
					console.warn(`%c[⚠️]%c WebSocket connection closed. Reason: ${event.reason || "No reason provided"}`, "color: orange; font-weight: bold;", "color: orange;");
				} else {
					console.warn("%c[⚠️]%c WebSocket connection closed normally.", "color: orange; font-weight: bold;", "color: orange;");
				}
			};
		});
	}

	function logError(error, message) {
		console.error(`%c[❌]%c ${message}: ${error.message || error}`, "color: red; font-weight: bold;", "color: red;");
	}

	function switchTransport(transport) {
		const transportMap = {
			"epoxy": "/epoxy/index.mjs",
			"libcurl": "/libcurl/index.mjs"
		};

		const transportFile = transportMap[transport];
		if (transportFile) {
			connection.setTransport(transportFile, [{
				wisp: wispUrl
			}]);
		}
	}

	async function changeTransport(newTransport) {
		try {
			localStorage.setItem('transport', newTransport);
			switchTransport(newTransport);
			updateTransportUI(newTransport);
		} catch (error) {
			logError(error, 'An error occurred while storing transport preference');
		}
	}

	function updateTransportUI(transport) {
		const transportSelected = document.querySelector(".transport-selected");
		transportSelected.textContent = transport.charAt(0).toUpperCase() + transport.slice(1);
	}

	document.addEventListener('wispUrlChanged', function(e) {
		currentWispUrl = e.detail;
		switchTransport(localStorage.getItem('transport') || "epoxy");
	});

	registerSW();
});