"use strict";

const chordpro = require( "./chordpro" );
const { renderPdf } = require( "./pdf" );
// const html = require( "./html" );
const html = require( "./html" );
const fs = require( "fs-extra" );
const path = require( "path" );
const os = require( "os" );
const sass = require( "node-sass" );

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
	await renderSass( assetsFolder, "tablestyles-columns.scss", "tablestyles-columns.css" );
	await renderSass( assetsFolder, "tablestyles.scss", "tablestyles.css" );
	await fs.copyFile( path.join( __dirname, "assets", "logo.jpg" ), path.join( assetsFolder, "logo.jpg" ) );
}

async function saveChordProFileAsHtml( src, dst, columns ) {
	const text = await fs.readFile( src, "utf8" );
	const chart = chordpro.parse( text );
	const chartHtml = await html.render( chart, { columns } );
	await fs.writeFile( dst, chartHtml, { encoding: "utf8" } );
}

async function execute( config ) {
	const cfg = await validate( config );
	// console.log( cfg );
	const files = cfg.isFolder ? await getAllChordProFiles( cfg.src ) : [ cfg.src ];
	const buildFiles = [];
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
		buildFiles.push( dst );
	}
	if ( cfg.isPdf ) {
		const pdfFolder = cfg.isFile ? path.dirname( cfg.dst ) : cfg.dst;
		console.time( "time" );
		console.log( `rendering pdf${ buildFiles.length > 1 ? "s": "" }...` );
		const files = buildFiles.map( f => {
			const src = `file://${ f }`;
			const dstFileName = path.basename( f, path.extname( f ) ) + ".pdf";
			const dst = path.join( pdfFolder, dstFileName );
			return { src, dst };
		} );
		await renderPdf( files );
		console.timeEnd( "time" );
		if ( cfg.isTempDir ) {
			fs.remove( cfg.buildFolder );
		}
	} else if ( cfg.isTempDir ) {
		fs.remove( cfg.buildFolder );
	}
}

module.exports = { execute };
