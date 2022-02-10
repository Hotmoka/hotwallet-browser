<template>
  <div class="content">

    <div class="d-flex justify-content-end">
      <b-button variant="primary" size="sm" @click="onAddNetworkClick">Add network</b-button>
    </div>

    <b-list-group v-if="networks" class="mt-4">
      <b-list-group-item
          v-for="(network, index) in networks"
          :active="network.selected"
      >

        <span style="color: #000; word-break: break-word">
            <b-icon width="18" icon="globe"></b-icon>
            {{ network.url }}
        </span>

        <br/>

        <div class="d-flex mt-3 justify-content-end" v-if="!network.selected">
          <b-button variant="primary" size="sm" style="padding: 6px 12px" @click="onNetworkSelected(network)">Select</b-button>
          <b-button variant="danger" size="sm" style="padding: 6px 12px;margin-left: 16px;" @click="onRemoveNetworkClick(index)"><b-icon width="18" icon="trash"></b-icon></b-button>
        </div>

      </b-list-group-item>
    </b-list-group>

    <CustomNetworkModal ref="customNetworkModal" @onConnected="onCustomNetworkConnected" />
    <AskForConfirmationModal ref="askForConfirmationComponent" @onYes="removeNetwork" />
    <ChooseAccountModal ref="chooseAccountModal" @onAccountSelected="onAccountSelected"/>
    <VerifyPasswordModal ref="verifyPasswordComponent" @onPasswordVerified="doLogin" />
  </div>
</template>

<script>
import {EventBus, showErrorToast, showSuccessToast, WrapPromiseTask} from "../../internal/utils";
import {validator} from "../../internal/mixins";
import CustomNetworkModal from "./CustomNetworkModal";
import AskForConfirmationModal from "./AskForConfirmationModal";
import ChooseAccountModal from "./ChooseAccountModal";
import {Service} from "../../internal/Service";
import VerifyPasswordModal from "./VerifyPasswordModal";
import {replaceRoute} from "../../internal/router";

export default {
  name: "Network",
  components: {CustomNetworkModal, AskForConfirmationModal, ChooseAccountModal, VerifyPasswordModal},
  mixins: [validator],
  data() {
    return {
      networkToRemove: null,
      networks: [],
      selectedAccount: null
    }
  },
  methods: {
    onAddNetworkClick() {
      this.$refs.customNetworkModal.showModal()
    },
    onCustomNetworkConnected(network) {
      WrapPromiseTask(async () => {
        const service = new Service()

        // check if network has faucet
        const allowsUnsignedFaucet = await service.allowsUnsignedFaucetFor(network)
        if (allowsUnsignedFaucet) {
          const accounts = await this.$storageApi.getAccounts()
          this.selectedAccount = await service.registerFaucet(network, accounts)
          return {
            createKey: false
          }
        } else {
          return {
            createKey: true
          }
        }
      })
      .then(result => {
        if (result.createKey) {
          replaceRoute('/create-key')
        } else {
          this.doLogin({verified: true, password: 'faucet'})
        }
      })
      .catch(() => showErrorToast(this, 'Accounts', 'Error while connecting to network'))
    },
    doLogin(result) {
      if (result.verified) {
        new Service()
            .switchToAccount(this.selectedAccount, result.password)
            .then(() => replaceRoute('/home'))
            .catch(err => showErrorToast(this, 'Accounts', err.message || 'Cannot switch to the selected account'))
      }
    },
    onAccountSelected(account) {
      this.selectedAccount = account

      if (account.isFaucet) {
        this.doLogin({
          verified: true,
          password: 'faucet',
        })
      } else {
        const options = {
          account: account,
          title: 'Login',
          subtitle: 'Please login with ' + account.name + ' for the selected ' + (account.reference ? 'account' : 'key')
        }
        this.$refs.verifyPasswordComponent.showModal(options)
      }
    },
    onNetworkSelected(network) {
      this.$refs.chooseAccountModal.showModal(network)
    },
    onRemoveNetworkClick(index) {
      this.networkToRemove = this.networks[index]
      this.$refs.askForConfirmationComponent.showModal({
        title: 'Remove network',
        subtitle: 'Are you sure you want to remove the ' + this.networkToRemove.text + ' network ?' +
            " All accounts will also be removed."
      })
    },
    removeNetwork() {
      new Service()
          .removeNetwork(this.networkToRemove)
          .then(() => {
            showSuccessToast(this, 'Network', 'Network removed')
            this.setNetworks()
          })
          .catch(() => showErrorToast(this, 'Network', 'An error occurred while removing the network'))
    },
    setNetworks: async function () {
      try {
        const unsortedNetworks = await this.$storageApi.getNetworks()
        this.networks = unsortedNetworks.sort((a, b) => a.selected ? -1 : 1)
      } catch (e) {
        showErrorToast(this, 'Network', 'Cannot load the network list')
      }
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Networks')
    this.setNetworks()
  }
}
</script>

<style scoped>
.list-group-item.active {
  background-color: #eee;
  border: 1px solid rgba(0, 0, 0, 0.125);
}
</style>