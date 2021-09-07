<template>
  <div class="content text-center">
    <div v-if="account">

      <b-popover :show.sync="showOptionsMenu" target="popover-options-button" placement="top">
        <b-list-group>
          <b-list-group-item button @click="onOptionClick('expand-view')" v-if="isPopup">Expand view</b-list-group-item>
          <b-list-group-item button @click="onOptionClick('edit-account')">Edit account</b-list-group-item>
          <b-list-group-item button @click="onOptionClick('import-account')">Import account</b-list-group-item>
          <b-list-group-item button @click="onOptionClick('account-list')">Account list</b-list-group-item>
        </b-list-group>
      </b-popover>

      <div class="navigation">
        <h6>{{ account.name }}</h6>
        <b-link class="float-right" @click="showOptionsMenu = !showOptionsMenu">
          <b-icon id="popover-options-button" width="18" icon="three-dots-vertical" variant="primary"></b-icon>
        </b-link>
      </div>

      <p class="txt-secondary" v-if="account.reference">
        {{ account.reference }}#{{ parseInt(account.nonce).toString(16) }}</p>
      <hr/>

      <div v-if="account.balance">
        <p class="text-dark">Balance</p>
        <h4 class="text-success">{{ account.balance }} Mokas </h4>
        <h4 class="text-danger">{{ account.balanceRed ? account.balanceRed : '0' }} Mokas </h4>
      </div>

      <hr/>
      <b-button variant="outline-primary" @click="onEditAccountClick">Edit account</b-button>

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
import {WrapPromiseTask, showErrorToast} from "../internal/utils";
import {pushRoute, replaceRoute} from "../internal/router";

export default {
  name: "Home",
  data() {
    return {
      showOptionsMenu: false,
      account: {
        balance: 0,
        balanceRed: 0,
        nonce: 0
      }
    }
  },
  computed: {
    isPopup() {
      return this.$isPopup
    }
  },
  methods: {
    onOptionClick(option) {
      if (option === 'expand-view') {
        this.$browser.tabs.create({
          url: this.$browser.runtime.getURL("app/index.html")
        });
      } else if (option === 'edit-account') {
        pushRoute('/edit-account')
      } else if (option === 'import-account') {
        pushRoute('/import-account')
      } else if (option === 'account-list') {
        pushRoute('/account-list')
      }
    },
    getAccountInfo(accountReference) {
      WrapPromiseTask(async () => {
          return new RemoteNode(this.$blockchainConfig.remoteNodeUrl)
              .getState(StorageReferenceModel.newStorageReference(accountReference))
      }).then(result => {
        const updates = result.updates
        updates.forEach(update => {
          if (update.field && update.field.name) {
            if (this.account.hasOwnProperty(update.field.name)) {
              this.account[update.field.name] = update.value.value
            }
          }
        })

        this.$browser.setToStorage({
          account: {
            ...this.account,
            balance: this.account.balance,
            balanceRed: this.account.balanceRed
          }
        })

      }).catch(error => {
        showErrorToast(this, 'Account', error.message ? error.message : 'Cannot retrieve account details')
      })
    },
    onLogoutClick() {
      this.account.sessionPeriod = new Date().getTime()
      this.$browser.setToStorage({
        account: {
          ...this.account
        }
      }).then(() => replaceRoute('/login'))
    },
    onEditAccountClick() {
      pushRoute('/edit-account')
    }
  },
  created() {
    this.$browser.getFromStorage('account').then(account => {
      if (account) {
        this.account = {...this.account, ...account}
        this.getAccountInfo(this.account.reference)
      }
    })
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
  grid-template-columns: 55% 45%;
  margin-bottom: 1rem;
}

.navigation a:hover > svg {
  color: darkblue !important;
}

.navigation h6 {
  margin: 0;
  place-self: end;
  align-self: center;
}

.navigation a {
  place-self: end;
  align-self: center;
}

</style>
