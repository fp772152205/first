//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

  },
  globalData: {
    loginCode:'',
    userInfo: null,
    userId:'',
    apiurl:"http://192.168.8.82:1002/werun/",
    appPreUrl:"",
    stepInfo:null
  }
})