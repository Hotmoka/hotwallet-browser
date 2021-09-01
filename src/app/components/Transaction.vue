<template>
  <div>
    <h6 class="mt-4 mb-4">Transazione</h6>

    <h5>Confermi la transazione <span v-if="transaction.name">{{transaction.name}} </span> ?</h5>
    <p>Amount: <span v-if="transaction.amount">{{transaction.amount}} Mokas </span> </p>
    <b-button variant="success" @click="onYesClick">Si</b-button>
    <b-button variant="danger"  @click="onNoClick">No</b-button>

    <div id="overlay" v-if="showOverlay">
      <b-icon icon="check-circle-fill" variant="success" style="width: 86px; height: 86px; margin-top: 14rem"></b-icon> <br/>
      <h6 class="text-center" style="font-weight: bold; color: green; margin-top: 2rem;">Transazione eseguita correttamente</h6>
    </div>
  </div>
</template>

<script>
import {EventBus} from "../internal/utils";

import {
  Algorithm,
  InstanceMethodCallTransactionRequestModel,
  NonVoidMethodSignatureModel,
  RemoteNode,
  Signer,
  StorageReferenceModel,
  TransactionReferenceModel,
  VoidMethodSignatureModel
} from "hotweb3";

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
      }
    }
  },
  methods: {
    onYesClick() {
        EventBus.$emit('showSpinner', true)
      this.addTransaction(this).then(result => {
        EventBus.$emit('showSpinner', false)
        this.showOverlay = true

        this.sendTransactionResponse({
          status: true,
          storageValue: result
        }, 3000)
      }).catch(e => {
        EventBus.$emit('showSpinner', false)

        console.error(e)
        this.sendTransactionResponse({
          error: e.message
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
      EventBus.$emit('showSpinner', true)
      this.$browser.storage.local.get('transactionMap').then(result => {
        EventBus.$emit('showSpinner', false)

        if (result && result.transactionMap && result.transactionMap.hasOwnProperty(this.uuid)) {
            const transaction = result.transactionMap[this.uuid]
            this.transaction = {...transaction}
        }
      })
    },
    getPrivateKey: async (self) => {
      const result = await self.$browser.storage.local.get('account')
      if (result && result.account) {
        return result.account.keyPair.privateKey.trim()
      }

      return null
    },
    addTransaction: async (self) => {
      const privateKey = await self.getPrivateKey(self)
      const remoteNode = new RemoteNode(self.$blockchainConfig.remoteNodeUrl, new Signer(Algorithm.ED25519, privateKey));

      const receiver = new StorageReferenceModel(new TransactionReferenceModel('local', self.transaction.receiver), '0')
      const eoaCaller = new StorageReferenceModel(new TransactionReferenceModel('local', self.transaction.caller), '0')
      const nonceOfEoa = await remoteNode.getNonceOf(eoaCaller)
      const gasPrice = await remoteNode.getGasPrice()
      const chainId = await remoteNode.getChainId()

      const method = self.transaction.methodSignature.voidMethod ?
          new VoidMethodSignatureModel(self.transaction.methodSignature.definingClass, self.transaction.methodSignature.methodName, self.transaction.methodSignature.formals) :
          new NonVoidMethodSignatureModel(self.transaction.methodSignature.definingClass, self.transaction.methodSignature.methodName, self.transaction.methodSignature.returnType, self.transaction.methodSignature.formals)

      return await remoteNode.addInstanceMethodCallTransaction(new InstanceMethodCallTransactionRequestModel(
          eoaCaller,
          nonceOfEoa,
          chainId,
          '30000',
          gasPrice,
          new TransactionReferenceModel('local', self.transaction.smartContractAddress),
          method,
          receiver,
          self.transaction.actuals,
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
