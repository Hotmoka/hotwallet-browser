<template>
  <div class="content">

    <div class="w-100 text-right">
      <b-button variant="primary" @click="onAddNetworkCLick">Add custom network</b-button>
    </div>

    <b-list-group v-if="networks" class="mt-4">
      <b-list-group-item
          v-for="(network, index) in networks"
          :active="currentNetwork.value === network.value"
      >

        <span style="color: #000; word-break: break-word">
            <b-icon width="18" icon="globe"></b-icon>
            {{ network.url }}
        </span>

        <br/>

        <div class="d-flex mt-3" v-if="currentNetwork.value !== network.value">
          <b-button variant="primary" size="sm" class="flex-fill mr-1" @click="ontSelectNetworkCLick(index)">Select</b-button>
          <b-button variant="danger" size="sm" class="flex-fill ml-1" @click="onRemoveNetworkClick(index)">Remove</b-button>
        </div>

      </b-list-group-item>
    </b-list-group>

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
import {Service} from "../../internal/Service";
import {replaceRoute} from "../../internal/router";
import {validator} from "../../internal/mixins";

export default {
  name: "Network",
  mixins: [validator],
  data() {
    return {
      networks: [],
      currentNetwork: {value: ''},
      customNetwork: {
        showModal: false,
        form: {
          url: null,
          name: null
        }
      },
    }
  },
  computed: {
    stateUrl() {
      return this.stateFieldNotEmpty(this.customNetwork.form.url) && (this.customNetwork.form.url.startsWith('http://') || this.customNetwork.form.url.startsWith('https://'))
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
      this.currentNetwork = this.$network.get()
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
            this.currentNetwork = network
            replaceRoute('/')
          })
          .catch(error => {
            this.resetForm()
            showErrorToast(this, 'Custom network connection', error.message || 'Cannot connect to custom network')

            // restore previous network
            this.currentNetwork = this.$network.get()
            if (this.$route.path === '/home') {
              EventBus.$emit('reloadAccount')
            }
          })
    },
    onNetworkChange(selectedNetwork) {
      if (selectedNetwork === 'customNetwork') {
        this.customNetwork.showModal = true
      } else {
        new Service()
            .changeNetwork(selectedNetwork, this.networks)
            .then(result => {
              this.$network.set(result.network)
              this.currentNetwork = result.network

              if (result.newAccount) {
                replaceRoute('/')
              } else if (this.$route.path === '/home') {
                EventBus.$emit('reloadAccount')
              }
            })
            .catch(e => showErrorToast(this, 'Network', e.message || 'Cannot set network'))
      }
    },
    onAddNetworkCLick() {
      this.customNetwork.showModal = true
    },
    onRemoveNetworkClick(index) {

    },
    ontSelectNetworkCLick(index) {

    },
    setNetworks: async function () {
      try {
        const _networks = await this.$storageApi.getNetworks()
        this.networks = sortNetworks(_networks)
        this.currentNetwork = await this.$storageApi.getCurrentNetwork()
      } catch (e) {
        showErrorToast(this, 'Network', 'Network error')
      }
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Networks')
    this.setNetworks()
  }
}
</script>

<style scoped>
.list-group-item.active {
  background-color: #eee;
  border: 1px solid rgba(0, 0, 0, 0.125);
}
</style>