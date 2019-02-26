<template>
  <v-app>
    <v-toolbar app>
      <v-toolbar-title class="headline text-uppercase">
        <span :style="{color: $vuetify.theme.primary}">conexus</span>
        <span class="font-weight-light">tracker</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-title>
        <span>{{user}}</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        v-if="user.Id"
        :loading="logoutLoading"
        color="blue-grey"
        class="white--text"
        @click="logoutUser"
      >
        Thoát
        <v-icon right dark>highlight_off</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <v-container fluid>
          <v-fade-transition mode="out-in">
            <router-view :user="user"></router-view>
          </v-fade-transition>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import Vue from 'vue';
import { mapState } from 'vuex';
export default Vue.extend({
  data() {
    return {
      logoutLoading: false
    }
  },
  computed: mapState([
    'user'
  ]),
  methods: {
    logoutUser() {
      this.logoutLoading = true;
      this.$store.commit('removeUser');
      this.logoutLoading = false;
      this.$router.replace('login');
    },
  },
});
</script>

<style lang="less">
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
