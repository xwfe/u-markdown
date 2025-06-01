# u-markdown Build Setup

This repository originally only contained bundled JavaScript and CSS assets. The project now includes a simple build process using TypeScript and Sass.

## Commands

```bash
npm install
npm run build
```

The `build` script compiles TypeScript sources from `src/` into `dist/` and processes Sass styles into `dist/github-markdown.css`.

The HTML in `export-file/index.html` expects the compiled stylesheet at `../dist/github-markdown.css`.
