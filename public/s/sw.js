importScripts('/s/uv.bundle.js', '/s/uv.config.js', '/s/uv.sw.js');

const uv = new UVServiceWorker();

self.addEventListener('fetch', (event) => {
	const {
		request
	} = event;

	event.respondWith(
		uv.route(event) ? uv.fetch(event) : fetch(request)
	);
});