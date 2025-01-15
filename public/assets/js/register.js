const SW = "/uv/sw.js";
const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
async function registerSW() {
  if (!navigator.serviceWorker) {
  }
  await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
  await window.navigator.serviceWorker.register("/sw.js", {
    scope: '/$/',
  });
}

registerSW();