"use strict";

const chordpro = require( "./chordpro" );
const html = require( "./html" );
const fs = require( "fs-extra" );
const path = require( "path" );
const os = require( "os" );
const sass = require( "node-sass" );
const handler = require( "serve-handler" );
const http = require( "http" );
const util = require( "util" );
const exec = util.promisify( require( "child_process" ).exec );

function rename( file, isPdf ) {
	const ext = isPdf ? ".pdf" : ".html";
	return path.basename( file, path.extname( file ) ) + ext;
}

async function validate( config ) {
	const isPdf = !config.html;
	const isHtml = !!config.html;
	const isTempDir = !isHtml && !config.temp;
	let isFile = false;
	let isFolder = false;

	const pathExists = await fs.exists( config.source );
	if ( !pathExists ) {
		throw new Error( "The path to the chordpro file(s) does not appear to be valid." );
	}
	const stats = await fs.lstat( config.source );
	isFolder = stats.isDirectory();
	isFile = stats.isFile();

	if ( !isFile && !isFolder ) {
		throw new Error( "The path to the chordpro file(s) does not appear to be valid." );
	}

	if ( config.out ) {
		let outExists = await fs.exists( config.out );
		if ( !outExists ) {
			outExists = await fs.exists( path.dirname( config.out ) );
		}
		
		if ( !outExists ) {
			throw new Error( "The path to the output file/folder does not appear to be valid." );
		}
		if ( isFolder ) {
			const ext = path.extname( config.out );
			if ( ext ) {
				config.out = path.dirname( config.out );
			}
		} else {
			const ext = path.extname( config.out );
			if ( !ext ) {
				const newFile = rename( config.source, isPdf );
				config.out = path.join( config.out, newFile );
			}
		}
	} else {
		if ( isFolder ) {
			config.out = config.source;
		} else {
			const newFile = rename( config.source, isPdf );
			const dir = path.dirname( config.source );
			config.out = path.join( dir, newFile );
		}
	}

	if ( config.temp ) {
		const tempExists = await fs.exists( config.temp );
		if ( !tempExists ) {
			throw new Error( "The path to the temp folder does not appear to be valid." );
		}
		const tempStats = await fs.lstat( config.temp );
		if ( !tempStats.isDirectory() ) {
			throw new Error( "The path to the temp folder does not appear to be valid." );
		}
	}
	let buildFolder;
	if ( isTempDir && !isHtml ) {
		buildFolder = path.join( os.tmpdir(), "chord-charter-build" );
	} else if ( config.temp && !isHtml ) {
		buildFolder = path.resolve( config.temp );
	} else {
		buildFolder = isFile && isHtml ? path.dirname( path.resolve( config.out ) ) : path.resolve( config.out );
	}

	return {
		src: path.resolve( config.source ),
		dst: path.resolve( config.out ),
		buildFolder,
		isFolder,
		isFile,
		isTempDir,
		isHtml,
		isPdf,
		port: config.port,
		columns: !!config.columns
	};
}

async function getAllChordProFiles( folder ) {
	const files = await fs.readdir( folder );
	return files.filter( f => f.endsWith( ".cho" ) || f.endsWith( ".chordpro" ) )
		.map( f => path.join( folder, f ) );
}

async function renderSass( assetsFolder, sassFile, cssFile ) {
	const res = sass.renderSync( {
		file: path.join( __dirname, "sass", sassFile ),
		outFile: path.join( assetsFolder, cssFile ),
		outputStyle: "compact",
		sourceMap: false
	} );
	await fs.writeFile( path.join( assetsFolder, cssFile ), res.css );
}

async function renderAssets( buildFolder ) {
	const assetsFolder = path.join( buildFolder, "assets" );
	await fs.ensureDir( assetsFolder );
	await renderSass( assetsFolder, "styles.scss", "styles.css" );
	await renderSass( assetsFolder, "2column.scss", "2column.css" );
	await fs.copyFile( path.join( __dirname, "assets", "logo.jpg" ), path.join( assetsFolder, "logo.jpg" ) );
}

async function saveChordProFileAsHtml( src, dst, columns ) {
	const text = await fs.readFile( src, "utf8" );
	const chart = chordpro.parse( text );
	const chartHtml = await html.render( chart, { columns } );
	await fs.writeFile( dst, chartHtml, { encoding: "utf8" } );
}

async function renderPdf( port, title, pdfFolder ) {
	console.log( `saving ${ title } to pdf...` );
	const pdf = path.join( __dirname, "..", "node_modules", ".bin", "electron-pdf" );
	await exec( `${ pdf } http://localhost:${ port }/${ title } ${ pdfFolder }/${ title }.pdf` );
}

async function execute( config ) {
	const cfg = await validate( config );
	// console.log( cfg );
	const files = cfg.isFolder ? await getAllChordProFiles( cfg.src ) : [ cfg.src ];
	const buildTitles = [];
	if ( files.length === 0 ) {
		throw new Error( "No chordpro files found." );
	}
	// console.log( files );
	if ( cfg.isTempDir ) {
		await fs.ensureDir( cfg.buildFolder );
	}
	await renderAssets( cfg.buildFolder );
	for( let i = 0; i < files.length; i++ ) {
		const dst = cfg.isFile ? path.join( cfg.buildFolder, rename( cfg.dst, false ) ) : path.join( cfg.buildFolder, rename( files[i], false ) );
		saveChordProFileAsHtml( files[i], dst, cfg.columns );
		buildTitles.push( path.basename( dst, path.extname( dst ) ) );
	}
	if ( cfg.isPdf ) {
		return new Promise( resolve => {
			const server = http.createServer( ( request, response ) => {
				return handler( request, response, {
					public: cfg.buildFolder
				} );
			} );
	
			server.listen( cfg.port, async () => {
				const pdfFolder = cfg.isFile ? path.dirname( cfg.dst ) : cfg.dst;
				for( let i = 0; i < buildTitles.length; i++ ) {
					await renderPdf( cfg.port, buildTitles[i], pdfFolder );
				}
				server.close();
				if ( cfg.isTempDir ) {
					fs.remove( cfg.buildFolder );
				}
				return resolve();
			} );
		} );
		
	} else if ( cfg.isTempDir ) {
		fs.remove( cfg.buildFolder );
	}
}

module.exports = { execute };
