<template>
  <div class="content">
    <h6 class="mb-4 text-center">Send coins receipt</h6>

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

        <b-form-group v-if="account && account.reference">
          <label>Storage reference of new account</label>
          <p class="txt-secondary">{{ account.reference }} </p>
          <p class="txt-secondary">Who holds the key {{ to }} can now bind it to that storage reference and control the account</p>
        </b-form-group>

        <b-form-group>
          <label>Amount</label>
          <p class="txt-secondary">{{ amount }} Panarea </p>
        </b-form-group>

        <b-button v-if="account && account.reference" variant="primary" :href="shareHref" style="width: 100%" >Share</b-button>
      </div>
    </div>

  </div>
</template>

<script>
import {trimAddress} from "../../internal/utils";

export default {
  name: "CoinsReceipt",
  props: {
    account: Object,
    from: String,
    to: String,
    fromFaucet: Boolean,
    amount: String,
    anonymous: Boolean
  },
  data() {
    return {
      shareHref: ''
    }
  },
  methods: {
    trimAccountAddress(address) {
      return trimAddress(address)
    },
    buildShareText() {
      const subject = 'Hotmoka send receipt'

      let body = ''
      if (this.anonymous) {
        body = 'An amount of ' + this.amount + ' Panarea has been sent from ' + this.from + ' to a new account with storage reference '
            + this.account.reference + ' and key ' + this.to + '.\nYou can find confirmation in @@@@@' +
            '.\nSince the transfer was anonymous, who holds the key sees it bound now, automatically, to that storage reference and can already control the account.'
      } else {
        body = 'An amount of ' + this.amount + ' Panarea has been sent from ' + this.from + ' to a new account with storage reference '
            + this.account.reference + ' and key ' + this.to + '.\nYou can find confirmation in @@@@@' +
            '.\nWho holds the key can now bind it to that storage reference and control the account.'
      }

      return 'mailto:?body=' + body + '&subject=' + subject
    }
  },
  created() {
    this.shareHref = this.buildShareText()
  }
}
</script>

<style scoped>

</style>