import Vue from 'vue'
import {Base58} from "hotweb3";
import {networks} from "../../internal/constants";


export const EventBus = new Vue()

const showToast = (vue, title, message, type) => {
	vue.$bvToast.toast(message, {
		title: title,
		variant: type,
		solid: true,
		autoHideDelay: 6000,
		toaster: 'b-toaster-top-center'
	})
}

export const showInfoToast = (vue, title, message) => showToast(vue, title, message, 'info')

export const showSuccessToast = (vue, title, message) => showToast(vue, title, message, 'success')

export const showErrorToast = (vue, title, message) => showToast(vue, title, message, 'danger')

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

export const sortNetworks = unsortedNetworks => {

	if (!unsortedNetworks) {
		return []
	}

	const _networks = unsortedNetworks.filter(network => network.value !== 'customNetwork')
	_networks.sort((a, b) => {
		const valueA = a.value.toUpperCase();
		const valueB = b.value.toUpperCase();
		return valueA.localeCompare(valueB)
	})

	// adding the customNetwork as last
	_networks.push(networks[1])
	return _networks
}

export const trimAddress = (address) => {
	if (!address || address.length < 9) {
		return ''
	}
	return address.substring(0, 8) + '...' + address.substring(address.length - 5)
}

export const isPublicKey = (reference) => {
	try {
		return Base58.decode(reference).length === 32
	} catch (e) {
		return false
	}
}

export const isStorageReference = (reference) => {
	try {
		if (reference.indexOf('#') === -1) {
			return reference.length === 64
		} else {
			return reference.split('#')[0].length === 64
		}
	} catch (e) {
		return false
	}
}

/**
 * Helper method to wrap a promise task.
 * @param promiseTask the Promise task
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
