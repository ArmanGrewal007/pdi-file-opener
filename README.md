<div align="center"><h1>PDI File Opener Extension (VS Code)</h1></div>

This extension is custom-made for MacBooks only (yet)

## Updating extension and testing locally
1. `npm install`
2. Make changes in `src/` folder.
2. run `npm run compile` to convert TS to JS.
3. `npm install -g yo generator-code vsce`.
4. `vsce package` to create the vsix extension.
5. `Cmd + shift + P` to open `Extensions: Install from VSIX`.

## Publishing to Marketplace
```bash
vsce login ArmanGrewal007
# Enter the Personal Access Token which you made from https://dev.azure.com/
# MAKE SURE TO BUMP UP THE VERSION
vsce publish
```

View your extensions at - https://marketplace.visualstudio.com/manage/publishers/armangrewal007 <br>
Extension is live at Marketplace - https://marketplace.visualstudio.com/items?itemName=ArmanGrewal007.pdi-file-opener&ssr=false#review-details