<template>
  <b-modal v-model="modal.showModal" centered :hideHeaderClose="true" title="Choose account">
    <p>List of accounts for the network <strong>{{modal.network.text}}</strong> </p>

    <b-list-group v-if="modal.accounts">
      <b-list-group-item
          button
          v-for="account in modal.accounts"
          @click="onAccountSelected(account)"
      >

        <div class="account-container">
          {{ account.name }}
        </div>

        <div class="d-flex align-items-center account-container mt-1">
          <b-icon v-if="!account.reference" width="18" icon="key" variant="primary"/>
          <b-icon v-if="account.reference" width="18" icon="person" variant="primary"/>
          <p v-if="account.reference">{{ trimAccountAddress(account.reference) }}</p>
          <p v-if="!account.reference">{{ trimAccountAddress(account.publicKeyBase58) }}</p>
        </div>
      </b-list-group-item>
    </b-list-group>
    <template #modal-footer>
      <b-button @click="modal.showModal = false" variant="secondary">Cancel</b-button>
    </template>
  </b-modal>
</template>

<script>
import {Service} from "../../internal/Service";
import {showErrorToast} from "../../internal/utils";
import {accountUtils} from "../../internal/mixins";

export default {
  name: "ChooseAccountModal",
  mixins: [accountUtils],
  data() {
    return {
      modal: {
        showModal: false,
        network: '',
        accounts: []
      }
    }
  },
  methods : {
    closeModal() {
      this.modal = {
        showModal: false
      }
    },
    showModal(network) {
      new Service()
          .getAccountList()
          .then(result => {
            const accounts = result.accounts.filter(acc => acc.network.value === network.value)
            this.modal = {
              network: network,
              accounts: accounts,
              showModal: true
            }
          })
          .catch(() => showErrorToast(this, 'Account', 'Cannot retrieve accounts'))
    },
    onAccountSelected(account) {
      this.$emit('onAccountSelected', account)
    }
  }
}
</script>

<style lang="scss" scoped>
.account-container {
  color: #000;

  p {
    margin: 0 0 0 5px;
  }
}
</style>