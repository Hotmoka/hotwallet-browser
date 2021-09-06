import Vue from 'vue'
import PortalVue from 'portal-vue'
import {BootstrapVue, IconsPlugin} from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import VueRouter from 'vue-router'
import App from './components/App'
import Login from "./components/account/Login";
import Introduction from "./components/Introduction";
import ImportWallet from "./components/account/ImportAccount";
import NewWallet from "./components/account/NewAccount";
import Home from "./components/Home";
import Transaction from "./components/Transaction";
import {decorateBrowserObject} from "../internal/utils";
import Account from "./components/account/Account";

Vue.use(VueRouter)
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(PortalVue)
Vue.config.productionTip = false

global.browser = require('webextension-polyfill')
Vue.prototype.$browser = global.browser
decorateBrowserObject(Vue.prototype.$browser)

Vue.prototype.$blockchainConfig = {
  remoteNodeUrl: process.env.VUE_APP_BLOCKCHAIN_REMOTE_NODE_URL
}

const router = new VueRouter({
  routes: [
    { path: '/', component: Introduction },
    { path: '/home', component: Home },
    { path: '/login', component: Login },
    { path: '/import-account', component: ImportWallet },
    { path: '/new-account', component: NewWallet },
    { path: '/account', component: Account, props: {editAccount: false} },
    { path: '/edit-account', component: Account, props: {editAccount: true} },
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


