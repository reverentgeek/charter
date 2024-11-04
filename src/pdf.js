import puppeteer from "puppeteer";

export const renderPdf = async files => {
	const browser = await puppeteer.launch();
	for( let i = 0; i < files.length; i++ ) {
		const page = await browser.newPage();
		await page.goto( files[i].src );
		await page.pdf( { path: files[i].dst, format: "Letter" } );
	}
	await browser.close();
};
