import Vue from 'vue'

export const EventBus = new Vue()

export const showInfoToast = (vue, title, message) => {
	vue.$bvToast.toast(message, {
		title: title,
		variant: 'info',
		solid: true,
		autoHideDelay: 2000,
		toaster: 'b-toaster-top-center'
	})
}

export const showErrorToast = (vue, title, message) => {
	vue.$bvToast.toast(message, {
		title: title,
		variant: 'danger',
		solid: true,
		autoHideDelay: 2000,
		toaster: 'b-toaster-top-center'
	})
}

export const getNetworkByValue = (value, networks) => {
	if (!networks) {
		return null
	}

	const _networks = networks.filter(network => network.value === value)
	if (_networks.length > 0) {
		return _networks[0]
	} else {
		return null
	}
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
