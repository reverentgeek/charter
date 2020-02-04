# Charter

Turns `.chordpro` files into formatted HTML chord charts and renders them to PDF.

## Requirements

To use this application, you will need [Node.js](https://nodejs.org/) version 12 or higher, and [wkhtmltopdf](https://wkhtmltopdf.org/) installed on your system and in your system path. For macOS, you can install this with [Homebrew](https://brew.sh/) using:

```sh
brew cask install wkhtmltopdf
```

## Setup

1. Clone or download and unzip the source code.
2. Open your terminal or command prompt and change to the source code folder.
3. Install dependencies

```sh
npm install
```

## Usage

You can use this application to view `.chordpro` files as HTML in the browser and convert them to PDF. A sample ChordPro file is included in the source code.

### Converting ChordPro files to PDF

Put your `.chordpro` files in the `charts` folder and run in your terminal:

```sh
npm run start
```

HTML files will be generated in the `build` folder, and PDF files can be found in the `pdf` folder.

### Viewing ChordPro files as HTML

Put your `.chordpro` files in the `charts` folder and run the following in your terminal.

```sh
npm run serve
```

In your browser, navigate to `http://localhost:3000`.

While running, any changes made to `.chordpro` files will be detected and the HTML is rebuilt. Refresh the browser page to see any changes.

> Note: To stop the local web server, go to the terminal window and press `CTRL+C`.
