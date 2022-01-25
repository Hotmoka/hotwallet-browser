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

        <div class="account-container">
          {{ account.name }}
        </div>

        <div class="d-flex align-items-center account-container mt-1">
          <b-icon v-if="!account.reference" width="18" icon="key" variant="primary"/>
          <b-icon v-if="account.reference" width="18" icon="person" variant="primary"/>
          <p v-if="account.reference">{{ trimAccountAddress(account.reference) }}</p>
          <p v-if="!account.reference">{{ trimAccountAddress(account.publicKeyBase58) }}</p>
          <span class="copy-container"><b-icon width="18" variant="info" icon="clipboard" @click="copyToClipboard(account.reference ? account.reference : account.publicKeyBase58)"></b-icon></span>
        </div>

        <div class="text-secondary font-small mt-1">
          <b-icon style="margin-right: 5px" variant="primary" width="18" icon="globe" />{{ account.network.url }}
        </div>

        <div v-if="!account.reference" class="text-secondary font-small mt-1">Waiting for payment to this key</div>

        <div class="d-flex mt-3 justify-content-end" v-if="account.publicKey !== currentAccount.publicKey">
          <b-button variant="primary" size="sm" style="margin-right: 16px; padding: 6px 12px" @click="onAccountLoginClick(index)">Login</b-button>
          <b-button variant="danger" size="sm" style="padding: 6px 12px" @click="onAccountRemoveClick(index)"><b-icon width="18" icon="trash"></b-icon></b-button>
        </div>
      </b-list-group-item>
    </b-list-group>

    <VerifyPasswordModal ref="verifyPasswordComponent" @onPasswordVerified="onPasswordVerified" />
    <AskForConfirmationModal ref="askForConfirmationComponent" @onYes="removeAccount" />
  </div>
</template>

<script>
import {EventBus, showErrorToast, showSuccessToast} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import VerifyPasswordModal from "../features/VerifyPasswordModal";
import AskForConfirmationModal from "../features/AskForConfirmationModal";
import {Service} from "../../internal/Service";
import {accountUtils} from "../../internal/mixins";

export default {
  name: "ListAccounts",
  components: {VerifyPasswordModal, AskForConfirmationModal},
  mixins: [accountUtils],
  data() {
    return {
      selectedAccount: null,
      selectedAccountToRemove: null,
      accounts: [],
      currentAccount: null
    }
  },
  methods: {
    onPasswordVerified(result) {
      if (result.verified) {
        new Service()
          .switchToAccount(this.selectedAccount, result.password)
          .then(() => replaceRoute('/home'))
          .catch(err => showErrorToast(this, 'Accounts', err.message || 'Cannot switch to the selected account'))
      }
    },
    removeAccount() {
      const accountOrKey = this.selectedAccountToRemove.reference ? 'Account' : 'Key'
      new Service()
        .removeAccount(this.selectedAccountToRemove)
        .then(() => {
          showSuccessToast(this, 'Remove', accountOrKey + ' removed')
          this.init()
        })
        .catch(() => showErrorToast(this, 'Remove', 'Error while removing the ' + accountOrKey))
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
    init: async function() {
      try {
        const service = new Service()
        this.currentAccount = await service.getCurrentAccount()
        this.accounts = await service.getAccounts()
      } catch (e) {
        showErrorToast(this, 'Account','Cannot retrieve account')
      }
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Account list')
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.font-small {
  font-size: 15px;
}
.list-group-item.active {
  background-color: #eee;
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.account-container {
  color: #000;

  p {
    margin: 0 0 0 5px;
  }
}
</style>