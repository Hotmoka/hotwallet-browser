<template>
  <div class="content">
    <h6 class="mb-4 text-center">Receipt</h6>


  </div>
</template>

<script>
export default {
  name: "CoinsReceipt",
  props: {
    account: Object,
    from: String,
    to: String,
    destinationIsStorageReference: Boolean,
    fromFaucet: Boolean,
    amount: String
  }
}
</script>

<style scoped>

</style>