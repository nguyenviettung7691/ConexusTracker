<template>
  <v-layout class="home">
    <TimeSheet :user="user"/>
  </v-layout>
</template>

<script>
import Vue from 'vue';
import TimeSheet from '@/components/TimeSheet.vue'; // @ is an alias to /src

export default Vue.extend({
  name: 'home',
  props: ['user'],
  components: {
    TimeSheet,
  },
});
</script>
