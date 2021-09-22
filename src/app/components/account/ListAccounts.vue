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
          {{ account.name }}
        </span>
        <br/>
        <span class="text-secondary font-small">{{ account.network.url }}</span>
        <br/>
        <span v-if="!account.reference" class="text-secondary font-small">Waiting for payment to this key</span>
      </b-list-group-item>
    </b-list-group>


    <b-modal v-model="modal.showModal" centered :hideHeaderClose="true" title="Login">
      <p>Please login with the selected {{ accountSelection.reference ? 'account' : 'key' }}</p>
      <div class="text-left form-container">
        <b-form-group
            id="i-pwd"
            label="Password"
            label-for="i-pwd"
            :invalid-feedback="invalidFeedback"
            :state="state"
        >
          <b-form-input type="password" id="i-pwd" v-model="accountSelection.password" :state="state" trim></b-form-input>
        </b-form-group>
      </div>

      <template #modal-footer>
        <b-button @click="onModalActionClick(false)" variant="secondary">Cancel</b-button>
        <b-button @click="onModalActionClick(true)" variant="primary" :disabled="!state">Login</b-button>
      </template>

    </b-modal>

  </div>
</template>

<script>
import {EventBus, showErrorToast, WrapPromiseTask} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import {invalidPasswordFeedback, statePassword} from "../../internal/validators";
import {AccountHelper, Bip39Dictionary} from "hotweb3";

export default {
  name: "ListAccounts",
  data() {
    return {
      modal: {
        showModal: false
      },
      accountSelection: {
        account: null,
        password: null
      },
      accounts: [],
      currentAccount: null
    }
  },
  computed: {
    state() {
      return statePassword(this.accountSelection.password)
    },
    invalidFeedback() {
      return invalidPasswordFeedback(this.accountSelection.password)
    },
  },
  methods: {
    resetAccountSelection() {
      this.accountSelection.account = null
      this.accountSelection.password = null
    },
    onModalActionClick(switchAccount) {
      this.modal.showModal = false

      if (switchAccount) {
        WrapPromiseTask(async () => {

          // verify account
          const publicKeyVerified = AccountHelper.verifyPublicKey(
              this.accountSelection.password,
              this.accountSelection.account.entropy,
              Bip39Dictionary.ENGLISH,
              this.accountSelection.account.publicKey
          )

          if (!publicKeyVerified) {
            throw new Error("Wrong password")
          }

          // set new password
          await this.$storageApi.setPassword(this.accountSelection.password)
          await this.$storageApi.setAccountAuth(this.accountSelection.account, true)
          await this.$storageApi.selectNetwork(this.accountSelection.account.network)
          const currentNetwork = await this.$storageApi.getCurrentNetwork()
          this.$network.set(currentNetwork)

          // notify network change
          EventBus.$emit('networkChange', currentNetwork)

        }).then(() => replaceRoute('/home'))
          .catch(err => {
              this.resetAccountSelection()
              showErrorToast(this, 'Accounts', err.message ? err.message : 'Cannot switch to the selected account')
            })

      } else {
        this.resetAccountSelection()
      }
    },
    onAccountClick(index) {
      if (this.currentAccount.publicKey !== this.accounts[index].publicKey) {
        this.modal.showModal = true
        this.accountSelection.account = this.accounts[index]
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