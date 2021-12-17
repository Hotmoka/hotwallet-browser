# hotwallet-browser

A wallet for the Hotmoka blochain available as a browser extension for Chrome and Firefox. 

## Project setup
```
npm install
```

### Compiles and hot-reloads for development (only for Chrome)
```
npm run watch:dev
```

### Compiles and minifies for production
```
npm run build
```

### Zip browser extension
```
npm run build-zip
```

## Add browser extension to Chrome
1. Visit chrome://extensions (or menu -> Tools -> Extensions).
2. Enable Developer mode by ticking the checkbox in the upper-right corner.
3. Click on the "Load unpacked extension..." button.
4. Select the directory containing your unpacked extension (directory ```dist``` of project ```hotwallet-browser```)

## Add browser extension to Firefox
1. Visit about:debugging
2. Click "This Firefox" on the left panel
3. Click "Load temporary Add-on..." button
4. Select "manifest.json" from the directory containing your unpacked extension (directory ```dist``` of project ```hotwallet-browser```)
