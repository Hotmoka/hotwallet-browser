<template>
  <div class="content text-center">
    <div v-if="account">
      <h6 class="mt-4 mb-4">{{ account.name }}</h6>
      <p class="address" v-if="account.reference">
        {{ account.reference.transaction.hash }}#{{ parseInt(account.reference.progressive).toString(16) }}</p>
      <hr/>

      <div v-if="account.balance">
        <p class="text-dark">Balance</p>
        <h4 class="text-success">{{ account.balance }} Mokas </h4>
        <h4 class="text-danger">{{ account.balanceRed ? account.balanceRed : '0' }} Mokas </h4>
      </div>

      <hr/>

      <b-button variant="outline-danger" @click="onLogoutClick">Logout</b-button>
    </div>
  </div>
</template>

<script>
import {RemoteNode, StorageReferenceModel} from "hotweb3";
import {EventBus, showErrorToast} from "../internal/utils";

export default {
  name: "Home",
  data() {
    return {
      account: {
        balance: 0,
        balanceRed: 0,
        nonce: 0
      }
    }
  },
  methods: {
    getAccountInfo(accountReference) {
      EventBus.$emit('showSpinner', true)
      new RemoteNode(this.$blockchainConfig.remoteNodeUrl).getState(StorageReferenceModel.newStorageReference(accountReference.transaction.hash)).then(result => {
        EventBus.$emit('showSpinner', false)

        const updates = result.updates
        updates.forEach(update => {
          if (update.field && update.field.name) {
            if (this.account.hasOwnProperty(update.field.name)) {
              console.log('updating', update.field.name)
              this.account[update.field.name] = update.value.value
            }
          }
        })

        this.$browser.setToStorage({
          account: {
            ...this.account,
            balance: this.account.balance,
            balanceRed: this.account.balanceRed
          }
        })

        console.log('setting to storage')
      }).catch(err => {
        EventBus.$emit('showSpinner', false)
        showErrorToast(this, 'Account', 'Cannot retrieve account details')
      })
    },
    onLogoutClick() {
      this.$browser.storage.local.get('account').then(result => {
        if (result && result.account) {
          result.account.sessionPeriod = new Date().getTime()
          this.$browser.storage.local.set({
            ...result
          }).then(() => {
            this.$router.replace("/login")
          })
        }
      })
    }
  },
  created() {
    this.$browser.getFromStorage('account', account => {
      if (account) {
        this.account = {...this.account, ...account}
        console.log('this,', this.account)
        this.getAccountInfo(this.account.reference)
      }
    })
  }
}
</script>

<style scoped>
</style>
