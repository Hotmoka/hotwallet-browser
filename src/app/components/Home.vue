<template>
  <div class="content text-center">
    <div v-if="account">
      <h6 class="mt-4 mb-4">{{ account.name }}</h6>
      <p class="txt-secondary" v-if="account.reference">
        {{ account.reference.transaction.hash }}#{{ parseInt(account.reference.progressive).toString(16) }}</p>
      <hr/>

      <div v-if="account.balance">
        <p class="text-dark">Balance</p>
        <h4 class="text-success">{{ account.balance }} Mokas </h4>
        <h4 class="text-danger">{{ account.balanceRed ? account.balanceRed : '0' }} Mokas </h4>
      </div>

      <hr/>
      <b-button variant="outline-primary" @click="onEditAccountClick">Edit account</b-button>

      <div class="btn-logout">
        <div class="d-flex justify-content-center">
          <b-button variant="outline-danger" @click="onLogoutClick">Logout</b-button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import {RemoteNode, StorageReferenceModel} from "hotweb3";
import {WrapPromiseTask, showErrorToast} from "../internal/utils";
import {pushRoute, replaceRoute} from "../internal/router";

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
      WrapPromiseTask(async () => {
          return new RemoteNode(this.$blockchainConfig.remoteNodeUrl)
              .getState(StorageReferenceModel.newStorageReference(accountReference.transaction.hash))
      }).then(result => {
        const updates = result.updates
        updates.forEach(update => {
          if (update.field && update.field.name) {
            if (this.account.hasOwnProperty(update.field.name)) {
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

      }).catch(error => {
        showErrorToast(this, 'Account', error.message ? error.message : 'Cannot retrieve account details')
      })
    },
    onLogoutClick() {
      this.account.sessionPeriod = new Date().getTime()
      this.$browser.setToStorage({
        account: {
          ...this.account
        }
      }).then(() => replaceRoute('/login'))
    },
    onEditAccountClick() {
      pushRoute('/edit-account')
    }
  },
  created() {
    this.$browser.getFromStorage('account').then(account => {
      if (account) {
        this.account = {...this.account, ...account}
        this.getAccountInfo(this.account.reference)
      }
    })
  }
}
</script>

<style scoped>
.btn-logout {
  width: 100%;
  position: absolute;
  bottom: 2rem;
  right: 1px;
}
</style>
