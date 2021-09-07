export const decorateBrowserObject = (browser) => {

    /**
     * Decorator to safely retrieve an object from local storage.
     * @param key the key of the object
     * @return Promise<unknown> a promise that resolves to the object result
     */
    browser.getFromStorage = key => {
        return new Promise(resolve => {
            browser.storage.local.get(key).then(result => {
                if (result && result[key]) {
                    resolve(result[key])
                } else {
                    resolve(null)
                }
            }).catch(err => {
                console.error('error while fetching from storage', err)
                resolve(null)
            })
        }).catch(err => console.error(err))
    }

    /**
     * Decorator to safely publish an object to local storage.
     * @param obj the object
     * @return <Promise<boolean> a promise that resolves to the result of the operation
     */
    browser.setToStorage = obj => {
        return new Promise(resolve => {
            browser.storage.local.set({...obj}).then(() => {
               resolve(true)
            }).catch(err => {
                console.error('error while committing to storage', err)
                resolve(false)
            })
        }).catch(err => console.error(err))
    }
}
