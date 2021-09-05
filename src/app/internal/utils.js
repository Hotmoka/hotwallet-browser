import Vue from 'vue'

export const getSessionPeriod = () => {
	const period = new Date()
	period.setMinutes(period.getMinutes() + 15, period.getSeconds())
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