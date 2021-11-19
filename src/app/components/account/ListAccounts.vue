<template>
  <div class="content">

    <p>
      Switch to one of your accounts or keys
    </p>

    <b-list-group v-if="accounts && currentAccount">
      <b-list-group-item
                         v-for="(account, index) in accounts"
                         :active="account.publicKey === currentAccount.publicKey"
                          >
        <span style="color: #000; word-break: break-word">
            <b-icon v-if="!account.reference" width="18" icon="key" :variant="account.publicKey === currentAccount.publicKey ? 'text-dark' : 'primary'"></b-icon>
            <b-icon v-if="account.reference" width="18" icon="person" :variant="account.publicKey === currentAccount.publicKey ? 'text-dark' : 'primary'"></b-icon>
          {{ account.name }} {{ trimAccountAddress(account) }}
        </span>
        <br/>
        <span class="text-secondary font-small">{{ account.network.url }}</span>
        <br/>
        <span v-if="!account.reference" class="text-secondary font-small">Waiting for payment to this key</span>

        <div class="d-flex mt-3" v-if="account.publicKey !== currentAccount.publicKey">
          <b-button variant="primary" size="sm" class="flex-fill mr-1" @click="onAccountLoginClick(index)">Login</b-button>
          <b-button variant="danger" size="sm" class="flex-fill ml-1" @click="onAccountRemoveClick(index)">Remove</b-button>
        </div>
      </b-list-group-item>
    </b-list-group>

    <VerifyPasswordModal ref="verifyPasswordComponent" @onPasswordVerified="onPasswordVerified" />
    <AskForConfirmationModal ref="askForConfirmationComponent" @onYes="removeAccount" />
  </div>
</template>

<script>
import {EventBus, showErrorToast, showSuccessToast, trimAddress} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import VerifyPasswordModal from "../features/VerifyPasswordModal";
import AskForConfirmationModal from "../features/AskForConfirmationModal";
import {Service} from "../../internal/Service";

export default {
  name: "ListAccounts",
  components: {VerifyPasswordModal, AskForConfirmationModal},
  data() {
    return {
      selectedAccount: null,
      selectedAccountToRemove: null,
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
          .catch(err => {
            showErrorToast(this, 'Accounts', err.message || 'Cannot switch to the selected account')
            this.resetAccountSelection()
          })
      }
    },
    removeAccount() {
      const accountOrKey = this.selectedAccountToRemove.reference ? 'Account' : 'Key'
      new Service()
        .removeAccount(this.selectedAccountToRemove)
        .then(() => {
          showSuccessToast(this, 'Remove', accountOrKey + ' removed')
          this.resetAccountToRemoveSelection()
          this.getAccounts()
        })
        .catch(() => {
          showErrorToast(this, 'Remove', 'Error while removing the ' + accountOrKey)
          this.resetAccountToRemoveSelection()
        })
    },
    resetAccountSelection() {
      this.selectedAccount = null
    },
    resetAccountToRemoveSelection() {
      this.selectedAccountToRemove = null
    },
    onAccountLoginClick(index) {
      if (this.currentAccount.publicKey !== this.accounts[index].publicKey) {
        this.selectedAccount = this.accounts[index]
        const subtitle = 'Please login with ' + this.selectedAccount.name + ' for the selected ' + (this.selectedAccount.reference ? 'account' : 'key')
        this.$refs.verifyPasswordComponent.showModal({account: this.selectedAccount, title: 'Login', subtitle: subtitle})
      }
    },
    onAccountRemoveClick(index) {
      if (this.currentAccount.publicKey !== this.accounts[index].publicKey) {
        this.selectedAccountToRemove = this.accounts[index]
        const options = {
          title: 'Remove account',
          subtitle: 'Are you sure you want to remove the ' + (this.selectedAccountToRemove.reference ? 'account ' : 'key ') + this.selectedAccountToRemove.name + ' ?',
        }
        this.$refs.askForConfirmationComponent.showModal(options)
      }
    },
    getAccounts() {
      new Service()
          .getAccounts()
          .then(accounts => this.accounts = accounts)
          .catch(() => showErrorToast(this, 'Accounts', 'Cannot retrieve the accounts'))
    },
    getCurrentAccount() {
      new Service()
          .getCurrentAccount()
          .then(account => this.currentAccount = account)
          .catch(error => showErrorToast(this, 'Account', error.message || 'Cannot retrieve account'))
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Account list')

    this.getCurrentAccount()
    this.getAccounts()
  }
}
</script>

<style scoped>
.font-small {
  font-size: 15px;
}
.list-group-item.active {
  background-color: #eee;
  border: 1px solid rgba(0, 0, 0, 0.125);
}
</style>