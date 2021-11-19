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

      <p class="txt-secondary address-txt" id="i-address-help" v-if="isAccount && account.reference" @click="onCopyToClipboardClick">
        {{ account.reference }}
        <b-tooltip target="i-address-help" triggers="hover" delay="400">
          Click to copy the address to clipboard
        </b-tooltip>
      </p>

      <p class="txt-secondary address-txt" id="i-key-help" v-if="!isAccount && account.publicKeyBase58" @click="onCopyToClipboardClick">
        {{ account.publicKeyBase58 }}
        <b-tooltip target="i-key-help" triggers="hover" delay="400">
          Click to copy the public key to clipboard
        </b-tooltip>
      </p>

      <hr/>

      <div>
        <h6 class="text-dark" style="margin-bottom: 2rem">Balance</h6>
        <h4 class="text-success">{{ formatCoins(this.account.balance) }} Panarea </h4>
        <h4 class="text-danger">{{ formatCoins(this.account.balanceRed) }} Panarea </h4>

        <div class="container-actions">
          <div class="action-btn" :class="(account.balance < 1 || !isAccount) ? 'disabled' : ''" @click="onSendCoinsClick">
            <b-icon id="i-pwd-help" width="36" height="36" icon="arrow-up-right-circle" variant="primary"></b-icon>
            <br/><span class="text-primary">Send</span>
          </div>

          <div class="action-btn" @click="onReceiveCoinsClick">
            <b-icon id="i-pwd-help" width="36" height="36" icon="arrow-down-right-circle" variant="primary"></b-icon>
            <br/><span class="text-primary">Receive</span>
          </div>
        </div>

      </div>

      <hr/>

      <div v-if="!isAccount">
        <p class="text-dark">Waiting for payment for this key</p>
      </div>

      <div class="btn-logout">
        <div class="d-flex justify-content-center">
          <b-button variant="outline-danger" @click="onLogoutClick">Logout</b-button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import {RemoteNode} from "hotweb3";
import {
  WrapPromiseTask,
  showErrorToast,
  EventBus,
  showInfoToast,
  storageReferenceFrom
} from "../internal/utils";
import {pushRoute, replaceRoute} from "../internal/router";
import {Service} from "../internal/Service";
import {coinFormatter} from "../internal/mixins";

export default {
  name: "Home",
  mixins: [coinFormatter],
  data() {
    return {
      showOptionsMenu: false,
      account: {
        balance: 0,
        balanceRed: 0
      },
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
    onSendCoinsClick() {
      if (this.account.balance < 1 || !this.isAccount) {
        return
      }
      pushRoute('/send-coins')
    },
    onReceiveCoinsClick() {
      pushRoute('/receive-coins')
    },
    onCopyToClipboardClick() {
      const text = this.isAccount ? this.account.reference : this.account.publicKeyBase58
      navigator.clipboard.writeText(text).then(() => showInfoToast(this, 'Info', 'Content copied to clipboard', 1600))
    },
    getAccountDetails(accountReference) {
      new Service()
          .getAccountDetails(accountReference)
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
      new Service()
          .logout(this.account)
          .then(() => replaceRoute('/login'))
          .catch(() => showErrorToast(this, 'Account', 'Unable to logout'))
    },
    displayAccount() {
      new Service()
          .getCurrentAccountWithFaucet()
          .then(result => {
            this.allowsFaucet = result.allowsUnsignedFaucet

            this.account = {
              ...this.account,
              ...result.account
            }

            if (this.account.reference) {
              this.isAccount = true
              this.getAccountDetails(this.account.reference)
            }
          })
          .catch(error => showErrorToast(this, 'Account', error.message || 'Cannot retrieve account'))
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

.container-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
}

.action-btn {
  padding: 8px 16px 8px 16px;
  cursor: pointer;
  font-weight: 500;
}

.disabled {
  opacity: .55;
  cursor: no-drop;
}

.address-txt {
  cursor: pointer;
}

</style>
