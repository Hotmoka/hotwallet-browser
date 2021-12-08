<template>
  <div class="content text-center">
    <div class="center">
      <img src="../assets/img/logo-web-transparent.png" height="128" width="400" alt="hotmoka" id="logo-hotmoka">

      <h6 class="title">Are you new to Hotwallet ?</h6>

      <b-button @click="onCreateKeyClick" variant="outline-primary mt-3">Create key</b-button>
      <p class="mt-3">or</p>
      <b-button @click="onImportAccountClick" variant="outline-primary">Import account</b-button>
    </div>

  </div>
</template>

<script>

import {pushRoute} from "../internal/router";

export default {
  name: "Welcome",
  methods: {
    onCreateKeyClick() {
      pushRoute('/create-key')
    },
    onImportAccountClick() {
      pushRoute('/import-account')
    }
  }
};
</script>

<style lang="scss" scoped>
.center {
  position: absolute;
  top: 40%;
  left: 50%;
  -ms-transform: translateX(-50%) translateY(-50%);
  -webkit-transform: translate(-50%,-50%);
  transform: translate(-50%,-50%);
}

.title {
  margin-top: 4rem;
  margin-bottom: 2rem;
}
</style>
