<template>
  <div class="header">
      <img src="../assets/img/hotmoka_logo.png" height="32" width="32" alt="hotmoka" @click="onHeaderImageClick">
      <h6 class="hotwallet-title text-secondary">Hotwallet</h6>
      <b-form-select
          v-model="selectedNetwork"
          @change="onNetworkChange"
          :options="networks"
          :disabled="networkSelectionDisabled"
          size="sm"
          class="ml-auto h-network"></b-form-select>

    <b-modal v-model="customNetwork.showModal" centered :hideHeaderClose="true" title="Custom network">
      <p>Connect to a custom network</p>

      <b-form-group
          id="i-name"
          label="Name"
          label-for="i-name"
      >
        <b-form-input type="text" id="i-name" v-model="customNetwork.form.name" placeholder="Network name" trim></b-form-input>
      </b-form-group>

      <b-form-group
          id="i-url"
          label="Url"
          label-for="i-url"
          :invalid-feedback="invalidFeedbackUrl"
          :state="stateUrl"
      >
        <b-form-input type="text" id="i-url" v-model="customNetwork.form.url" :state="stateUrl" placeholder="Url with protocol" trim></b-form-input>
      </b-form-group>

      <template #modal-footer>
        <b-button @click="onCancelConnectionClick" variant="secondary">Cancel</b-button>
        <b-button @click="onConnectToCustomNetworkClick" variant="primary" :disabled="!stateUrl">Connect</b-button>
      </template>

    </b-modal>
  </div>
</template>

<script>
import {EventBus, showErrorToast, WrapPromiseTask} from "../internal/utils";
import {getNetwork} from "../internal/networks";
import {stateFieldNotEmpty} from "../internal/validators";

export default {
  name: "Header",
  data() {
    return {
      customNetwork: {
        showModal: false,
        form: {
          url: null,
          name: null
        }
      },
      networkSelectionDisabled: false,
      selectedNetwork: null,
      networks: []
    }
  },
  watch: {
    $route(to, from) {
      if (to && to.path) {
        this.networkSelectionDisabled = to.path !== '/home' && to.path !== '/welcome'
      }
    }
  },
  computed: {
    stateUrl() {
      return stateFieldNotEmpty(this.customNetwork.form.url) && (this.customNetwork.form.url.startsWith('http://') || this.customNetwork.form.url.startsWith('https://'))
    },
    invalidFeedbackUrl() {
      if (this.customNetwork.form.url === null) {
        return null
      }
      if (this.customNetwork.form.url.length === 0) {
        return 'Url cannot be empty'
      }
      if (!this.customNetwork.form.url.startsWith('http://') || !this.customNetwork.form.url.startsWith('https://')) {
        return 'Url must begin with http:// or https://'
      }
      return null
    }
  },
  methods: {
    onCancelConnectionClick() {
      this.customNetwork.showModal = false
      this.customNetwork.form.url = null
      // restore old network
      this.selectedNetwork = this.$network.value
    },
    onConnectToCustomNetworkClick() {
      this.customNetwork.showModal = false

      WrapPromiseTask(async () => {
        const splittedUrl = this.customNetwork.form.url.split("://")
        const networkName = this.customNetwork.form.name && this.customNetwork.form.name.length > 0 ? this.customNetwork.form.name : null

        const network = {
          url: this.customNetwork.form.url,
          protocol: splittedUrl[0],
          text: networkName ? networkName : splittedUrl[1],
          value: networkName ? networkName + '_' + splittedUrl[1] : splittedUrl[1]
        }

        const networkAdded = await this.$storageApi.addNetwork(network)
        if (!networkAdded) {
          throw new Error('Cannot add network')
        }

        const committed = await this.$storageApi.setNetwork(network)
        if (!committed) {
          throw new Error('Cannot set network')
        }

        // reinit store
        if (this.$route.path === '/home') {
          await this.$storageApi.reinitStore()
        }

        return network
      })
      .then(network => {
        this.customNetwork.form.url = null
        this.networks.push(network)
        this.selectedNetwork = network.value
        this.$network = network

        if (this.$route.path === '/home') {
          EventBus.$emit('reloadAccount')
        }
      })
      .catch(error => {
        this.customNetwork.form.url = null
        showErrorToast(this,'Custom network connection', error.message ? error.message : 'Cannot connect to custom network')
        // restore previous network
        this.selectedNetwork = this.$network.value
        if (this.$route.path === '/home') {
          EventBus.$emit('reloadAccount')
        }
      })
    },
    setNetworks: async function() {
      const _networks = await this.$storageApi.getNetworks()
      this.networks = [..._networks]

      const currentNetwork = await this.$storageApi.getNetwork(this.$network)
      this.selectedNetwork = currentNetwork.value
      this.$network = currentNetwork
    },
    onNetworkChange(selectedNetwork) {

      if (selectedNetwork === 'customNetwork') {
        this.customNetwork.showModal = true

      } else {
        const network = getNetwork(selectedNetwork, this.networks)
        if (!network) {
          showErrorToast(this,'Network', 'Network not found')
        } else {

          WrapPromiseTask(() => this.$storageApi.setNetwork(network))
          .then(result => {
            if (result) {
              this.selectedNetwork = selectedNetwork
              this.$network = network

              if (this.$route.path === '/home') {
                EventBus.$emit('reloadAccount')
              }

            } else {
              showErrorToast(this,'Network', 'Cannot set network')
            }
          })
          .catch(() => showErrorToast(this,'Network', 'Cannot set network'))
        }
      }
    },
    onHeaderImageClick() {
      if (this.$route.path === '/home') {
        this.$router.go()
      } else {

      }
    }
  },
  created() {
    this.networkSelectionDisabled = this.$route.path !== '/home' && this.$route.path !== '/welcome'
    this.setNetworks()
  }
}
</script>

<style scoped>

.header {
  height: 62px;
  display: flex;
  align-items: center;
  background-color: rgba(186, 239, 233, 0.2);
  padding: 1rem
}

.header img {
  margin-right: 12px;
  cursor: pointer;
}

.h-network {
  width: auto !important;
}

.hotwallet-title {
  margin-right: 12px;
  margin-bottom: 2px;
}

</style>