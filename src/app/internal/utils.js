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

export const getAuthentication = vue => {
	return new Promise(resolve => {
		vue.$browser.getFromStorage('account', account => {
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
	})
}

export const WrapTask = taskFunc => {

	try {
		EventBus.$emit('showSpinner', true)
		taskFunc()
	} catch (e) {
		EventBus.$emit('showSpinner', false)
	}
}

export const WrapNetworkPromiseTask = (promiseTask, resultFunc) => {

	EventBus.$emit('showSpinner', true)
	promiseTask.then(result => {
		EventBus.$emit('showSpinner', false)
		resultFunc(result, null)
	}).catch(err => {
		EventBus.$emit('showSpinner', false)
		resultFunc(null, err)
	})
}
