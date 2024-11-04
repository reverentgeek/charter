/* eslint-disable n/no-extraneous-import */
import { createServer } from "http";
import handler from "serve-handler";

const port = 3000;

const server = createServer( ( request, response ) => {
	return handler( request, response, {
		public: "build"
	} );
} );

server.listen( port, async () => {
	console.log( `Running server at http://localhost:${ port }` );
} );
