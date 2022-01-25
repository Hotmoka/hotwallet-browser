<template>
  <b-form-group
      id="i-network"
      label="Network"
      label-for="i-network"
  >
    <b-form-select
        id="i-network"
        v-model="selectedNetwork"
        @change="onNetworkChange"
        :options="networks"
        class="ml-auto h-network" />

    <CustomNetworkModal
        ref="customNetworkModal"
        @onConnected="onConnectedToCustomNetwork"
        @onCancel="onCancelConnectionToCustomNetwork" />
  </b-form-group>
</template>

<script>
import {showErrorToast} from "../../internal/utils";
import CustomNetworkModal from "./CustomNetworkModal";

export default {
  name: "NetworkSelect",
  components: {CustomNetworkModal},
  data() {
    return {
      defaultAddCustomNetwork: {
        value: 'customNetwork',
        text: 'Add custom network'
      },
      selectedNetwork: null,
      networks: []
    }
  },
  methods: {
    onConnectedToCustomNetwork(network) {
      this.networks[this.networks.length - 1] = network
      this.networks.push(this.defaultAddCustomNetwork)
      this.selectedNetwork = network.value
      this.onNetworkChange()
    },
    onCancelConnectionToCustomNetwork() {
      this.selectedNetwork = this.networks[0].value
      this.onNetworkChange()
    },
    onNetworkChange() {
      if (this.selectedNetwork === this.defaultAddCustomNetwork.value) {
        this.$refs.customNetworkModal.showModal()
      }
    },
    getSelectedNetwork() {
      const networks = this.networks.filter(network => network.value === this.selectedNetwork)
      return networks.length > 0 ? networks[0] : null
    },
    initNetworks: async function() {
      try {
        this.networks = await this.$storageApi.getNetworks()
        this.networks.push(this.defaultAddCustomNetwork)
        this.selectedNetwork = this.networks[0].value
      } catch (e) {
        showErrorToast(this, 'Network', 'Error while loading networks')
      }
    }
  },
  created() {
    this.initNetworks()
  }
}
</script>

<style scoped>

</style>