document.addEventListener('DOMContentLoaded', function () {
  const SW = "/uv/sw.js";
  const defaultWispUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/w/`;
  let currentWispUrl = localStorage.getItem('customWispUrl') || defaultWispUrl;
  const wispUrl = currentWispUrl;
  const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

  async function registerSW() {
    try {
      if (!navigator.serviceWorker) {
        console.log("%c[❌]%c Service Workers are not supported by this browser.", "color: red; font-weight: bold;", "color: inherit;");
        return;
      }

      console.log("%c[✔]%c Initializing connection to WebSocket server at: " + wispUrl, "color: green; font-weight: bold;", "color: inherit;");

      const savedTransport = localStorage.getItem('transport') || "epoxy";
      switchTransport(savedTransport);
      updateTransportUI(savedTransport);

      console.log(`%c[✔]%c Using ${savedTransport} transport.`, "color: green; font-weight: bold;", "color: inherit;");

      console.log("%c[✔]%c Registering Service Worker...", "color: green; font-weight: bold;", "color: inherit;");
      await navigator.serviceWorker.register("/sw.js", { scope: '/$/' });
      console.log("%c[✔]%c Service Worker registered successfully.", "color: green; font-weight: bold;", "color: inherit;");

    } catch (error) {
      console.error("%c[❌]%c An error occurred during Service Worker registration: " + error, "color: red; font-weight: bold;", "color: inherit;");
    }
  }

  function switchTransport(transport) {
    if (transport === "epoxy") {
      connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
    } else if (transport === "libcurl") {
      connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
    }
  }

  async function changeTransport(newTransport) {
    try {
      await new Promise((resolve) => {
        localStorage.setItem('transport', newTransport, resolve);
      });
      switchTransport(newTransport);
      updateTransportUI(newTransport);
    } catch (error) {
      console.error(`%c[❌]%c An error occurred while storing transport preference: ${error}`, "color: red; font-weight: bold;", "color: inherit;");
    }
  }

  function updateTransportUI(transport) {
    const transportSelected = document.querySelector(".transport-selected");
    transportSelected.textContent = transport.charAt(0).toUpperCase() + transport.slice(1); 
  }

  document.addEventListener('wispUrlChanged', function (e) {
    currentWispUrl = e.detail;
    switchTransport(localStorage.getItem('transport') || "epoxy");
  });

  registerSW();
});
