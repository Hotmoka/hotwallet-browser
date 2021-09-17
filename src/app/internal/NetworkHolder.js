export class NetworkHolder{

    constructor(storageApi) {
        this.storageApi = storageApi
        this.network_ = {}
    }

    async init() {
        this.network_ = await this.storageApi.getCurrentNetwork()
    }

    set(network) {
        this.network_ = network
    }

    get() {
        return this.network_
    }
}