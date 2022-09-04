# Url to Docs 🗄️

A simple web crawler with a cli suitable for downloading online html
documentation.

Intended to be used with [docs-to-prose](https://github.com/johnschoeman/docs-to-prose)

## Usage

### Install the cli

```
npm install -g url-to-docs
```

### Convert a url to a folder of docs

```
urltodocs --url https://example.com/docs/file1.html
```

This will download files starting with `file1.html` following any relative links
within the same domain.
