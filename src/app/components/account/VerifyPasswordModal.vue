<template>
  <b-modal v-model="modal.showModal" centered :hideHeaderClose="true" :title="modal.title">
    <p>{{ modal.subtitle }}</p>
    <div class="text-left form-container">
      <b-form-group
          id="i-pwd"
          label="Password"
          label-for="i-pwd"
          :invalid-feedback="invalidFeedback"
          :state="state"
      >
        <b-form-input type="password" id="i-pwd" v-model="password" :state="state" @keydown.enter.native="onVerifyPasswordClick" trim></b-form-input>
      </b-form-group>
    </div>

    <template #modal-footer>
      <b-button @click="onCancelClick()" variant="secondary">Cancel</b-button>
      <b-button @click="onVerifyPasswordClick()" variant="primary" :disabled="!state">{{ modal.btnActionName }}</b-button>
    </template>

  </b-modal>
</template>

<script>
import {invalidPasswordFeedback, statePassword} from "../../internal/validators";
import {showErrorToast, WrapPromiseTask} from "../../internal/utils";
import {AccountHelper, Bip39Dictionary} from "hotweb3";

export default {
  name: "VerifyPasswordModal",
  data() {
    return {
      account: null,
      password: null,
      modal: {
        showModal: false,
        title: '',
        subtitle: '',
        btnActionName: '',
        closeOnIncorrectPwd: true
      }
    }
  },
  computed: {
    state() {
      return statePassword(this.password)
    },
    invalidFeedback() {
      return invalidPasswordFeedback(this.password)
    }
  },
  methods: {
    showModal(options) {
      this.account = {...options.account}
      this.modal.title = options.title
      this.modal.subtitle = options.subtitle
      this.modal.btnActionName = options.btnActionName ? options.btnActionName : 'Login'
      this.modal.closeOnIncorrectPwd = options.closeOnIncorrectPwd !== undefined ? options.closeOnIncorrectPwd : true
      this.modal.showModal = true
    },
    closeModal() {
      this.modal.showModal = false
      this.account = null
      this.password = null
    },
    onCancelClick() {
      this.$emit('onCancel')
      this.closeModal()
    },
    onVerifyPasswordClick() {
      if (!this.state) {
        return
      }
      WrapPromiseTask(async () => {

        // verify account
        const publicKeyVerified = AccountHelper.verifyPublicKey(
            this.password,
            this.account.entropy,
            Bip39Dictionary.ENGLISH,
            this.account.publicKey
        )

        return publicKeyVerified

      }).then(publicKeyVerified => {
        if (!publicKeyVerified) {
          showErrorToast(this, 'Login', 'Incorrect password')
        }
        this.$emit('onPasswordVerified', {
          verified: publicKeyVerified,
          password: this.password.slice()
        })
        if (publicKeyVerified || this.modal.closeOnIncorrectPwd) {
          this.closeModal()
        }
      }).catch(err => {
        showErrorToast(this, 'Login', err.message ? err.message : 'Cannot verify account')
        this.closeModal()
        this.$emit('onPasswordVerified', {
          error: err.message ? err.message : 'Cannot verify account'
        })
      })
    }
  }
}
</script>

<style scoped>

</style>