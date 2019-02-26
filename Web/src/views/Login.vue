<template>
  <div class="login">
    <img alt="Vue logo" src="../assets/logo.png">
    <v-form ref="form" v-model="valid" @keyup.native.enter="valid && login($event)" lazy-validation>
      <v-container>
        <v-layout justify-center>
          <v-flex xs6>
            <!-- <v-text-field
              v-model="email"
              :rules="emailRules"
              label="E-mail"
              required
            ></v-text-field> -->
            <v-text-field
              v-model="TimesheetID"
              :rules="idTimesheetRules"
              label="ID Bảng giờ"
              pattern="[0-9]*" inputmode="numeric"
              required
            ></v-text-field>
            <v-btn
              :disabled="!valid"
              color="success"
              @click="login"
            >
              Vào
            </v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-form>
  </div>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({
  name: 'login',
  data() {
    return {
      valid: false,
      TimesheetID: '',
      email: '',
      emailRules: [
        v => !!v || 'E-mail is required',
        v => /.+@.+/.test(v) || 'E-mail must be valid',
        v => /.+@orientsoftware.net+/.test(v) || 'E-mail domain must be orientsoftware.net'
      ],
      idTimesheetRules: [
        v => !!v || 'ID is required',
      ]
    }
  },
  methods: {
    login() {
      let that = this;
      if (this.$refs.form.validate()) {
        that.$store.commit('setUser', {
          Id: that.TimesheetID.toString()
        });
        that.$router.replace('home');
      }
    }
  }
});
</script>

<style lang="less" scoped>

</style>
