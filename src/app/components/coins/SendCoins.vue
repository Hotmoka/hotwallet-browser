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
          <b-form-input type="number" id="i-amount" min="0" v-model="amount" :state="stateAmount" placeholder="Panarea" trim></b-form-input>
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

          <b-tooltip target="i-anonymous-help" triggers="hover">
            If you are paying to a key, you can require an anonymous transaction.
            It will cost up to {{ anonymousGas }} units of gas more, but the recipient will be automatically notified of the transfer
          </b-tooltip>
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
          <p class="txt-secondary" v-if="payer"> {{payer.name}} - {{trimAccountAddress(payer.reference)}}</p>
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
  showSuccessToast, EventBus, storageReferenceFrom, storageReferenceToString
} from "../../internal/utils";
import {
  AccountHelper,
  Bip39Dictionary,
  RemoteNode,
  StorageReferenceModel
} from "hotweb3";
import {replaceRoute} from "../../internal/router";
import VerifyPasswordModal from "../features/VerifyPasswordModal";
import {accountUtils} from "../../internal/mixins";
import {Service} from "../../internal/Service";

export default {
  name: "SendCoins",
  mixins: [accountUtils],
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
    }
  },
  methods: {
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
          this.payerReference = storageReferenceToString(gamete)
        } else {
          this.payerReference = this.payer.reference
        }

        const balanceOfPayer = await new AccountHelper(remoteNode).getBalance(storageReferenceFrom(this.payerReference))
        if ((amountToSend - Number(balanceOfPayer)) > 0) {
          throw new Error('Cannot transfer more than ' + balanceOfPayer + ' from payer')
        }

        if (StorageReferenceModel.isStorageReference(this.destination)) {
          this.destinationIsStorageReference = true
        } else if (AccountHelper.isEd25519PublicKey(this.destination)) {
          this.destinationIsStorageReference = false
        } else {
          throw new Error('The destination does not look like a storage reference nor like a Base58 encoded public key')
        }

      }).then(() => {
        if (!this.fromFaucet) {
          this.askForPassword()
        } else {
          this.sendCoins(null)
        }
      }).catch(err => showErrorToast(this, 'Send coins', err.message || 'Cannot send coins to the selected destination'))
    },
    askForPassword() {
      this.$refs.verifyPasswordComponent.showModal({
        account: this.payer,
        title: 'Account verification',
        subtitle: 'Please enter password to verify the account of ' + this.payer.name,
        closeOnIncorrectPwd: false
      })
    },
    sendCoins(password) {
      WrapPromiseTask(async () => {
        const keyPairOfPayer = password ? AccountHelper.generateEd25519KeyPairFrom(password, Bip39Dictionary.ENGLISH, this.payer.entropy) : null

        const service = new Service()
        const result = {account: null, transaction: null}

        if (this.destinationIsStorageReference) {
          if (this.fromFaucet) {
            await service.sendCoinsToAccountFromFaucet(this.destination, this.amount, transaction => result.transaction = transaction)
          } else {
            await service.sendCoinsToAccount(this.payer, keyPairOfPayer, this.destination, this.amount, transactions => {
              if (transactions && transactions.length > 0) {
                result.transaction = transactions[0]
              }
            })
          }

        } else {
          if (this.fromFaucet) {
            throw new Error('Payment to key is currently not implemented for the faucet')
          } else {
            result.account = await service.sendCoinsToPublicKey(this.payer, keyPairOfPayer, this.destination, this.amount, this.anonymous, transactions => {
              if (transactions && transactions.length > 0) {
                result.transaction = transactions[0]
              }
            })
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
    },
    onPasswordVerified(verificationResult) {
      if (verificationResult.verified) {
        this.sendCoins(verificationResult.password)
      }
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Send coins')

    new Service()
        .getCurrentAccountWithFaucet()
        .then(result => {
          this.allowsUnsignedFaucet = result.allowsUnsignedFaucet
          this.payer = result.account
        })
        .catch(error => showErrorToast(this, 'Account', error.message || 'Cannot retrieve account'))
  }
}
</script>

<style scoped>

</style>