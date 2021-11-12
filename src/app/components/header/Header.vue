<template>
  <div class="header">
      <img src="../../assets/img/hotmoka_logo.png" height="32" width="32" alt="hotmoka" @click="onHeaderImageClick">
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
import {EventBus, showErrorToast, sortNetworks} from "../../internal/utils";
import {stateFieldNotEmpty} from "../../internal/validators";
import {replaceRoute} from "../../internal/router";
import {Service} from "../../internal/Service";

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
    resetForm() {
      this.customNetwork.showModal = false
      this.customNetwork.form.url = null
      this.customNetwork.form.name = null
    },
    onCancelConnectionClick() {
      this.resetForm()
      // restore old network
      this.selectedNetwork = this.$network.get().value
    },
    onConnectToCustomNetworkClick() {
      this.customNetwork.showModal = false

      new Service()
          .connectToNetwork(this.customNetwork.form.url, this.customNetwork.form.name)
          .then(network => {
            this.resetForm()
            this.$network.set(network)
            this.networks.push(network)
            this.networks = sortNetworks(this.networks)
            this.selectedNetwork = network.value
            replaceRoute('/')
          })
          .catch(error => {
            this.resetForm()
            showErrorToast(this, 'Custom network connection', error.message || 'Cannot connect to custom network')

            // restore previous network
            this.selectedNetwork = this.$network.get().value
            if (this.$route.path === '/home') {
              EventBus.$emit('reloadAccount')
            }
          })
    },
    onNetworkChange(selectedNetwork) {
      if (this.networkSelectionDisabled) {
        showErrorToast(this, 'Network', 'Option disabled')
        return
      }

      if (selectedNetwork === 'customNetwork') {
        this.customNetwork.showModal = true
      } else {
        new Service()
            .changeNetwork(selectedNetwork, this.networks)
            .then(result => {
              this.$network.set(result.network)
              this.selectedNetwork = result.network.value

              if (result.newAccount) {
                replaceRoute('/')
              } else if (this.$route.path === '/home') {
                EventBus.$emit('reloadAccount')
              }
            })
      }
    },
    onHeaderImageClick() {
      if (this.$route.path.indexOf('/transaction') !== -1) {
        return
      }

      if (this.$route.path === '/home') {
        EventBus.$emit('reloadAccount')
      } else {
        replaceRoute('/home')
      }
    },
    setNetworks: async function () {
      try {
        const _networks = await this.$storageApi.getNetworks()
        this.networks = sortNetworks(_networks)
        const currentNetwork = await this.$storageApi.getCurrentNetwork()
        this.$network.set(currentNetwork)
        this.selectedNetwork = currentNetwork.value
      } catch (e) {
        showErrorToast(this, 'Network', 'Network error')
      }
    }
  },
  created() {
    EventBus.$on('networkChange', network => this.selectedNetwork = network.value)
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