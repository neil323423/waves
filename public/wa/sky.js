importScripts('/wa/uv.bundle.js', '/wa/uv.config.js', '/wa/uv.sw.js');

const uv = new UVServiceWorker();

self.addEventListener('fetch', (event) => {
	const {
		request
	} = event;

	event.respondWith(
		uv.route(event) ? uv.fetch(event) : fetch(request)
	);
});