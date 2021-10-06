<template>
  <div class="content">

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
        </b-form-group>

        <b-tooltip target="i-anonymous-help" triggers="hover">
          If you are paying to a key, you can require an anonymous transaction.
          It will cost up to {{ anonymousGas }} units of gas more, but the recipient will be automatically notified of the transfer
        </b-tooltip>

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
  showSuccessToast, EventBus
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
import VerifyPasswordModal from "../account/VerifyPasswordModal";


export default {
  name: "SendCoins",
  components: {VerifyPasswordModal},
  data() {
    return {
      destination: null,
      destinationIsStorageReference: true,
      amount: null,
      fromFaucet: false,
      payerReference: null,
      anonymous: false,
      anonymousGas: AccountHelper.EXTRA_GAS_FOR_ANONYMOUS,
      allowsUnsignedFaucet: false,
      payer: null
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
    sendCoinsToPublicKey(keyPairOfPayer, resultTransactionCallback) {
      return new AccountHelper(new RemoteNode(this.$network.get().url)).createAccountFromPayer(
          Algorithm.ED25519,
          StorageReferenceModel.newStorageReference(this.payer.reference),
          keyPairOfPayer,
          new KeyPair(null, Base58.decode(this.destination).toString('base64'), null),
          this.amount,
          "0",
          this.anonymous,
          transactions => {
            if (transactions && transactions.length > 0) {
              resultTransactionCallback(transactions[0])
            }
          }
      )
    },
    sendCoinsToReference(keyPairOfPayer, resultTransactionCallback) {
      return new SendCoinsHelper(new RemoteNode(this.$network.get().url)).fromPayer(
          StorageReferenceModel.newStorageReference(this.payer.reference),
          keyPairOfPayer,
          StorageReferenceModel.newStorageReference(this.destination),
          this.amount,
          '0',
          transactions => {
            if (transactions && transactions.length > 0) {
              resultTransactionCallback(transactions[0])
            }
          }
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
        if (this.fromFaucet) {
          const gamete = await remoteNode.getGamete()
          this.payerReference = gamete.transaction.hash
        } else {
          this.payerReference = this.payer.reference
        }

        const balanceOfPayer = new AccountHelper(remoteNode).getBalance(StorageReferenceModel.newStorageReference(this.payerReference))
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
    onPasswordVerified(verificationResult) {
      if (verificationResult.verified) {
        WrapPromiseTask(async () => {
          const keyPairOfPayer = AccountHelper.generateEd25519KeyPairFrom(verificationResult.password, Bip39Dictionary.ENGLISH, this.payer.entropy)

          const result = { account: null, transaction: null }
          if (this.destinationIsStorageReference) {
            if (this.fromFaucet) {
              await new SendCoinsHelper(new RemoteNode(this.$network.get().url)).fromFaucet(
                  StorageReferenceModel.newStorageReference(this.destination),
                  this.amount,
                  '0',
                  transaction => result.transaction = transaction
              )
            } else {
              await this.sendCoinsToReference(keyPairOfPayer, transaction => result.transaction = transaction)
            }

          } else {
            if (this.fromFaucet) {
              throw new Error('Payment to key is currently not implemented for the faucet')
            } else {
              result.account = await this.sendCoinsToPublicKey(keyPairOfPayer, transaction => result.transaction = transaction)
            }
          }

          return result

        }).then(result => {
          showSuccessToast(this, 'Send coins', 'Coins sent successfully')
          replaceRoute('/coins-receipt', {
                account: result.account,
                from: this.payerReference,
                to: this.destination,
                fromFaucet: this.fromFaucet,
                amount: this.amount,
                anonymous: this.anonymous,
                transaction: result.transaction
              }
          )
        }).catch(err => showErrorToast(this, 'Send Coins', err.message || 'An error occurred while sending coins to the selected destination'))
      }
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Send coins')

    WrapPromiseTask(async () => {
      const account = await this.$storageApi.getCurrentAccount(this.$network.get())
      const allowsUnsignedFaucet = await new RemoteNode(this.$network.get().url).allowsUnsignedFaucet()
      return { account, allowsUnsignedFaucet }
    }).then(result => {
      this.allowsUnsignedFaucet = result.allowsUnsignedFaucet
      this.payer = result.account
    }).catch(error => showErrorToast(this, 'Account', error.message || 'Cannot retrieve account'))
  }
}
</script>

<style scoped>

</style>