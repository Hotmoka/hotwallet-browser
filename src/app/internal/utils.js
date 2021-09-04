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
		toaster: 'b-toaster-top-center'
	})
}