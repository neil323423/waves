self.__uv$config = {
	prefix: '/s/t/',
	encodeUrl: Ultraviolet.codec.xor.encode,
	decodeUrl: Ultraviolet.codec.xor.decode,
	handler: '/s/uv.handler.js',
	client: '/s/uv.client.js',
	bundle: '/s/uv.bundle.js',
	config: '/s/uv.config.js',
	sw: '/uv.sw.js'
  };  