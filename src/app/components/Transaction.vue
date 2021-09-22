<template>
  <div class="content">
    <h6 class="mb-4">Transaction</h6>

    <h5>Confirm transaction <span v-if="transaction.name">{{ transaction.name }} </span> ?</h5>
    <p>Amount: <span v-if="transaction.amount">{{ transaction.amount }} Mokas </span></p>
    <b-button variant="success" @click="onYesClick">Yes</b-button>
    <b-button variant="danger" @click="onNoClick">No</b-button>

    <div id="overlay" v-if="showOverlay">
      <b-icon icon="check-circle-fill" variant="success" style="width: 86px; height: 86px; margin-top: 14rem"></b-icon>
      <br/>
      <h6 class="text-center" style="font-weight: bold; color: green; margin-top: 2rem;">Transaction successful</h6>
    </div>

    <b-modal v-model="showModal" centered :hideHeaderClose="true" title="Account">
      <p>Please enter password to verify account</p>
      <div class="text-left form-container">
        <b-form-group
            id="i-pwd"
            label="Password"
            label-for="i-pwd"
            :invalid-feedback="invalidFeedback"
            :state="state"
        >
          <b-form-input type="password" id="i-pwd" v-model="password" :state="state" trim></b-form-input>
        </b-form-group>
      </div>

      <template #modal-footer>
        <b-button @click="onModalActionClick(false)" variant="secondary">Cancel</b-button>
        <b-button @click="onModalActionClick(true)" variant="primary" :disabled="!state">Verify</b-button>
      </template>

    </b-modal>


  </div>
</template>

<script>
import {showErrorToast, WrapPromiseTask} from "../internal/utils";

import {
  AccountHelper,
  Algorithm, Bip39Dictionary,
  InstanceMethodCallTransactionRequestModel,
  NonVoidMethodSignatureModel,
  RemoteNode,
  Signer,
  StorageReferenceModel,
  TransactionReferenceModel,
  VoidMethodSignatureModel
} from "hotweb3";
import {invalidPasswordFeedback, statePassword} from "../internal/validators";

export default {
  name: "Transaction",
  props: {
    uuid: String
  },
  data() {
    return {
      showOverlay: false,
      transaction: {
        name: null,
        amount: null,
        caller: null,
        smartContractAddress: null,
        methodSignature: null,
        receiver: null,
        actuals: []
      },
      password: null,
      privateKey: null,
      showModal: true
    }
  },
  computed: {
    state() {
      return statePassword(this.password)
    },
    invalidFeedback() {
      return invalidPasswordFeedback(this.password)
    }
  },
  methods: {
    onModalActionClick(selection) {
      if (!selection) {
        this.sendTransactionResponse({
          status: false
        }, 0)
      } else {
        WrapPromiseTask(async () => {
          const account = await this.$storageApi.getCurrentAccount(this.$network.get())
          const publicKeyVerified = AccountHelper.verifyPublicKey(
              this.password,
              account.entropy,
              Bip39Dictionary.ENGLISH,
              account.publicKey
          )

          if (publicKeyVerified) {
            const keyPair = AccountHelper.generateEd25519KeyPairFrom(this.password, Bip39Dictionary.ENGLISH, account.entropy)
            return keyPair.privateKey
          } else {
            throw new Error('Wrong password')
          }
        }).then(privateKey => {
          this.privateKey = privateKey
          this.showModal = false
        }).catch(err => showErrorToast(this, 'Account', err.message ? err.message : 'Cannot verify account'))
      }
    },
    onYesClick() {
      WrapPromiseTask(() => this.addTransaction())
          .then(result => {
            this.showOverlay = true

            this.sendTransactionResponse({
              status: true,
              storageValue: result
            }, 3000)
          })
          .catch(err => {
            console.error(err)
            this.sendTransactionResponse({
              error: err.message
            })
      })
    },
    onNoClick() {
      this.sendTransactionResponse({
        status: false
      }, 0)
    },
    sendTransactionResponse(result, timeout) {
      this.$browser.runtime.sendMessage({
        hotmoka: {
          type: 'transactionResult',
          transactionResult: {
            uuid: this.uuid,
            status: result.status,
            storageValue: result.storageValue,
            error: result.error
          }
        }
      })

      setTimeout(() => {
        this.$browser.tabs.getCurrent().then((tab) => {
          this.$browser.tabs.remove(tab.id);
        })
      }, timeout)
    },
    getTransactionDetails() {
      this.$browser.getFromStorage('transactionMap').then(result => {
        if (result && result.transactionMap && result.transactionMap.hasOwnProperty(this.uuid)) {
          const transaction = result.transactionMap[this.uuid]
          this.transaction = {...transaction}
        } else {
          showErrorToast(this, 'Transaction', 'Cannot begin transaction')
          this.sendTransactionResponse({
            error: 'Cannot begin transaction'
          })
        }
      })
    },
    addTransaction: async function() {
      const remoteNode = new RemoteNode(this.$network.get().url, new Signer(Algorithm.ED25519, this.privateKey));

      const receiver = new StorageReferenceModel(new TransactionReferenceModel('local', this.transaction.receiver), '0')
      const eoaCaller = new StorageReferenceModel(new TransactionReferenceModel('local', this.transaction.caller), '0')
      const nonceOfEoa = await remoteNode.getNonceOf(eoaCaller)
      const gasPrice = await remoteNode.getGasPrice()
      const chainId = await remoteNode.getChainId()

      const method = this.transaction.methodSignature.voidMethod ?
          new VoidMethodSignatureModel(this.transaction.methodSignature.definingClass, this.transaction.methodSignature.methodName, this.transaction.methodSignature.formals) :
          new NonVoidMethodSignatureModel(this.transaction.methodSignature.definingClass, this.transaction.methodSignature.methodName, this.transaction.methodSignature.returnType, this.transaction.methodSignature.formals)

      return await remoteNode.addInstanceMethodCallTransaction(new InstanceMethodCallTransactionRequestModel(
              eoaCaller,
              nonceOfEoa,
              chainId,
              '30000',
              gasPrice,
              new TransactionReferenceModel('local', this.transaction.smartContractAddress),
              method,
              receiver,
              this.transaction.actuals,
              remoteNode.signer
          )
      );
    }
  },
  created() {
    this.getTransactionDetails()
  }
}
</script>

<style lang="scss" scoped>
#overlay {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 12;
  cursor: pointer;
}
</style>
