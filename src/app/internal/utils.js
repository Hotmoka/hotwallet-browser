import Vue from 'vue'
import {networks} from "../../internal/constants";
import {StorageReferenceModel} from "hotweb3";


export const EventBus = new Vue()

const showToast = (vue, title, message, type, timeout) => {
	vue.$bvToast.toast(message, {
		title: title,
		variant: type,
		solid: true,
		autoHideDelay: timeout || 6000,
		toaster: 'b-toaster-top-center'
	})
}

export const showInfoToast = (vue, title, message, timeout) => showToast(vue, title, message, 'info', timeout)

export const showSuccessToast = (vue, title, message, timeout) => showToast(vue, title, message, 'success', timeout)

export const showErrorToast = (vue, title, message, timeout) => showToast(vue, title, message, 'danger', timeout)

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

export const storageReferenceFrom = reference => {
	if (!StorageReferenceModel.isStorageReference(reference)) {
		throw new Error('Invalid storage reference')
	}
	const splitted = reference.split("#")
	const hash = splitted[0].trim()
	const progressive = splitted[1].trim()

	return StorageReferenceModel.newStorageReference(hash, progressive)
}

export const storageReferenceToString = storageReference => {
	return storageReference.transaction.hash + '#' + parseInt(storageReference.progressive, 16).toString()
}

export const getHashOfStorageReference = storageReference => {
	return storageReference.split("#")[0]
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
