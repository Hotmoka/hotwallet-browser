import Vue from 'vue'

export const getSessionPeriod = () => {
	const period = new Date()
	period.setMinutes(period.getMinutes() + 30, period.getSeconds())
	return period.getTime()
}

export const EventBus = new Vue()

export const showInfoToast = (vue, title, message) => {
	vue.$bvToast.toast(message, {
		title: title,
		variant: 'info',
		solid: true,
		autoHideDelay: 1500,
		toaster: 'b-toaster-top-center'
	})
}

export const showErrorToast = (vue, title, message) => {
	vue.$bvToast.toast(message, {
		title: title,
		variant: 'danger',
		solid: true,
		autoHideDelay: 1500,
		toaster: 'b-toaster-top-center'
	})
}

/**
 * Returns the an authentication object.
 * @param vue the vue instance
 * @return {Promise<unknown>} a promise that resolves to an authentication object
 */
export const getAuthentication = vue => {
	return new Promise(resolve => {
		vue.$browser.getFromStorage('account').then(account => {
			const result = {
				authenticated: false,
				hasAccount: false
			}

			if (account) {
				result.hasAccount = true
				if (account.sessionPeriod && new Date() <= new Date(account.sessionPeriod)) {
					result.authenticated = true
				}
			}
			resolve(result)
		})
	}).catch(err => console.error(err))
}

/**
 * Helper method to wrap a promise task.
 * @param promiseTask the promise task
 * @return {Promise<unknown>} a promise that resolves to the result of the promise task
 */
export const WrapPromiseTask = (promiseTask) => {
	return new Promise((resolve, reject) => {

		EventBus.$emit('showSpinner', true)
		Promise.resolve(promiseTask())
			.then(result => {
				EventBus.$emit('showSpinner', false)
				resolve(result)
			})
			.catch(err => {
				EventBus.$emit('showSpinner', false)
				reject(err)
			})
	})
}

