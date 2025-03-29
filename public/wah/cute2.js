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
      if (!config.prefix) config.prefix = "/wah/a/";
      this.config = config;
      this.bareClient = new Ultraviolet.BareClient();
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
        let uv = new Ultraviolet(this.config);
        if (typeof this.config.construct === "function") {
          this.config.construct(uv, "service");
        }
        let cookieDB = await uv.cookie.db();
        uv.meta.origin = location.origin;
        uv.meta.base = uv.meta.url = new URL(uv.sourceUrl(request.url));
        let reqWrapper = new UVRequestWrapper(
          request,
          uv,
          NO_BODY_METHODS.includes(request.method.toUpperCase()) ? null : await request.blob()
        );
        if (uv.meta.url.protocol === "blob:") {
          reqWrapper.blob = true;
          reqWrapper.base = reqWrapper.url = new URL(reqWrapper.url.pathname);
        }
        if (request.referrer && request.referrer.startsWith(location.origin)) {
          let refUrl = new URL(uv.sourceUrl(request.referrer));
          if (reqWrapper.headers.origin || (uv.meta.url.origin !== refUrl.origin && request.mode === "cors")) {
            reqWrapper.headers.origin = refUrl.origin;
          }
          reqWrapper.headers.referer = refUrl.href;
        }
        let cookies = await uv.cookie.getCookies(cookieDB) || [];
        const cookieString = uv.cookie.serialize(cookies, uv.meta, false);
        reqWrapper.headers["user-agent"] = navigator.userAgent;
        if (cookieString) reqWrapper.headers.cookie = cookieString;
        let reqEvent = new InterceptionEvent(reqWrapper, null, null);
        this.emit("request", reqEvent);
        if (reqEvent.intercepted) return reqEvent.returnValue;
        requestUrl = reqWrapper.blob ? "blob:" + location.origin + reqWrapper.url.pathname : reqWrapper.url;
        const responseRaw = await this.bareClient.fetch(requestUrl, {
          headers: reqWrapper.headers,
          method: reqWrapper.method,
          body: reqWrapper.body,
          credentials: reqWrapper.credentials,
          mode: reqWrapper.mode,
          cache: reqWrapper.cache,
          redirect: reqWrapper.redirect
        });
        let respWrapper = new UVResponseWrapper(reqWrapper, responseRaw);
        let respEvent = new InterceptionEvent(respWrapper, null, null);
        this.emit("beforemod", respEvent);
        if (respEvent.intercepted) return respEvent.returnValue;
        for (let headerName of REMOVE_HEADERS) {
          if (respWrapper.headers[headerName]) {
            delete respWrapper.headers[headerName];
          }
        }
        if (respWrapper.headers.location) {
          respWrapper.headers.location = uv.rewriteUrl(respWrapper.headers.location);
        }
        if (["document", "iframe"].includes(request.destination)) {
          let text = await responseRaw.text();
          if (Array.isArray(this.config.inject)) {
            const headIdx = text.indexOf("<head>") !== -1 ? text.indexOf("<head>") : text.indexOf("<HEAD>");
            const bodyIdx = text.indexOf("<body>") !== -1 ? text.indexOf("<body>") : text.indexOf("<BODY>");
            const currentUrl = new URL(requestUrl);
            for (let rule of this.config.inject) {
              if (new RegExp(rule.host).test(currentUrl.host)) {
                if (rule.injectTo === "head" && headIdx !== -1) {
                  text = text.slice(0, headIdx) + rule.html + text.slice(headIdx);
                } else if (rule.injectTo === "body" && bodyIdx !== -1) {
                  text = text.slice(0, bodyIdx) + rule.html + text.slice(bodyIdx);
                }
              }
            }
          }
          text = text.replace(/<\/body>/i, `<script src="https://cdn.usewaves.site/blocker.js" crossorigin="anonymous"></script></body>`);
          respWrapper.body = uv.rewriteHtml(text, {
            document: true,
            injectHead: uv.createHtmlInject(uv.handlerScript, uv.bundleScript, uv.clientScript, uv.configScript, uv.cookie.serialize(cookies, uv.meta, true), request.referrer)
          });
        }
        if (respWrapper.headers["set-cookie"]) {
          Promise.resolve(uv.cookie.setCookies(respWrapper.headers["set-cookie"], cookieDB, uv.meta)).then(() => {
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({ msg: "updateCookies", url: uv.meta.url.href });
              });
            });
          });
          delete respWrapper.headers["set-cookie"];
        }
        if (respWrapper.body) {
          switch (request.destination) {
            case "script":
              respWrapper.body = uv.js.rewrite(await responseRaw.text());
              break;
            case "worker": {
              const scriptsList = [uv.bundleScript, uv.clientScript, uv.configScript, uv.handlerScript].map(script => JSON.stringify(script)).join(",");
              respWrapper.body = `if (!self.__uv) {${uv.createJsInject(uv.cookie.serialize(cookies, uv.meta, true), request.referrer)}importScripts(${scriptsList});}`;
              respWrapper.body += uv.js.rewrite(await responseRaw.text());
              break;
            }
            case "style":
              respWrapper.body = uv.rewriteCSS(await responseRaw.text());
              break;
            default:
              break;
          }
        }
        respWrapper.headers["Access-Control-Allow-Origin"] = "*";
        respWrapper.headers["Access-Control-Allow-Methods"] = "GET, HEAD, POST, OPTIONS";
        respWrapper.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
        if (reqWrapper.headers.accept === "text/event-stream") {
          respWrapper.headers["content-type"] = "text/event-stream";
        }
        if (crossOriginIsolated) {
          respWrapper.headers["Cross-Origin-Embedder-Policy"] = "require-corp";
        }
        this.emit("response", respEvent);
        if (respEvent.intercepted) return respEvent.returnValue;
        return new Response(respWrapper.body, {
          headers: respWrapper.headers,
          status: respWrapper.status,
          statusText: respWrapper.statusText
        });
      } catch (error) {
        const errHeaders = {
          "content-type": "text/html",
          "Access-Control-Allow-Origin": "*"
        };
        if (crossOriginIsolated) {
          errHeaders["Cross-Origin-Embedder-Policy"] = "require-corp";
        }
        if (["document", "iframe"].includes(request.destination)) {
          return T(error, requestUrl);
        } else {
          return new Response(undefined, { status: 500, headers: errHeaders });
        }
      }
    }
    static get Ultraviolet() {
      return Ultraviolet;
    }
  }

  class UVResponseWrapper {
    constructor(requestWrapper, rawResponse) {
      this.request = requestWrapper;
      this.raw = rawResponse;
      this.ultraviolet = requestWrapper.ultraviolet;
      this.headers = {};
      for (let key in rawResponse.rawHeaders) {
        this.headers[key.toLowerCase()] = rawResponse.rawHeaders[key];
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
    set base(val) {
      this.request.base = val;
    }
    getHeader(name) {
      return Array.isArray(this.headers[name]) ? this.headers[name][0] : this.headers[name];
    }
  }

  class UVRequestWrapper {
    constructor(request, ultraviolet, body = null) {
      this.ultraviolet = ultraviolet;
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
    set url(val) {
      this.ultraviolet.meta.url = val;
    }
    get base() {
      return this.ultraviolet.meta.base;
    }
    set base(val) {
      this.ultraviolet.meta.base = val;
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
    respondWith(val) {
      this.#returnValue = val;
      this.#intercepted = true;
    }
  }

  function E(errorMsg, fetchedUrl) {
    const scriptContent = `errorTrace.value=${JSON.stringify(errorMsg)};fetchedURL.textContent=${JSON.stringify(fetchedUrl)};for(const node of document.querySelectorAll("#uvHostname"))node.textContent=${JSON.stringify(location.hostname)};reload.addEventListener("click",()=>location.reload());uvVersion.textContent=${JSON.stringify("3.2.10")};uvBuild.textContent=${JSON.stringify("92d9075")};`;
    return `<!DOCTYPE html><html><head><meta charset='utf-8'/><title>Error</title><style>*{background-color:white}</style></head><body><h1 id='errorTitle'>Error processing your request</h1><hr/><p>Failed to load <b id="fetchedURL"></b></p><p id="errorMessage">Internal Server Error</p><textarea id="errorTrace" cols="40" rows="10" readonly></textarea><p>Try:</p><ul><li>Checking your internet connection</li><li>Verifying you entered the correct address</li><li>Clearing the site data</li><li>Contacting <b id="uvHostname"></b>'s administrator</li><li>Verify the server isn't censored</li></ul><p>If you're the administrator of <b id="uvHostname"></b>, try:</p><ul><li>Restarting your server</li><li>Updating Ultraviolet</li><li>Troubleshooting the error on the <a href="https://github.com/titaniumnetwork-dev/Ultraviolet" target="_blank">GitHub repository</a></li></ul><button id="reload">Reload</button><hr/><p><i>Ultraviolet v<span id="uvVersion"></span> (build <span id="uvBuild"></span>)</i></p><script src="data:application/javascript,${encodeURIComponent(scriptContent)}"></script></body></html>`;
  }

  function T(error, fetchedUrl) {
    const headers = {
      "content-type": "text/html",
      "Access-Control-Allow-Origin": "*"
    };
    if (crossOriginIsolated) {
      headers["Cross-Origin-Embedder-Policy"] = "require-corp";
    }
    return new Response(E(String(error), fetchedUrl), { status: 500, headers });
  }

  self.addEventListener("install", event => {
    self.skipWaiting();
  });

  self.addEventListener("activate", event => {
    event.waitUntil((async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })());
  });

  self.UVServiceWorker = UVServiceWorker;
})();
//# sourceMappingURL=uv.sw.js.map