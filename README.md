# hotwallet browser extension

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

## Add browser extension to chrome
1. Visit chrome://extensions (or menu -> Tools -> Extensions).
2. Enable Developer mode by ticking the checkbox in the upper-right corner.
3. Click on the "Load unpacked extension..." button.
4. Select the directory containing your unpacked extension (directory ```dist``` of project ```hotwallet```)
