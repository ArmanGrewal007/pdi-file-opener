<div align="center"><h1>PDI File Opnener Extension (VS Code)</h1></div>

This extension is custom-made for MacBooks only (yet)

## Using the extension
1. `npm install`


## Updating extension and testing locally
1. Make changes in `src/` folder.
2. run `npm run compile` to convert TS to JS.
3. `npm install -g yo generator-code vsce`.
4. `vsce package` to create the vsix extension.
5. `Cmd + shift + P` to open `Extensions: Install from VSIX`.