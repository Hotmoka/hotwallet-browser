<template>
  <div class="content">
    <h6 class="mb-4 text-center">Send coins</h6>

    <div class="d-flex justify-content-center">
      <div class="text-left form-container">

        <b-form-group
            id="i-destination"
            label="Destination"
            label-for="i-destination"
            :invalid-feedback="invalidFeedbackDestination"
            :state="stateDestination"
        >
          <b-form-input type="text" id="i-destination" v-model="destination" :state="stateDestination" placeholder="Account or Key" trim></b-form-input>
        </b-form-group>

        <b-form-group
            id="i-amount"
            label="Amount"
            label-for="i-amount"
            :invalid-feedback="invalidFeedbackAmount"
            :state="stateAmount"
        >
          <b-form-input type="number" id="i-amount" min="0" v-model="amount" :state="stateAmount" trim></b-form-input>
        </b-form-group>

        <b-form-group id="i-payer">
          <label>Payer</label>
          <p class="txt-secondary" v-if="payer"> {{payer.name}} - {{payerAddress}}</p>
        </b-form-group>

        <b-button @click="onSendClick" variant="primary" :disabled="!stateDestination || !stateAmount">Send</b-button>
      </div>
    </div>
  </div>
</template>

<script>
import {fieldNotEmptyFeedback, stateFieldNotEmpty} from "../../internal/validators";
import {showErrorToast, WrapPromiseTask, trimAddress} from "../../internal/utils";

export default {
  name: "SendCoins",
  data() {
    return {
      payer: null,
      destination: null,
      amount: null
    }
  },
  computed: {
    stateDestination() {
      return stateFieldNotEmpty(this.destination)
    },
    invalidFeedbackDestination() {
      return fieldNotEmptyFeedback(this.destination, 'Please enter a destination')
    },
    stateAmount() {
     return this.amount === null ? null : (!this.amount ? false : !isNaN(this.amount))
    },
    invalidFeedbackAmount() {
      if (this.amount === null) {
        return null
      }
      return !this.amount ? 'Please enter a valid amount' : null
    },
    payerAddress() {
      return this.payer ? trimAddress(this.payer.reference) : ''
    }
  },
  methods: {
    onSendClick() {
      // TODO
    }
  },
  created() {
    WrapPromiseTask(() => this.$storageApi.getCurrentAccount(this.$network.get()))
        .then(account => this.payer = account)
        .catch(() => showErrorToast(this, 'Account', 'Cannot retrieve account'))
  }
}
</script>

<style scoped>

</style>