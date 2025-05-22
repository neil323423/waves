document.addEventListener('DOMContentLoaded', function() {
	const originalLog = console.log;
	const originalWarn = console.warn;
	const originalError = console.error;
	const scriptLogs = [];

	function isScriptLog(args) {
		return args[0] && (args[0].includes('%c[+]%c') || args[0].includes('%c[*]%c') || args[0].includes('%c[#]%c') || args[0].includes('%c[-]%c') || args[0].includes('%c[!]%c'));
	}

	console.log = function(...args) {
		if (isScriptLog(args)) {
			scriptLogs.push(args);
		}
		originalLog.apply(console, args);
	};

	console.warn = function(...args) {
		if (isScriptLog(args)) {
			scriptLogs.push(args);
		}
		originalWarn.apply(console, args);
	};

	console.error = function(...args) {
		if (isScriptLog(args)) {
			scriptLogs.push(args);
		}
		originalError.apply(console, args);
	};

	setInterval(() => {
		const currentLogs = [...scriptLogs];
		console.clear();
		currentLogs.forEach(log => originalLog.apply(console, log));
	}, 400);

	const defaultWispUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/w/`;
	let currentWispUrl = localStorage.getItem('customWispUrl') || defaultWispUrl;
	const wispUrl = currentWispUrl;
	const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

	async function registerSW() {
		try {
			if (!navigator.serviceWorker) {
				console.log("%c[!]%c Service Workers are not supported by this browser.", "background-color: black; color: white; font-weight: bold;", "background-color: black; color: white;");
				return;
			}
			await ensureWebSocketConnection(wispUrl);
			console.log("%c[+]%c Registering Service Worker...", "background-color: black; color: white; font-weight: bold;", "background-color: black; color: white;");
			await navigator.serviceWorker.register("/wah/sw.js", { scope: '/wah/a/' });
			console.log("%c[*]%c Service Worker registered successfully.", "background-color: black; color: white; font-weight: bold;", "background-color: black; color: white;");
			const savedTransport = localStorage.getItem('transport') || "epoxy";
			switchTransport(savedTransport);
			updateTransportUI(savedTransport);
			console.log(`%c[#]%c Using ${capitalizeTransport(savedTransport)} transport.`, "background-color: black; color: white; font-weight: bold;", "background-color: black; color: white;");
		} catch (error) {
			logError(error, 'An error occurred during Service Worker registration or WebSocket connection');
		}
	}

	async function ensureWebSocketConnection(url) {
		return new Promise((resolve, reject) => {
			console.log("%c[+]%c Establishing WebSocket connection...", "background-color: black; color: white; font-weight: bold;", "background-color: black; color: white;");
			const ws = new WebSocket(url);
			ws.onopen = () => {
				console.log("%c[*]%c WebSocket connection established.", "background-color: black; color: white; font-weight: bold;", "background-color: black; color: white;");
				resolve(ws);
			};
			ws.onerror = (error) => {
				logError(error, 'Failed to establish WebSocket connection');
				reject(error);
			};
			ws.onclose = (event) => {
				if (event.code !== 1000) {
					console.warn(`%c[-]%c WebSocket connection closed. Reason: ${event.reason || "No reason provided"}`, "background-color: black; color: white; font-weight: bold;", "background-color: black; color: white;");
				} else {
					console.warn("%c[-]%c WebSocket connection closed normally.", "background-color: black; color: white; font-weight: bold;", "background-color: black; color: white;");
				}
			};
		});
	}

	function logError(error, message) {
		console.error(`%c[!]%c ${message}: ${error.message || error}`, "background-color: black; color: white; font-weight: bold;", "background-color: black; color: white;");
	}

	function switchTransport(transport) {
		const transportMap = {
			"epoxy": "/epoxy/index.mjs",
			"libcurl": "/libcurl/index.mjs"
		};
		const transportFile = transportMap[transport];
		if (transportFile) {
			connection.setTransport(transportFile, [{ wisp: wispUrl }]);
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
		transportSelected.textContent = capitalizeTransport(transport);
	}

	function capitalizeTransport(transport) {
		return transport.charAt(0).toUpperCase() + transport.slice(1).toLowerCase();
	}

	document.addEventListener('wispUrlChanged', function(e) {
		currentWispUrl = e.detail;
		switchTransport(localStorage.getItem('transport') || "epoxy");
	});

	registerSW();
});