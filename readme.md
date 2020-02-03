# Charter

> Note: _Work in Progress_

Turns `.chordpro` files into formatted HTML chord charts and renders them to PDF.

## Setup

To convert HTML files to PDF, you will need to [wkhtmltopdf](https://wkhtmltopdf.org/) installed on your system. For macOS, you can install this with [Homebrew](https://brew.sh/) using:

```sh
brew cask install wkhtmltopdf
```

### Install Dependencies

Before you can use the source code, you will need to install dependencies. From the source code folder, run the following command.

```sh
npm install
```

## Usage

Put your `.chordpro` files in the `charts` folder and run in your terminal:

```sh
node .
```

HTML and PDF files will be generated in the same `charts` folder.
