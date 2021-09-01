import Vue from 'vue'

export const getSessionPeriod = () => {
	const period = new Date()
	period.setMinutes(period.getMinutes() + 15, period.getSeconds())
	return period.getTime()
}

export const EventBus = new Vue()
