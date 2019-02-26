<template>
  <v-card class="timesheet">
    <h1>Bảng giờ</h1>
    <h2>{{ fullname }}</h2>
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <v-card-text>
      <v-switch
        v-model="trackCurrentTime"
        label="Theo dõi thời gian hiện tại"
      ></v-switch>
      <v-data-table
        :headers="headers"
        :items="timesheet"
        :loading="loading"
        class="elevation-1"
        hide-actions
      >
        <v-progress-linear color="primary" slot="progress" indeterminate></v-progress-linear>
        <template slot="items" slot-scope="props">
          <td>{{ localizeDate(props.item.osdWorkingDate) }}</td>
          <td>{{ format12Hours(props.item.osdTimeIn) }}</td>
          <td :class="{ ['elevation-5'] : props.item.isCurrentDate }">{{ format12Hours(props.item.osdTimeOut) }}</td>
          <td></td>
          <td :style="{color: props.item.totalTime > 28800 ? $vuetify.theme.success : $vuetify.theme.error}">{{ formatDuration(props.item.totalTime) }}</td>
          <td>{{ format12Hours(props.item.goalTime) }}</td>
        </template>
        <template slot="footer">
          <tr>
            <td :colspan="headers.length" class="text-xs-left">
              <strong>Tổng giờ tuần này: </strong>
              <span>{{ formatDuration(totalThisWeekTime) }}</span>
            </td>
          </tr>
          <tr>
            <td :colspan="headers.length" class="text-xs-left">
              <strong>Số giờ còn thiếu: </strong>
              <span :style="{color: remainingTime < 0 ? $vuetify.theme.success : $vuetify.theme.error}">{{ formatDuration(remainingTime) }}</span>
            </td>
          </tr>
        </template>
        <template slot="no-data">
          <v-alert :value="timesheet.length < 1" color="error" icon="warning">
            Chưa có dữ liệu :(
          </v-alert>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({
  name: 'TimeSheet',
  props: ['user'],
  data() {
    return {
      api: 'https://portaladmin.orientsoftware.net/api/EmployeeTimeSheet/get',
      trackCurrentTime: false,
      maxHoursPerDay: 10,
      goalHoursPerDay: 8,
      headers: [
        { text: 'Ngày', value: 'osdWorkingDate' },
        { text: 'Giờ vào', value: 'osdTimeIn' },
        { text: 'Giờ ra', value: 'osdTimeOut' },
        { text: 'Nghỉ phép', value: '' },
        { text: 'Tổng giờ', value: 'totalTime' },
        { text: 'Đủ giờ', value: 'goalTime' }
      ],
      loading: false,
      fullname: '',
      responseJSON: [],
      totalThisWeekTime: 0,
      remainingTime: 0,
      goalTime: 144000, //5 * 8 * 60 * 60
      error: null
    };
  },
  created() {
    // fetch the data when the view is created and the data is
    // already being observed
    this.fetchData();
    //trigger track current time
    this.trackCurrentTime = true;
  },
  watch: {
    // call again the method if the route changes
    $route: 'fetchData',
    trackCurrentTime(newVal, oldVal) {
      //toggle interval each minute to track current time
      if(newVal){
        this.setCurrentTimeForTimesheet();
        this.intervalTrackCurrentTime = setInterval(() => {
          this.setCurrentTimeForTimesheet();
        }, 6 * 1000);
      }else{
        clearInterval(this.intervalTrackCurrentTime);
        this.fetchData();
      }
    }
  },
  computed: {
    timesheet() {
      let that = this;
      that.totalThisWeekTime = 0;
      let responseJSON = that.responseJSON;
      let i = responseJSON.length;
      while(i--){//loop backward through each date (to prevent missed-index when remove a date)
        let dateTimesheet = responseJSON[i];
        //remove future date
        if(!dateTimesheet.osdTimesheetId){
          responseJSON.splice(i, 1);
          continue;
        }
        //check if this date is current date
        let currentDate = new Date();
        let thisDate = new Date(dateTimesheet.osdWorkingDate);
        if(thisDate.setHours(0,0,0,0) == currentDate.setHours(0,0,0,0)) {
          dateTimesheet.isCurrentDate = true;
          if(that.trackCurrentTime){
            dateTimesheet.osdTimeOut = new Date();
          }
        }
        //calculate total time of this date
        dateTimesheet.totalTime = that.calcTotalTime(dateTimesheet.osdTimeIn, dateTimesheet.osdTimeOut);
        //calculate goal time of this date
        dateTimesheet.goalTime = that.calcGoalTime(dateTimesheet.osdTimeIn);
        //total this week time
        that.totalThisWeekTime += dateTimesheet.totalTime;
      }
      that.remainingTime = that.goalTime - that.totalThisWeekTime;
      return responseJSON;
    },
    maxSecondsPerDay() {
      return this.maxHoursPerDay * 3600;
    }
  },
  beforeDestroy(){
    clearInterval(this.intervalTrackCurrentTime);
  },
  methods: {
    setCurrentTimeForTimesheet() {
      if(this.responseJSON.length > 0){
        let currentDateTimesheet = this.responseJSON.find(dateTimesheet => {
          return dateTimesheet.isCurrentDate == true;
        });
        currentDateTimesheet.osdTimeOut = new Date();
      }
    },
    fetchData() {
      this.error = false;
      this.loading = true;
      let that = this;

      let url = new URL(this.api);
      let monday = this.getMonday();
      let FromDate = this.formatDate(monday);
      let ToDate = this.formatDate(this.getFriday(monday));
      let params = {FromDate, ToDate, EmployeeID: that.user.Id};
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      fetch(url)
      .then(response => response.json()).then(responseJSON => {
        this.fullname = responseJSON[0].osdFullNameVN;
        this.maxHoursPerDay = responseJSON[0].LimitedTime;
        that.responseJSON = responseJSON;
        that.loading = false;
      }).catch(error => {
        console.error(error);
        that.error = error;
      });
    },
    getMonday() {
      let date = new Date(),
          day = date.getDay(),
          diff = date.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
      return new Date(date.setDate(diff));
    },
    getFriday(monday) {
      return new Date(monday.setDate(monday.getDate() + 4));
    },
    //Date => yyyy-mm-dd
    formatDate(date) {
      let month = '' + (date.getMonth() + 1),
          day = '' + date.getDate(),
          year = date.getFullYear();

      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;

      return [year, month, day].join('-');
    },
    //Date => Weekday
    localizeDate(date) {
      return new Date(date).toLocaleDateString('vi-VN', { weekday: 'long' });
    },
    calcTotalTime(timeIn, timeOut) {
      //calculate difference
      let localeTimeIn = new Date(timeIn);
      let localetimeOut = new Date(timeOut);
      //IF same date info: return 0
      if(localeTimeIn.getTime() === localetimeOut.getTime()){
        return '0';
      }
      //IF time out at break time: set time out at 11:30 AM
      if((localetimeOut.getHours() == 11 && localetimeOut.getMinutes() > 30) || localetimeOut.getHours() == 12){
        localetimeOut.setHours(11);
        localetimeOut.setMinutes(30);
      }
      //IF time in at break time: set time in at 13:00 PM
      if((localeTimeIn.getHours() == 11 && localeTimeIn.getMinutes() > 30) || localeTimeIn.getHours() == 12){
        localeTimeIn.setHours(13);
        localeTimeIn.setMinutes(0);
      }
      let diff = localeTimeIn.getTime() - localetimeOut.getTime();
      //convert to seconds
      let totalSeconds = Math.abs(diff / 1000);
      //IF time in morning & time out afternoon: substract break time
      if(localeTimeIn.getHours() < 13 && localetimeOut.getHours() >= 13){
        totalSeconds -= 5400; //5400 = break time
      }
      //IF total hours > maxHours: reset to maxHours
      if(totalSeconds > this.maxSecondsPerDay){
        totalSeconds = this.maxSecondsPerDay;
      }
      return totalSeconds;
    },
    //Date => hh:mm
    formatDuration(time) {
      time = Number(time);
      var h = Math.floor(time / 3600);
      var m = Math.floor(time % 3600 / 60);
      var s = Math.floor(time % 3600 % 60);

      var hDisplay = h != 0 ? h + " giờ " : "";
      var mDisplay = m != 0 ? m + " phút " : "";
      var sDisplay = s != 0 ? s + " giây" : "";
      return hDisplay + mDisplay + sDisplay; 
    },
    //Date => hh:mm PM
    format12Hours(time) {
      return new Date(time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit', hour12: true });
    },
    calcGoalTime(timeIn) {
      let localeTimeIn = new Date(timeIn);
      //IF time in at break time: set time in at 13:00 PM
      if((localeTimeIn.getHours() == 11 && localeTimeIn.getMinutes() > 30) || localeTimeIn.getHours() == 12){
        localeTimeIn.setHours(13);
        localeTimeIn.setMinutes(0);
      }
      //get goal time in miliseconds
      let goalTime = localeTimeIn.getTime() + (this.goalHoursPerDay * 60 * 60 * 1000);
      //IF time in morning: add break time
      if(localeTimeIn.getHours() < 13){
        goalTime += 5400 * 1000; //5400 = break time in mil-secs
      }
      return goalTime;
    }
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">

</style>
