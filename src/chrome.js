import { promisify } from "node:util";
import child_process from "node:child_process";
const exec = promisify( child_process.exec );

export default ( pathToChrome ) => {
	const renderPdf = async ( src, dst ) => {
		await exec( `${ pathToChrome } --headless --disable-gpu --no-margins --print-to-pdf=/${ dst } ${ src }` );
	};

	return {
		renderPdf
	};
};
