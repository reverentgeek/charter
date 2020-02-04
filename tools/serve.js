"use strict";

const handler = require( "serve-handler" );
const http = require( "http" );
const port = 3000;

const server = http.createServer( ( request, response ) => {
	return handler( request, response, {
		public: "build"
	} );
} );

server.listen( port, async () => {
	console.log( `Running server at http://localhost:${ port }` );
} );
