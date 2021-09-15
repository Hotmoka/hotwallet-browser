<template>
  <div class="content">
    <h6 class="mt-4 mb-4 text-center">Account list</h6>

    <b-list-group>
      <b-list-group-item button
                         v-for="(account, index) in accounts"
                         :active="account.publicKey === currentAccount.publicKey"
                          @click="onAccountClick(index)">
        {{ account.name }} <br/> <span style="color: #000">{{ account.network.text }}</span>
      </b-list-group-item>
    </b-list-group>

    <b-modal v-model="modal.showModal" centered :hideHeaderClose="true" title="Account">
      <p>Are you sure you want to switch to the selected account ?</p>

      <template #modal-footer>
        <b-button @click="onModalActionClick(false)" variant="secondary">No</b-button>
        <b-button @click="onModalActionClick(true)" variant="primary">Yes</b-button>
      </template>

    </b-modal>

  </div>
</template>

<script>
import {EventBus, showErrorToast, WrapPromiseTask} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";

export default {
  name: "ListAccounts",
  data() {
    return {
      modal: {
        showModal: false
      },
      accountSelected: null,
      accounts: [],
      currentAccount: null
    }
  },
  methods: {
    onModalActionClick(switchAccount) {
      this.modal.showModal = false
      if (switchAccount) {
        WrapPromiseTask(async () => {

          const committed = await this.$storageApi.setAccountLogin(this.accountSelected, true)
          if (!committed) {
            throw new Error('Cannot switch to the selected account')
          }

          this.$network = this.accountSelected.network
          EventBus.$emit('networkChanged')
        }).then(() => replaceRoute('/home'))
        .catch(err => showErrorToast(this, 'Accounts',err.message ? err.message : 'Cannot switch to the selected account'))

      } else {
        this.accountSelected = null
      }
    },
    onAccountClick(index) {
      if (this.currentAccount.publicKey !== this.accounts[index].publicKey) {
        this.modal.showModal = true
        this.accountSelected = this.accounts[index]
      }
    },
    getAccounts() {
      WrapPromiseTask(async () => {
        const currentAccount = await this.$storageApi.getCurrentAccount(this.$network)
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

</style>