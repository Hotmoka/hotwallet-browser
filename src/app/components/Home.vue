<template>
  <div class="content text-center">
    <div v-if="account">

      <b-popover :show.sync="showOptionsMenu" target="popover-options-button" placement="top">
        <b-list-group>
          <b-list-group-item button @click="onOptionClick('/expand-view')" v-if="isPopup">Expand view</b-list-group-item>
          <b-list-group-item button @click="onOptionClick('/edit-account')">Edit account</b-list-group-item>
          <b-list-group-item button @click="onOptionClick('/import-account')">Import account</b-list-group-item>
          <b-list-group-item button @click="onOptionClick('/create-account')" v-if="isAccount || allowsFaucet">Create account</b-list-group-item>
          <b-list-group-item button @click="onOptionClick('/create-key')">Create key</b-list-group-item>
          <b-list-group-item button @click="onOptionClick('/account-list')">Account list</b-list-group-item>
          <b-list-group-item button @click="onOptionClick('/send-coins')" v-if="isAccount">Send coins</b-list-group-item>
        </b-list-group>
      </b-popover>

      <div class="navigation">
        <div></div>
        <h6><b-icon v-if="account.reference" width="18" icon="person"
                    :variant="'text-dark'"></b-icon>
          <b-icon v-if="!account.reference" width="18" icon="key"
                  :variant="'text-dark'"></b-icon>
          {{ account.name }}
        </h6>
        <b-link class="float-right" @click="showOptionsMenu = !showOptionsMenu">
          <b-icon id="popover-options-button" width="18" icon="three-dots-vertical" variant="primary"></b-icon>
        </b-link>
      </div>

      <p class="txt-secondary" v-if="isAccount && account.reference">
        {{ account.reference }}#{{ parseInt(account.nonce).toString(16) }}</p>

      <p class="txt-secondary" v-if="!isAccount && account.publicKeyBase58">
        {{ account.publicKeyBase58 }}
      </p>
      <hr/>

      <div v-if="isAccount && account.balance">
        <p class="text-dark">Balance</p>
        <h4 class="text-success">{{ account.balance }} Panarea </h4>
        <h4 class="text-danger">{{ account.balanceRed ? account.balanceRed : '0' }} Panarea </h4>
      </div>

      <div v-if="!isAccount">
        <p class="text-dark">Waiting for payment for this key</p>
      </div>

      <hr/>

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
import {WrapPromiseTask, showErrorToast, EventBus} from "../internal/utils";
import {pushRoute, replaceRoute} from "../internal/router";

export default {
  name: "Home",
  data() {
    return {
      showOptionsMenu: false,
      account: null,
      isAccount: false,
      allowsFaucet: false
    }
  },
  computed: {
    isPopup() {
      return this.$isPopup
    }
  },
  methods: {
    onOptionClick(option) {
      if (option === '/expand-view') {
        this.$browser.tabs.create({
          url: this.$browser.runtime.getURL("app/index.html")
        });
      } else if (option === '/edit-account') {
        pushRoute(option, { editAccount: true })
      } else {
        pushRoute(option)
      }
    },
    getAccountInfo(accountReference) {
      WrapPromiseTask(() => new RemoteNode(this.$network.get().url).getState(StorageReferenceModel.newStorageReference(accountReference)))
          .then(result => {
            const updates = result.updates
            updates.forEach(update => {
              if (update.field && update.field.name) {
                if (this.account.hasOwnProperty(update.field.name)) {
                  this.account[update.field.name] = update.value.value
                }
              }
            })

            this.$storageApi.updateAccount(this.account)
          })
          .catch(error => showErrorToast(this, 'Account', error.message || 'Cannot retrieve account details'))
    },
    onLogoutClick() {
      WrapPromiseTask(() => this.$storageApi.setAccountAuth(this.account, false))
          .then(() => replaceRoute('/login'))
          .catch(() => showErrorToast(this, 'Account','Unable to logout'))
    },
    displayAccount() {
      WrapPromiseTask(async () => {
        const account = await this.$storageApi.getCurrentAccount(this.$network.get())
        const allowsFaucet = await new RemoteNode(this.$network.get().url).allowsUnsignedFaucet()

        return {account, allowsFaucet}
      }).then(result => {
        this.allowsFaucet = result.allowsFaucet

        this.account = {
          balance: 0,
          balanceRed: 0,
          nonce: 0,
          ...result.account
        }

        if (this.account.reference) {
          this.isAccount = true
          this.getAccountInfo(this.account.reference)
        }

      }).catch(error => showErrorToast(this, 'Account', error.message || 'Cannot retrieve account'))
    }
  },
  created() {
    EventBus.$on('reloadAccount', () => this.displayAccount())
    this.displayAccount()
  }
}
</script>

<style lang="scss" scoped>
.btn-logout {
  width: 100%;
  position: absolute;
  bottom: 2rem;
  right: 1px;
}

.navigation {
  width: 100%;
  display: grid;
  grid-template-columns: 10% 80% 10%;
  margin-bottom: 1rem;
}

.navigation a:hover > svg {
  color: darkblue !important;
}

.navigation h6 {
  margin: 0;
  place-self: center;
  align-self: center;
}

.navigation a {
  place-self: end;
  align-self: center;
}

</style>
