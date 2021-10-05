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

        <b-form-group
            v-if="allowsUnsignedFaucet"
            id="i-faucet"
        >
          <b-form-checkbox
              id="checkbox-faucet"
              v-model="fromFaucet"
              name="checkbox-1"
              :value="true"
              :unchecked-value="false"
          >
            Use faucet as payer
          </b-form-checkbox>
        </b-form-group>

        <b-form-group id="i-payer" v-if="!fromFaucet">
          <label>Payer</label>
          <p class="txt-secondary" v-if="payer"> {{payer.name}} - {{payerAddress}}</p>
        </b-form-group>

        <b-button @click="onSendClick" variant="primary" :disabled="!stateDestination || !stateAmount">Send</b-button>
      </div>
    </div>

    <VerifyPasswordModal ref="verifyPasswordComponent" @onPasswordVerified="onPasswordVerified"></VerifyPasswordModal>
  </div>
</template>

<script>
import {fieldNotEmptyFeedback, stateFieldNotEmpty} from "../../internal/validators";
import {
  showErrorToast,
  WrapPromiseTask,
  trimAddress,
  isStorageReference,
  isPublicKey,
  showSuccessToast
} from "../../internal/utils";
import {
  AccountHelper,
  Algorithm, Base58,
  Bip39Dictionary,
  KeyPair,
  RemoteNode,
  SendCoinsHelper,
  StorageReferenceModel
} from "hotweb3";
import {replaceRoute} from "../../internal/router";
import VerifyPasswordModal from "./VerifyPasswordModal";


export default {
  name: "SendCoins",
  components: {VerifyPasswordModal},
  props: {
    allowsUnsignedFaucet: Boolean,
    payer: Object
  },
  data() {
    return {
      destination: null,
      destinationIsStorageReference: true,
      amount: null,
      fromFaucet: false
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
    sendCoinsToPublicKey(keyPairOfPayer) {
      return new AccountHelper(new RemoteNode(this.$network.get().url)).createAccountFromPayer(
          Algorithm.ED25519,
          StorageReferenceModel.newStorageReference(this.payer.reference),
          keyPairOfPayer,
          new KeyPair(null, Base58.decode(this.destination).toString('base64'), null),
          this.amount,
          "0",
          false
      )
    },
    sendCoinsToReference(keyPairOfPayer) {
      return new SendCoinsHelper(new RemoteNode(this.$network.get().url)).fromPayer(
          StorageReferenceModel.newStorageReference(this.payer.reference),
          keyPairOfPayer,
          StorageReferenceModel.newStorageReference(this.destination),
          this.amount,
          '0'
      )
    },
    onSendClick() {
      WrapPromiseTask(async () => {

        if (isNaN(this.amount)) {
          throw new Error('Illegal amount. Please insert a valid number of coins')
        }

        const amountToSend = Math.round(Number(this.amount))
        if (amountToSend < 1) {
          throw new Error('Cannot send less than 1 Panarea')
        }

        const remoteNode = new RemoteNode(this.$network.get().url)
        let payerReference

        if (this.fromFaucet) {
          const gamete = await remoteNode.getGamete()
          payerReference = gamete.transaction.hash
        } else {
          payerReference = this.payer.reference
        }

        const balanceOfPayer = new AccountHelper(remoteNode).getBalance(StorageReferenceModel.newStorageReference(payerReference))
        if ((amountToSend - Number(balanceOfPayer)) > 0) {
          throw new Error('Cannot transfer more than ' + balanceOfPayer + ' from payer')
        }

        if (isStorageReference(this.destination)) {
          this.destinationIsStorageReference = true

          if (!this.fromFaucet) {
            this.askForPassword()
          }
        } else if (isPublicKey(this.destination)) {
          this.destinationIsStorageReference = false

          if (!this.fromFaucet) {
            this.askForPassword()
          }
        } else {
          throw new Error('The destination does not look like a storage reference nor like a Base58 encoded public key')
        }

      }).catch(err => showErrorToast(this, 'Send coins', err.message || 'Cannot send coins to the selected destination'))
    },
    askForPassword() {
      this.$refs.verifyPasswordComponent.showModal({account: this.payer, title: 'Account verification', subtitle: 'Please enter password to verify the account of ' + this.payer.name})
    },
    onPasswordVerified(result) {
      if (result.verified) {
        WrapPromiseTask(async () => {
          const keyPairOfPayer = AccountHelper.generateEd25519KeyPairFrom(result.password, Bip39Dictionary.ENGLISH, this.payer.entropy)

          const result = { account: null }
          if (this.destinationIsStorageReference) {
            if (this.fromFaucet) {
              await new SendCoinsHelper(new RemoteNode(this.$network.get().url)).fromFaucet(StorageReferenceModel.newStorageReference(this.destination), this.amount, '0')
            } else {
              await this.sendCoinsToReference(keyPairOfPayer)
            }

          } else {
            if (this.fromFaucet) {
              throw new Error('Payment to key is currently not implemented for the faucet')
            } else {
              result.account = await this.sendCoinsToPublicKey(keyPairOfPayer)
            }
          }

          return result

        }).then(result => {
          if (result.account) {
            // TODO: go to receipt if paid to public key
            replaceRoute('/home')
          } else {
            showSuccessToast(this, 'Send coins', 'Coins sent successfully')
            replaceRoute('/home')
          }
        }).catch(err => {
          showErrorToast(this, 'Send Coins', err.message || 'An error occurred while sending coins to the selected destination')
        })
      }
    }
  }
}
</script>

<style scoped>

</style>