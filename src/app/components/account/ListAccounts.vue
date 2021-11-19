<template>
  <div class="content">

    <p>
      Switch to one of your accounts or keys
    </p>

    <b-list-group v-if="accounts && currentAccount">
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
import {EventBus, trimAddress} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import VerifyPasswordModal from "../features/VerifyPasswordModal";
import {Service} from "../../internal/Service";

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
        new Service()
          .switchToAccount(this.selectedAccount, result.password)
          .then(() => replaceRoute('/home'))
          .catch(() => this.resetAccountSelection())
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
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Account list')

    const service = new Service()
    service.getAccounts().then(accounts => this.accounts = accounts)
    service.getCurrentAccount().then(account => this.currentAccount = account)
  }
}
</script>

<style scoped>
.font-small {
  font-size: 15px;
}
</style>