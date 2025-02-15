(function () {
    const pingDisplay = document.getElementById("pingDisplay");
    const ws = new WebSocket("ws://localhost:3000/w/ping");
    ws.onopen = function () {
      pingDisplay.innerHTML = '<i class="fas fa-wifi"></i> Ping: Waiting...';
    };
    ws.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ping" && data.timestamp) {
          ws.send(JSON.stringify({ type: "pong", timestamp: data.timestamp }));
        }
        if (data.type === "latency" && typeof data.latency === "number") {
          pingDisplay.innerHTML = '<i class="fas fa-wifi"></i> Ping: ' + data.latency + ' ms';
        }
      } catch (err) {}
    };
    ws.onerror = function () {
      pingDisplay.innerHTML = '<i class="fas fa-wifi"></i> Ping: Error';
    };
    ws.onclose = function () {
      pingDisplay.innerHTML = '<i class="fas fa-wifi"></i> Ping: Disconnected';
    };
  })();