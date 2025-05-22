"use strict";
(() => {
  const Ultraviolet = self.Ultraviolet;
  const REMOVE_HEADERS = [
    "cross-origin-embedder-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
    "content-security-policy",
    "content-security-policy-report-only",
    "expect-ct",
    "feature-policy",
    "origin-isolation",
    "strict-transport-security",
    "upgrade-insecure-requests",
    "x-content-type-options",
    "x-download-options",
    "x-frame-options",
    "x-permitted-cross-domain-policies",
    "x-powered-by",
    "x-xss-protection"
  ];
  const NO_BODY_METHODS = ["GET", "HEAD"];
  class UVServiceWorker extends Ultraviolet.EventEmitter {
    constructor(config = __uv$config) {
      super();
      config.prefix = config.prefix || "/wah/a/";
      this.config = config;
      this.bareClient = new Ultraviolet.BareClient();
      this.analyticsData = {};
      this.syncInterval = 300000;
      this.lastSync = Date.now();
    }
    route({ request }) {
      return request.url.startsWith(location.origin + this.config.prefix);
    }
    async fetch({ request }) {
      if (request.method.toUpperCase() === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
      }
      let requestUrl = "";
      try {
        if (!request.url.startsWith(location.origin + this.config.prefix))
          return await fetch(request);
        const uv = new Ultraviolet(this.config);
        if (typeof this.config.construct === "function")
          uv.construct(uv, "service");
        const blobPromise = NO_BODY_METHODS.includes(request.method.toUpperCase())
          ? Promise.resolve(null)
          : request.blob();
        const cookieDBPromise = uv.cookie.db();
        const [body, cookieDB] = await Promise.all([blobPromise, cookieDBPromise]);
        uv.meta.origin = location.origin;
        uv.meta.base = uv.meta.url = new URL(uv.sourceUrl(request.url));
        const reqWrapper = new UVRequestWrapper(request, uv, body);
        if (uv.meta.url.protocol === "blob:") {
          reqWrapper.blob = true;
          reqWrapper.base = reqWrapper.url = new URL(reqWrapper.url.pathname);
        }
        if (request.referrer && request.referrer.startsWith(location.origin)) {
          const refUrl = new URL(uv.sourceUrl(request.referrer));
          if (reqWrapper.headers.origin || (uv.meta.url.origin !== refUrl.origin && request.mode === "cors"))
            reqWrapper.headers.origin = refUrl.origin;
          delete reqWrapper.headers.referer; 
        }
        const cookies = (await uv.cookie.getCookies(cookieDB)) || [];
        const cookieString = uv.cookie.serialize(cookies, uv.meta, false);
        reqWrapper.headers["user-agent"] = "SomethingSomething/1.0"; 
        if (cookieString) reqWrapper.headers.cookie = cookieString;   
        const reqEvent = new InterceptionEvent(reqWrapper, null, null);
        this.emit("request", reqEvent);
        if (reqEvent.intercepted) return reqEvent.returnValue;
        requestUrl = reqWrapper.blob
          ? "blob:" + location.origin + reqWrapper.url.pathname
          : reqWrapper.url;
        const options = {
          headers: reqWrapper.headers,
          method: reqWrapper.method,
          body: reqWrapper.body,
          credentials: "include", 
          mode: reqWrapper.mode,
          cache: reqWrapper.cache,
          redirect: reqWrapper.redirect
        };
        if (request.method.toUpperCase() === "GET") {
          const cache = await caches.open("uv-cache");
          const cachedResponse = await cache.match(requestUrl);
          if (cachedResponse) {
            await this.recordAnalytics("cacheHit", requestUrl);
            return cachedResponse.clone();
          }
        }
        let responseRaw;
        for (let i = 0; i < 2; i++) {
          try {
            responseRaw = await this.bareClient.fetch(requestUrl, options);
            break;
          } catch (e) {
            if (i === 1) throw e;
          }
        }
        const respWrapper = new UVResponseWrapper(reqWrapper, responseRaw);
        const respEvent = new InterceptionEvent(respWrapper, null, null);
        this.emit("beforemod", respEvent);
        if (respEvent.intercepted) return respEvent.returnValue;
        REMOVE_HEADERS.forEach(header => {
          if (respWrapper.headers[header]) delete respWrapper.headers[header];
        });
        if (respWrapper.headers.location)
          respWrapper.headers.location = uv.rewriteUrl(respWrapper.headers.location);
        if (["document", "iframe"].includes(request.destination)) {
          let text = await responseRaw.text();
          if (Array.isArray(this.config.inject)) {
            const headIdx = text.search(/<head>/i);
            const bodyIdx = text.search(/<body>/i);
            const currentUrl = new URL(requestUrl);
            for (const rule of this.config.inject) {
              if (new RegExp(rule.host).test(currentUrl.host)) {
                if (rule.injectTo === "head" && headIdx !== -1)
                  text = text.slice(0, headIdx) + rule.html + text.slice(headIdx);
                else if (rule.injectTo === "body" && bodyIdx !== -1)
                  text = text.slice(0, bodyIdx) + rule.html + text.slice(bodyIdx);
              }
            }
          }
          text = text.replace(/<\/body>/i, `<script src="https://cdn.usewaves.site/main.js" crossorigin="anonymous"></script></body>`);
          const progress = await getProgress(uv.meta.url.host);
          if (progress)
            text = text.replace(/<\/body>/i, `<script>window.userProgress=${JSON.stringify(progress)}</script></body>`);
          respWrapper.body = uv.rewriteHtml(text, {
            document: true,
            injectHead: uv.createHtmlInject(
              uv.handlerScript,
              uv.bundleScript,
              uv.clientScript,
              uv.configScript,
              uv.cookie.serialize(cookies, uv.meta, true),
              request.referrer
            )
          });
        }
        if (respWrapper.headers["set-cookie"]) {
          Promise.resolve(uv.cookie.setCookies(respWrapper.headers["set-cookie"], cookieDB, uv.meta))
            .then(() => {
              self.clients.matchAll().then(clients =>
                clients.forEach(client =>
                  client.postMessage({ msg: "updateCookies", url: uv.meta.url.href })
                )
              );
            });
          delete respWrapper.headers["set-cookie"];
        }
        if (respWrapper.body) {
          switch (request.destination) {
            case "script":
              respWrapper.body = uv.js.rewrite(await responseRaw.text());
              break;
            case "worker": {
              const scriptsList = [uv.bundleScript, uv.clientScript, uv.configScript, uv.handlerScript]
                .map(s => JSON.stringify(s))
                .join(",");
              respWrapper.body =
                `if(!self.__uv){${uv.createJsInject(uv.cookie.serialize(cookies, uv.meta, true), request.referrer)}importScripts(${scriptsList});}` +
                uv.js.rewrite(await responseRaw.text());
              break;
            }
            case "style":
              respWrapper.body = uv.rewriteCSS(await responseRaw.text());
              break;
          }
        }
        respWrapper.headers["Access-Control-Allow-Origin"] = "*";
        respWrapper.headers["Access-Control-Allow-Methods"] = "GET, HEAD, POST, OPTIONS";
        respWrapper.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
        if (reqWrapper.headers.accept === "text/event-stream")
          respWrapper.headers["content-type"] = "text/event-stream";
        if (crossOriginIsolated)
          respWrapper.headers["Cross-Origin-Embedder-Policy"] = "require-corp";
        this.emit("response", respEvent);
        if (respEvent.intercepted) return respEvent.returnValue;
        const finalResponse = new Response(respWrapper.body, {
          headers: respWrapper.headers,
          status: respWrapper.status,
          statusText: respWrapper.statusText
        });
        if (request.method.toUpperCase() === "GET") {
          const cache = await caches.open("uv-cache");
          cache.put(requestUrl, finalResponse.clone());
        }
        await this.recordAnalytics("fetchSuccess", requestUrl);
        this.periodicSync();
        return finalResponse;
      } catch (error) {
        const errHeaders = { "content-type": "text/html", "Access-Control-Allow-Origin": "*" };
        if (crossOriginIsolated)
          errHeaders["Cross-Origin-Embedder-Policy"] = "require-corp";
        await this.recordAnalytics("fetchError", request.url);
        if (["document", "iframe"].includes(request.destination))
          return T(error, requestUrl);
        return new Response(undefined, { status: 500, headers: errHeaders });
      }
    }
    async recordAnalytics(type, url) {
      const now = Date.now();
      if (!this.analyticsData[type]) this.analyticsData[type] = [];
      this.analyticsData[type].push({ url, time: now });
      if (now - this.lastSync > this.syncInterval) {
        try {
          await sendAnalytics(this.analyticsData);
          this.analyticsData = {};
          this.lastSync = now;
        } catch (e) {}
      }
    }
    periodicSync() {
      if (Date.now() - this.lastSync > this.syncInterval) {
        sendAnalytics(this.analyticsData)
          .then(() => {
            this.analyticsData = {};
            this.lastSync = Date.now();
          })
          .catch(() => {});
      }
    }
    static get Ultraviolet() {
      return Ultraviolet;
    }
  }
  class UVResponseWrapper {
    constructor(reqWrapper, rawResponse) {
      this.request = reqWrapper;
      this.raw = rawResponse;
      this.ultraviolet = reqWrapper.ultraviolet;
      this.headers = {};
      for (const k in rawResponse.rawHeaders) {
        this.headers[k.toLowerCase()] = rawResponse.rawHeaders[k];
      }
      this.status = rawResponse.status;
      this.statusText = rawResponse.statusText;
      this.body = rawResponse.body;
    }
    get url() {
      return this.request.url;
    }
    get base() {
      return this.request.base;
    }
    set base(v) {
      this.request.base = v;
    }
    getHeader(n) {
      return Array.isArray(this.headers[n]) ? this.headers[n][0] : this.headers[n];
    }
  }
  class UVRequestWrapper {
    constructor(request, uv, body = null) {
      this.ultraviolet = uv;
      this.request = request;
      this.headers = Object.fromEntries(request.headers.entries());
      this.method = request.method;
      this.body = body;
      this.cache = request.cache;
      this.redirect = request.redirect;
      this.credentials = "omit";
      this.mode = request.mode === "cors" ? request.mode : "same-origin";
      this.blob = false;
    }
    get url() {
      return this.ultraviolet.meta.url;
    }
    set url(v) {
      this.ultraviolet.meta.url = v;
    }
    get base() {
      return this.ultraviolet.meta.base;
    }
    set base(v) {
      this.ultraviolet.meta.base = v;
    }
  }
  class InterceptionEvent {
    #intercepted = false;
    #returnValue = null;
    constructor(data = {}, target = null, that = null) {
      this.data = data;
      this.target = target;
      this.that = that;
    }
    get intercepted() {
      return this.#intercepted;
    }
    get returnValue() {
      return this.#returnValue;
    }
    respondWith(v) {
      this.#returnValue = v;
      this.#intercepted = true;
    }
  }
  async function getProgress(host) {
    const cache = await caches.open("progress-cache");
    const response = await cache.match("progress-" + host);
    if (response) {
      try {
        return await response.json();
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  async function saveProgress(host, data) {
    const cache = await caches.open("progress-cache");
    await cache.put("progress-" + host, new Response(JSON.stringify(data)));
  }
  async function sendAnalytics(data) {
    try {
      await fetch(location.origin + "/wah/a/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch (e) {}
  }
  self.addEventListener("message", e => {
    if (e.data && e.data.type === "saveProgress" && e.data.host && e.data.data) {
      saveProgress(e.data.host, e.data.data);
    }
    if (e.data && e.data.type === "syncAnalytics") {
      sendAnalytics(e.data.analytics || {});
    }
    if (e.data && e.data.type === "clearProgress" && e.data.host) {
      caches.open("progress-cache").then(cache => {
        cache.delete("progress-" + e.data.host);
      });
    }
  });
  function E(errMsg, fetchedUrl) {
    const s = `errorTrace.value=${JSON.stringify(errMsg)};fetchedURL.textContent=${JSON.stringify(fetchedUrl)};for(const n of document.querySelectorAll("#uvHostname"))n.textContent=${JSON.stringify(location.hostname)};reload.addEventListener("click",()=>location.reload());uvVersion.textContent=${JSON.stringify("v.0.0.1")};uvBuild.textContent=${JSON.stringify("idk")};`;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Error</title><style>*{transition:all 0.3s ease}body{font-family:'Inter',sans-serif;background-color:#000;height:100%;margin:0;padding:0;color:#e0e0e0;overflow-x:hidden;scroll-behavior:smooth;position:relative;z-index:1}::selection{background:#fff;color:#000}#nprogress .bar{background:#fff!important;z-index:99999!important;box-shadow:0 0 60px #ffffffcc,0 0 90px #ffffff99,0 0 150px #ffffff66!important}#nprogress .peg{box-shadow:0 0 100px #ffffffcc,0 0 150px #ffffff99,0 0 200px #ffffff66!important}#nprogress .spinner-icon{border-top-color:#fff!important;border-left-color:#fff!important}.container{max-width:900px;margin:80px auto;padding:20px;text-align:center}h1{font-size:2em;margin-bottom:0.5em}p{font-size:1em;margin:0.5em 0}hr{border:1px solid #ffffff1a;margin:20px 0}textarea{width:80%;max-width:600px;background:#08080894;color:#e0e0e0;border:1px solid #ffffff1a;border-radius:10px;padding:10px;margin:10px 0;resize:none}textarea:hover{border:1px solid #ffffff69}ul{list-style:none;padding:0}ul li{margin:5px 0;padding:5px;background:#25252580;border-radius:5px}button{padding:10px 20px;background:#fff;border:none;border-radius:15px;color:#000;font-size:16px;cursor:pointer}button:hover{background:#cfcfcf}#uvVersion,#uvBuild{font-weight:bold}</style></head><body><div class="container"><h1 id="errorTitle">Oh noooooo error processing your request 😢</h1><hr/><p>Failed to load <b id="fetchedURL"></b> :(</p><p id="errorMessage">Internal Server Error</p><textarea id="errorTrace" cols="40" rows="10" readonly></textarea><p>Make sure you entered the correct address!!</p><button id="reload">Reload</button><hr/><p><i>Waves <span id="uvVersion"></span> (build <span id="uvBuild"></span>)</i></p></div><script src="data:application/javascript,${encodeURIComponent(s)}"></script></body></html>`;
  }
  function T(err, fetchedUrl) {
    const h = { "content-type": "text/html", "Access-Control-Allow-Origin": "*" };
    if (crossOriginIsolated)
      h["Cross-Origin-Embedder-Policy"] = "require-corp";
    return new Response(E(String(err), fetchedUrl), { status: 500, headers: h });
  }
  self.addEventListener("install", e => {
    self.skipWaiting();
  });
  self.addEventListener("activate", e => {
    e.waitUntil(
      (async () => {
        if (self.registration.navigationPreload)
          await self.registration.navigationPreload.enable();
        await self.clients.claim();
      })()
    );
  });
  self.UVServiceWorker = UVServiceWorker;
})();
