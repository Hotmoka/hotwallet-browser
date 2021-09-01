import Vue from 'vue'
import PortalVue from 'portal-vue'
import {BootstrapVue, IconsPlugin} from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import VueRouter from 'vue-router'
import App from './components/App'
import Login from "./components/Login";
import Introduction from "./components/Introduction";
import ImportWallet from "./components/ImportWallet";
import NewWallet from "./components/NewWallet";
import Home from "./components/Home";
import Transaction from "./components/Transaction";

Vue.use(VueRouter)
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(PortalVue)
Vue.config.productionTip = false

global.browser = require('webextension-polyfill')
Vue.prototype.$browser = global.browser

Vue.prototype.$blockchainConfig = {
  remoteNodeUrl: process.env.VUE_APP_BLOCKCHAIN_REMOTE_NODE_URL
}

const router = new VueRouter({
  routes: [
    { path: '/', component: Introduction },
    { path: '/home', component: Home },
    { path: '/login', component: Login },
    { path: '/import-wallet', component: ImportWallet },
    { path: '/new-wallet', component: NewWallet },
    { path: '/transaction', name: 'transaction', component: Transaction, props: true },
    { path: '*', redirect: '/' }
  ]
})

const root = document.getElementById('app')
new Vue({
  router,
  el: '#app',
  render: (h) => h(App, {
    props: {
      appType: root.attributes['app-type'].value
    }
  })
})
