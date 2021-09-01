<template>
  <div class="text-center">
    <h6 class="mt-4 mb-4" v-if="name">{{name}}</h6>
    <p class="text-secondary" v-if="account">{{account.transaction.hash}}#{{parseInt(account.progressive).toString(16)}}</p>
    <hr/>

    <div>
      <p class="text-dark">Balance</p>
      <h4 class="text-success">{{balance ? balance : '0'}} Mokas </h4>
      <h4 class="text-danger">{{balanceRed ? balanceRed : '0'}} Mokas </h4>
    </div>

    <hr/>

    <b-button variant="outline-danger" @click="onLogoutClick">Logout</b-button>

  </div>
</template>

<script>
import {RemoteNode} from "hotweb3";
import {EventBus, getSessionPeriod} from "../internal/utils";

export default {
  name: "Home",
  data() {
    return {
      name: null,
      account: null,
      balance: 0,
      balanceRed: 0,
      nonce: 0
    }
  },
  methods: {
    getAccountInfo(accountAddress) {
      EventBus.$emit('showSpinner', true)
      new RemoteNode(this.$blockchainConfig.remoteNodeUrl).getState(accountAddress).then(result => {
        EventBus.$emit('showSpinner', false)

        const updates = result.updates
        updates.forEach(update => {
          if (update.field && update.field.name) {
            if (this.hasOwnProperty(update.field.name)) {
              this[update.field.name] = update.value.value
            }
          }
        })

        this.$browser.storage.local.get('account').then(result => {
          if (result && result.account) {
            result.account.balance = this.balance
            this.$browser.storage.local.set({
              ...result
            })
          }
        })

      }).catch(err => {
        EventBus.$emit('showSpinner', false)
        this.$bvToast.toast("Errore durante il caricamento dell'account", {
          title: 'Account',
          autoHideDelay: 5000,
          variant: 'danger',
          solid: true
        })
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
    this.$browser.storage.local.get('account').then(result => {
      if (result && result.account) {
        this.name = result.account.name
        this.account = result.account.address
        this.getAccountInfo(this.account)
      }
    })
  }
}
</script>

<style scoped>
p {
  word-break: break-word !important;
}
</style>
