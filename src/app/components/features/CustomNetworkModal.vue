<template>
  <b-modal v-model="modal.show" centered :hideHeaderClose="true" title="Custom network">
    <p>Connect to a custom network</p>

    <b-form-group
        id="i-name"
        label="Name"
        label-for="i-name"
    >
      <b-form-input type="text" id="i-name" v-model="modal.form.name" placeholder="Network name" trim></b-form-input>
    </b-form-group>

    <b-form-group
        id="i-url"
        label="Url"
        label-for="i-url"
        :invalid-feedback="invalidFeedbackUrl"
        :state="stateUrl"
    >
      <b-form-input type="text" id="i-url" v-model="modal.form.url" :state="stateUrl" placeholder="Url with protocol" trim></b-form-input>
    </b-form-group>

    <template #modal-footer>
      <b-button @click="onCancelConnectionClick" variant="secondary">Cancel</b-button>
      <b-button @click="onConnectToCustomNetworkClick" variant="primary" :disabled="!stateUrl">Connect</b-button>
    </template>

  </b-modal>
</template>

<script>
import {Service} from "../../internal/Service";
import {showErrorToast} from "../../internal/utils";
import {validator} from "../../internal/mixins";

export default {
  name: "CustomNetworkModal",
  mixins: [validator],
  data() {
    return {
      modal: {
        show: false,
        form: {
          url: null,
          name: null
        }
      }
    }
  },
  computed: {
    stateUrl() {
      return this.stateFieldNotEmpty(this.modal.form.url) && (this.modal.form.url.startsWith('http://') || this.modal.form.url.startsWith('https://'))
    },
    invalidFeedbackUrl() {
      if (this.modal.form.url === null) {
        return null
      }
      if (this.modal.form.url.length === 0) {
        return 'Url cannot be empty'
      }
      if (!this.modal.form.url.startsWith('http://') || !this.modal.form.url.startsWith('https://')) {
        return 'Url must begin with http:// or https://'
      }
      return null
    }
  },
  methods: {
    showModal() {
      this.modal.show = true
    },
    onCancelConnectionClick() {
      this.modal.show = false
      this.resetForm()
      this.$emit('onCancel')
    },
    onConnectToCustomNetworkClick() {
      this.modal.show = false
      new Service()
          .connectToNetwork(this.modal.form.url, this.modal.form.name)
          .then(network => {
            this.resetForm()
            this.$emit('onConnected', network)
          })
          .catch(() => {
            this.resetForm()
            showErrorToast(this, 'Custom network connection', 'Cannot connect to custom network')
          })
    },
    resetForm() {
      this.modal.form = {
        url: null,
        name: null
      }
    }
  }
}
</script>

<style scoped>

</style>