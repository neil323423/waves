document.addEventListener('DOMContentLoaded', function () {
  const SW = "/uv/sw.js";
  const wispUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/w/`;
  let currentTransport = "epoxy";
  const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

  async function registerSW() {
    try {
      if (!navigator.serviceWorker) {
        console.log("%c[❌]%c Service Workers are not supported by this browser.", "color: red; font-weight: bold;", "color: inherit;");
        return;
      }

      console.log("%c[✔]%c Initializing connection to WebSocket server at: " + wispUrl, "color: green; font-weight: bold;", "color: inherit;");

      const savedTransport = localStorage.getItem('transport') || currentTransport;
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

  function changeTransport(newTransport) {
    currentTransport = newTransport;
    console.log(`%c[✔]%c Switched to ${currentTransport} transport.`, "color: green; font-weight: bold;", "color: inherit;");
    localStorage.setItem('transport', currentTransport);
    switchTransport(currentTransport);
    updateTransportUI(currentTransport);
  }

  function updateTransportUI(transport) {
    const transportSelect = document.getElementById("transport-select");
    transportSelect.value = transport;
  }

  const transportSelect = document.getElementById("transport-select");
  transportSelect.addEventListener("change", (event) => {
    changeTransport(event.target.value);
  });

  registerSW();
});
