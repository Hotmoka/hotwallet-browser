<template>
  <div class="content" v-if="account">
    <p class="h-txt">
      Please specify the requested amount that <span style="font-weight: 500">{{ account.reference ? account.name : account.publicKeyBase58 }}</span> will receive,
      then click on the button to generate the QR-code and show that QR-code to the payer
    </p>

    <div class="d-flex justify-content-center">
      <div class="text-left form-container">

        <b-form-group
            id="i-amount"
            label="Amount"
            label-for="i-amount"
            :invalid-feedback="invalidFeedbackAmount"
            :state="stateAmount"
        >
          <b-form-input type="number" id="i-amount" min="0" v-model="amount" :state="stateAmount" placeholder="Panarea" trim></b-form-input>
        </b-form-group>

        <b-form-group
            v-if="!account.reference"
            id="i-anonymous"
        >
          <b-form-checkbox
              id="checkbox-anonymous"
              v-model="anonymous"
              name="checkbox-2"
              :value="true"
              :unchecked-value="false"
          >
            Anonymous
            <b-icon id="i-anonymous-help" width="18" icon="question-circle-fill" variant="info"></b-icon>
          </b-form-checkbox>

          <b-tooltip target="i-anonymous-help" triggers="hover">
            You can require an anonymous transaction.
            It will cost up to {{ anonymousGas }} units of gas more, but the recipient will be automatically notified of the transfer
          </b-tooltip>
        </b-form-group>

        <b-button class="mt-4" @click="onGenerateQrCodeClick" variant="primary" :disabled="!stateAmount">Generate QR CODE</b-button>
      </div>
    </div>

    <QrCodeModal ref="qrCodeComponent"></QrCodeModal>
  </div>
</template>

<script>
import {EventBus, showErrorToast, WrapPromiseTask} from "../../internal/utils";
import {AccountHelper} from "hotweb3";
import QrCodeModal from "../features/QrCodeModal";

export default {
  name: "ReceiveCoins",
  components: {QrCodeModal},
  data() {
    return {
      account: null,
      amount: null,
      anonymous: false,
      anonymousGas: AccountHelper.EXTRA_GAS_FOR_ANONYMOUS
    }
  },
  computed: {
    stateAmount() {
      return this.amount === null ? null : (!this.amount ? false : !isNaN(this.amount))
    },
    invalidFeedbackAmount() {
      if (this.amount === null) {
        return null
      }
      return !this.amount ? 'Please enter a valid amount' : null
    }
  },
  methods: {
    onGenerateQrCodeClick() {
      const payerAddress = this.account && this.account.reference ? this.account.reference : this.account.publicKeyBase58
      const qrCodeValue = payerAddress + '&'+ this.amount + '&' + this.anonymous
      this.$refs.qrCodeComponent.generateQrCode({
        value: qrCodeValue
      })
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Receive coins')

    WrapPromiseTask(() => this.$storageApi.getCurrentAccount(this.$network.get()))
        .then(account => this.account = account)
        .catch(error => showErrorToast(this, 'Error', error.message || 'Cannot retrieve account'))
  }
}
</script>

<style scoped>

</style>