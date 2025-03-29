importScripts('/wah/uv.bundle.js', '/wah/cute1.js', '/wah/cute2.js');

const uv = new UVServiceWorker();

self.addEventListener('fetch', (event) => {
	const {
		request
	} = event;

	event.respondWith(
		uv.route(event) ? uv.fetch(event) : fetch(request)
	);
});