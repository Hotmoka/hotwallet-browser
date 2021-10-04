<template>
  <div class="content">
    <h6 class="mb-4 text-center">Account list</h6>

    <b-list-group>
      <b-list-group-item button
                         v-for="(account, index) in accounts"
                         :active="account.publicKey === currentAccount.publicKey"
                          @click="onAccountClick(index)">
        <span style="color: #000; word-break: break-word">
            <b-icon v-if="!account.reference" width="18" icon="key" :variant="account.publicKey === currentAccount.publicKey ? 'text-dark' : 'primary'"></b-icon>
            <b-icon v-if="account.reference" width="18" icon="person" :variant="account.publicKey === currentAccount.publicKey ? 'text-dark' : 'primary'"></b-icon>
          {{ account.name }} {{ trimAccountAddress(account) }}
        </span>
        <br/>
        <span class="text-secondary font-small">{{ account.network.url }}</span>
        <br/>
        <span v-if="!account.reference" class="text-secondary font-small">Waiting for payment to this key</span>
      </b-list-group-item>
    </b-list-group>

    <VerifyPasswordModal ref="verifyPasswordComponent" @onPasswordVerified="onPasswordVerified"></VerifyPasswordModal>
  </div>
</template>

<script>
import {EventBus, showErrorToast, trimAddress, WrapPromiseTask} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import VerifyPasswordModal from "./VerifyPasswordModal";
export default {
  name: "ListAccounts",
  components: {VerifyPasswordModal},
  data() {
    return {
      selectedAccount: null,
      accounts: [],
      currentAccount: null
    }
  },
  methods: {
    trimAccountAddress(account) {
      return !account.reference ? "" : " - " + trimAddress(account.reference)
    },
    onPasswordVerified(result) {
      if (result.verified) {
        WrapPromiseTask(async () => {

          // set new password
          await this.$storageApi.setPassword(result.password)
          await this.$storageApi.setAccountAuth(this.selectedAccount, true)
          await this.$storageApi.selectNetwork(this.selectedAccount.network)
          const currentNetwork = await this.$storageApi.getCurrentNetwork()
          this.$network.set(currentNetwork)

          // notify network change
          EventBus.$emit('networkChange', currentNetwork)

        }).then(() => replaceRoute('/home'))
          .catch(err => {
              this.resetAccountSelection()
              showErrorToast(this, 'Accounts', err.message ? err.message : 'Cannot switch to the selected account')
          })
      }
    },
    resetAccountSelection() {
      this.selectedAccount = null
    },
    onAccountClick(index) {
      if (this.currentAccount.publicKey !== this.accounts[index].publicKey) {
        this.selectedAccount = this.accounts[index]
        const subtitle = 'Please login with ' + this.selectedAccount.name + ' for the selected ' + (this.selectedAccount.reference ? 'account' : 'key')
        this.$refs.verifyPasswordComponent.showModal({account: this.selectedAccount, title: 'Login', subtitle: subtitle})
      }
    },
    getAccounts() {
      WrapPromiseTask(async () => {
        const currentAccount = await this.$storageApi.getCurrentAccount(this.$network.get())
        const accounts = await this.$storageApi.getAccounts()

        return {currentAccount, accounts}
      })
      .then(result => {
        this.currentAccount = result.currentAccount
        this.accounts = result.accounts
      })
      .catch(() => showErrorToast(this, 'Accounts','Cannot retrieve the accounts'))
    }
  },
  created() {
    this.getAccounts()
  }
}
</script>

<style scoped>
.font-small {
  font-size: 15px;
}
</style>