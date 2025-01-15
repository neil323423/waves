const SW = "/uv/sw.js";
const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/w/";
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

async function registerSW() {
  try {
    if (!navigator.serviceWorker) {
      console.log("%c[❌]%c Service Workers are not supported by this browser.", "color: red; font-weight: bold;", "color: inherit;");
      return;
    }

    console.log("%c[✔]%c Initializing connection to WebSocket server at: " + wispUrl, "color: green; font-weight: bold;", "color: inherit;");
    await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
    console.log("%c[✔]%c Connection transport set successfully.", "color: green; font-weight: bold;", "color: inherit;");

    console.log("%c[✔]%c Registering Service Worker...", "color: green; font-weight: bold;", "color: inherit;");
    await window.navigator.serviceWorker.register("/sw.js", {
      scope: '/$/',
    });
    console.log("%c[✔]%c Service Worker registered successfully.", "color: green; font-weight: bold;", "color: inherit;");
  } catch (error) {
    console.error("%c[❌]%c An error occurred during Service Worker registration: " + error, "color: red; font-weight: bold;", "color: inherit;");
  }
}

registerSW();
