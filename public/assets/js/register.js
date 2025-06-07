;(function(){
  const origLog = console.log.bind(console);
  document.addEventListener("DOMContentLoaded", () => {
    origLog(
      "%c\n" +
	  "     ᶻ 𝗓 𐰁 .ᐟ\n" +
      "    |\\      _,,,---,,_\n" +
      "   /, `.-'`'    -.  ;-;;,_\n" +
      "  |,4-  ) )-,_..;\\ (  `'-'\n" +
      " '---''(_/--'  `-`\\_)\n   discord.gg/dJvdkPRheV",
      "color: hotpink; font-size: 16px; display: block; white-space: pre; text-align: center; padding-left: 28%;"
    );
  });

  const labelStyle   = "background: white; color: black; font-weight: bold; padding: 2px 4px; border-radius: 2px";
  const messageStyle = "background: black; color: white; padding: 2px 4px; border-radius: 2px";
  ["log","info","warn","error","debug"].forEach(method => {
    const orig = console[method].bind(console);
    console[method] = (...args) => {
      const text = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      orig(`%cWaves:%c ${text}`, labelStyle, messageStyle);
    };
  });

  document.addEventListener("DOMContentLoaded", function(){
    const defaultWispUrl = `${window.location.protocol==="https:"?"wss":"ws"}://${window.location.host}/w/`;
    let currentWispUrl    = localStorage.getItem("customWispUrl") || defaultWispUrl;
    const wispUrl         = currentWispUrl;
    const connection      = new BareMux.BareMuxConnection("/baremux/worker.js");

    registerSW();

    async function registerSW(){
      try {
        if (!navigator.serviceWorker) return console.error("Service Workers are not supported by this browser.");
        await ensureWebSocketConnection(wispUrl);
        console.log("Registering Service Worker...");
        await navigator.serviceWorker.register("/wah/sw.js", { scope: "/wah/a/" });
        console.log("Service Worker registered successfully.");
        const savedTransport = localStorage.getItem("transport") || "epoxy";
        switchTransport(savedTransport);
        updateTransportUI(savedTransport);
        console.log(`Using ${capitalizeTransport(savedTransport)} transport.`);
      } catch (e) {
        console.error(`An error occurred during Service Worker registration or WebSocket connection: ${e.message||e}`);
      }
    }

    async function ensureWebSocketConnection(url){
      return new Promise((resolve, reject) => {
        console.log("Establishing WebSocket connection...");
        const ws = new WebSocket(url);
        ws.onopen  = () => { console.log("WebSocket connection established."); resolve(ws); };
        ws.onerror = e  => { console.error(`Failed to establish WebSocket connection: ${e.message||e}`); reject(e); };
        ws.onclose = ev => {
          if (ev.code !== 1000) console.warn(`WebSocket connection closed. Reason: ${ev.reason||"No reason provided"}`);
          else                  console.warn("WebSocket connection closed normally.");
        };
      });
    }

    function switchTransport(t){
      const m = { epoxy: "/epoxy/index.mjs", libcurl: "/libcurl/index.mjs" }[t];
      if (m) connection.setTransport(m, [{ wisp: wispUrl }]);
    }

    function updateTransportUI(t){
      document.querySelector(".transport-selected").textContent = capitalizeTransport(t);
    }

    function capitalizeTransport(t){
      return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    }

    document.addEventListener("wispUrlChanged", function(e){
      currentWispUrl = e.detail;
      switchTransport(localStorage.getItem("transport") || "epoxy");
    });
  });
})();