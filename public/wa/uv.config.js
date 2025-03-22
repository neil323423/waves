self.__uv$config = {
	prefix: '/wa/a/',
	encodeUrl: Ultraviolet.codec.xor.encode,
	decodeUrl: Ultraviolet.codec.xor.decode,
	handler: '/wa/uv.handler.js',
	client: '/wa/uv.client.js',
	bundle: '/wa/uv.bundle.js',
	config: '/wa/uv.config.js',
	sw: '/uv.sw.js'
  };  