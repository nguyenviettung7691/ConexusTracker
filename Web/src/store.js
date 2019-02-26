import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: {
      Id: null
    },
    timesheet: null
  },
  getters: {
    getUser(state) {
      return state.user;
    }
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    removeUser(state) {
      state.user = {
        Id: null
      };
    }
  }
});
