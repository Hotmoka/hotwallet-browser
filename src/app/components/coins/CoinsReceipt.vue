<template>
  <div class="content">
    <h6 class="mb-4 text-center text-success">Coins sent successfully</h6>

    <div class="d-flex justify-content-center" v-if="from">
      <div class="text-left form-container">

        <b-form-group>
          <label>From</label>
          <p class="txt-secondary" v-if="fromFaucet">Faucet - {{ trimAccountAddress(from) }} </p>
          <p class="txt-secondary" v-if="!fromFaucet">{{ from }} </p>
        </b-form-group>

        <b-form-group>
          <label>To</label>
          <p class="txt-secondary">{{ to }} </p>
        </b-form-group>

        <b-form-group v-if="account && account.reference && account.reference.transaction">
          <label>Storage reference of new account <b-icon id="i-new-account-help" width="18" icon="question-circle-fill" variant="info"></b-icon></label>
          <p class="txt-secondary">{{ toStringAccount(account) }}</p>

          <b-tooltip target="i-new-account-help" triggers="hover">
            Who holds the key {{ to }} can now bind it to that storage reference and control the account
          </b-tooltip>
        </b-form-group>

        <b-form-group>
          <label>Amount</label>
          <p class="txt-secondary">{{ formatCoins(this.amount) }} Panarea </p>
        </b-form-group>

        <b-form-group v-if="transaction">
          <label>Transaction</label>
          <p class="txt-secondary">{{ this.transaction.hash }} </p>
        </b-form-group>

        <b-button variant="primary" :href="shareHref" style="width: 100%">Share</b-button>
      </div>
    </div>

  </div>
</template>

<script>
import {EventBus} from "../../internal/utils";
import {accountUtils, coinFormatter} from "../../internal/mixins";

export default {
  name: "CoinsReceipt",
  mixins: [coinFormatter, accountUtils],
  props: {
    account: Object,
    from: String,
    to: String,
    fromFaucet: Boolean,
    amount: String,
    anonymous: Boolean,
    transaction: Object
  },
  data() {
    return {
      shareHref: ''
    }
  },
  methods: {
    buildShareText() {
      const subject = 'Hotmoka send receipt'
      let body = ''
      const transactionReference = this.transaction ? this.transaction.hash : ''
      const accountReference = this.toStringAccount(this.account)

      const amount = this.formatCoins(this.amount)
      if (this.account) {
        // we've sent coins to a key
        if (this.anonymous) {
          body = 'An amount of ' + amount + ' Panarea has been sent from ' + this.from + ' to a new account with storage reference '
              + accountReference + ' and key ' + this.to + '. You can find confirmation in ' + transactionReference +
              '. Since the transfer was anonymous, who holds the key sees it bound now, automatically, to that storage reference and can already control the account.'
        } else {
          body = 'An amount of ' + amount + ' Panarea has been sent from ' + this.from + ' to a new account with storage reference '
              + accountReference + ' and key ' + this.to + '. You can find confirmation in ' + transactionReference +
              '. Who holds the key can now bind it to that storage reference and control the account.'
        }
      } else {
        body = 'An amount of ' + amount + ' Panarea has been sent from ' + this.from + ' to ' + this.to + '. You can find confirmation in ' + transactionReference
      }

      return 'mailto:?body=' + body + '&subject=' + subject
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Send coins receipt')
    this.shareHref = this.buildShareText()
  }
}
</script>

<style scoped>

</style>