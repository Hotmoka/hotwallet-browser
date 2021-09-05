export const decorateBrowserObject = (browser) => {

    /**
     * Decorator to safely access of local storage.
     * @param key the key of the object
     * @param resultCallback the callback that will be invoked with the result after the promise finishes.
     * @return void
     */
    browser.getFromStorage = (key, resultCallback) => {
        browser.storage.local.get(key).then(result => {
            if (result && result[key]) {
                resultCallback(result[key])
            } else {
                resultCallback(null)
            }
        }).catch(err => {
            console.error('error while fetching from storage')
            resultCallback(null)
        })
    }

    /**
     * Decorator to safely publish object to local storage.
     * @param obj the object
     * @param resultCallback the optional callback that will be invoked with the result of the commit operation (true/false) after the promise finishes.
     * @return void
     */
    browser.setToStorage = (obj, resultCallback) => {
        browser.storage.local.set({...obj}).then(() => {
            if (resultCallback) {
                resultCallback(true)
            }
        }).catch(err => {
            console.error('error while committing to storage')
            if (resultCallback) {
                resultCallback(false)
            }
        })
    }
}
