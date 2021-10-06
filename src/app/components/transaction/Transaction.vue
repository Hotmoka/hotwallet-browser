<template>
  <div class="content">
    <VerifyPasswordModal ref="verifyPasswordComponent" @onPasswordVerified="onPasswordVerified" @onCancel="onCancelPasswordCheck"></VerifyPasswordModal>

    <div class="text-center" v-if="transaction && account">
      <h5 class="text-secondary mb-4">{{ transaction.name }} </h5>

      <div class="d-flex justify-content-center">
        <div class="text-left form-container">
          <b-form-group>
            <label>Amount</label>
            <p class="txt-secondary">{{ transaction.amount }} Panarea </p>
          </b-form-group>

          <b-form-group>
            <label>Transaction Gas</label>
            <p class="txt-secondary">{{ this.transaction.gas }} Panarea </p>
          </b-form-group>

          <b-form-group>
            <label>Payer {{account.name }}</label>
            <p class="txt-secondary">{{ account.reference }} </p>
          </b-form-group>

        </div>
      </div>

      <h5 class="mt-3 mb-3">Confirm transaction ?</h5>
      <b-button variant="success" @click="onTransactionClick">Yes</b-button>
      <b-button variant="danger" @click="onRejectTransactionClick">No</b-button>
    </div>

    <div id="overlay" v-if="showOverlay">
      <div class="text-center" v-if="!failedTransaction">
        <b-icon icon="check-circle-fill" variant="success" class="icon-overlay"></b-icon>
        <br/>
        <h6 class="text-center txt-successful">Transaction successful</h6>
      </div>
      <div class="text-center" v-if="failedTransaction">
        <b-icon icon="x-circle-fill" variant="danger" class="icon-overlay"></b-icon>
        <br/>
        <h6 class="text-center txt-error" v-if="errorMessage">{{errorMessage}}</h6>
        <br/>
      </div>
    </div>
  </div>
</template>

<script>
import {EventBus, showErrorToast, WrapPromiseTask} from "../../internal/utils";
import VerifyPasswordModal from "../features/VerifyPasswordModal";
import {
  AccountHelper,
  Algorithm, Bip39Dictionary,
  InstanceMethodCallTransactionRequestModel,
  NonVoidMethodSignatureModel,
  RemoteNode,
  Signer,
  StorageReferenceModel,
  VoidMethodSignatureModel
} from "hotweb3";


export default {
  name: "Transaction",
  components: {VerifyPasswordModal},
  data() {
    return {
      showOverlay: false,
      failedTransaction: false,
      errorMessage: null,
      uuid: null,
      transaction: {
        name: null,
        amount: null,
        smartContractAddress: null,
        methodSignature: null,
        receiver: null,
        actuals: [],
        gas: '30000',
        timer: 51
      },
      account: null,
      privateKey: null
    }
  },
  methods: {
    showTransactionErrorView(message) {
      this.showOverlay = true
      this.failedTransaction = true
      this.errorMessage = message || 'Transaction failed'
    },
    onPasswordVerified(result) {
       if (result.verified) {
        WrapPromiseTask(async () => {
            const keyPair = AccountHelper.generateEd25519KeyPairFrom(result.password, Bip39Dictionary.ENGLISH, this.account.entropy)
            return keyPair.privateKey
        }).then(privateKey => {
          this.privateKey = privateKey
          this.getTransactionDetails()
        }).catch(err => showErrorToast(this, 'Account', err.message || 'Cannot verify account'))
      }
    },
    onCancelPasswordCheck() {
      this.sendTransactionResponse({
        status: false,
        error: 'Transaction rejected by payer'
      }, 0)
    },
    onTransactionClick() {
      WrapPromiseTask(async () => {
        const remoteNode = new RemoteNode(this.$network.get().url, new Signer(Algorithm.ED25519, this.privateKey));

        const caller = StorageReferenceModel.newStorageReference(this.account.reference)
        const nonceOfEoa = await remoteNode.getNonceOf(caller)
        const gasPrice = await remoteNode.getGasPrice()
        const chainId = await remoteNode.getChainId()

        const method = this.transaction.methodSignature.voidMethod ?
            new VoidMethodSignatureModel(this.transaction.methodSignature.definingClass, this.transaction.methodSignature.methodName, this.transaction.methodSignature.formals) :
            new NonVoidMethodSignatureModel(this.transaction.methodSignature.definingClass, this.transaction.methodSignature.methodName, this.transaction.methodSignature.returnType, this.transaction.methodSignature.formals)

        const request = new InstanceMethodCallTransactionRequestModel(
            caller,
            nonceOfEoa,
            chainId,
            this.transaction.gas,
            gasPrice,
            this.transaction.smartContractAddress,
            method,
            this.transaction.receiver,
            this.transaction.actuals,
            remoteNode.signer
        )
        const storageValue = await remoteNode.addInstanceMethodCallTransaction(request);

        return {storageValue, transaction: request.getReference(request.signature)}
      }).then(result => {
        this.showOverlay = true

        this.sendTransactionResponse({
          status: true,
          storageValue: result.storageValue,
          transaction: result.transaction
        })
      }).catch(err => {
        console.error(err)
        this.showTransactionErrorView(err.message || 'Transaction failed')
        this.sendTransactionResponse({
          status: false,
          error: err.message || 'Transaction failed'
        })
      })
    },
    onRejectTransactionClick() {
      this.sendTransactionResponse({
        status: false,
        error: 'Transaction reject by payer'
      })
    },
    sendTransactionResponse(result, timeout = 4000) {
      this.$browser.runtime.sendMessage({
        hotmoka: {
          type: 'transactionResult',
          transactionResult: {
            uuid: this.uuid,
            status: result.status,
            storageValue: result.storageValue,
            transaction: result.transaction,
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
      WrapPromiseTask(async() => {

        if (!this.uuid) {
          throw new Error('Transaction non found')
        }
        const transactions = await this.$storageApi.getStore('transactions')
        if (!transactions || !transactions.hasOwnProperty(this.uuid)) {
          throw new Error('Transaction non found')
        }

        return transactions[this.uuid]
      }).then(result => {
        this.transaction = {...this.transaction, ...result}
      }).catch(err => {
        this.showTransactionErrorView(err.message || 'Cannot start transaction')
        this.sendTransactionResponse({
          status: false,
          error: err.message || 'Cannot start transaction'
        })
      })
    },
    setTransactionTimer() {
      const timer = setInterval(() => {
        this.transaction.timer--

        if (this.transaction.timer === 0) {
          clearInterval(timer)
          this.showTransactionErrorView('Transaction cancelled for timeout')
          this.sendTransactionResponse({
            status: false,
            error: 'Transaction cancelled for timeout'
          })
        }
      }, 1000);
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Transaction')

    this.uuid = this.$route.params.uuid
    this.setTransactionTimer()

    WrapPromiseTask(async () => {
      return this.$storageApi.getCurrentAccount(this.$network.get())
    }).then(account => {
      this.account = {...account}
      this.$refs.verifyPasswordComponent.showModal({
        account: this.account,
        title: 'Account verification',
        subtitle: 'Please enter password to verify the account of ' + this.account.name,
        btnActionName: 'Verify',
        closeOnIncorrectPwd: false
      })
    }).catch(err => {
      this.showTransactionErrorView(err.message || 'Cannot retrieve account')
      this.sendTransactionResponse({
        status: false,
        error: err.message || 'Cannot start transaction'
      })
    })
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
  background-color: rgba(255, 255, 255, 0.85);
  z-index: 12;
  cursor: pointer;
}

.icon-overlay {
  width: 86px;
  height: 86px;
  margin-top: 14rem;
}

.txt-successful {
  font-weight: bold;
  color: green;
  margin-top: 2rem;
}

.txt-error {
  font-weight: bold;
  color: red;
  margin-top: 2rem;
  word-break: break-word;
}
</style>
