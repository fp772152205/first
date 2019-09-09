//index.js
//获取应用实例
const app = getApp()
const charts = require('../../utils/charts.js');

Page({
  data: {
    SumCount:'',
    SumMiles:'',
    ToDayMiles:'',
    ToDayCount:'',
    Title:'',
    canvasWidth: 0,
    canvasHeight: 0,
    showGetUserInfo: false,
    showBind: false,
    showUpload: false,
    userInfo: {},
    unionId: "",
    openId: "",
    userId: "",
    mobilePhone: "",
    verifyCode: "",
    verifyCodeText: "",
    verifyCodeTime: 0,
    stepData: [],
    lastUploadTime: '',
    orderStepCount: 1,
  },
  // 页面自动加载时数据
  getTextDate(){
    var that = this;
    wx.request({
      url: app.globalData.apiurl + "step/join?phoneNumber=16800000000",
      method: 'GET',
      fail: function (r) {
        that.errorRelaunch("健步活动没找到");
      },
      success: function (rDecrypt) {
       console.log(rDecrypt,'123456789');
        that.setData({ 
          SumCount: rDecrypt.data.data.SumCount, 
          SumMiles: rDecrypt.data.data.SumMiles,                 
          ToDayMiles: rDecrypt.data.data.ToDayMiles, 
          ToDayCount: rDecrypt.data.data.ToDayCount,                     
          Title: rDecrypt.data.data.Title, });
        // that.setData({ showGetUserInfo: false });
        that.setData({ showBind: true });
        that.setData({ verifyCodeText: "获取验证码" });
        //读运动数据
        // that.getWeRunData();
      }
    });
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  //生成柱状图
  setCharts: function (data, categories) {
    var that = this;
    new charts({
      canvasId: 'columnChart',
      type: 'column',
      categories: categories,
      series: [{
        name: '步数',
        data: data
      }],
      yAxis: {
        min: 0,
        max: 100,
        format: function (val) {
          return val;
        }
      },
      width: that.data.canvasWidth - 20,
      height: that.data.canvasHeight,
      legend: false
    });
  },
  //出现错误重新加载
  errorRelaunch: function (msg) {
    wx.hideLoading();
    wx.showModal({
      title: '询问',
      content: msg + ',是否重试？',
      success: function (res) {
        if (res.confirm) {
          wx.reLaunch({
            url: 'index',
          })
        } else if (res.cancel) {
        }
      }
    })
  },
  getTimeString: function (time) {
    return time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate()
      + ' ' + time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
  },

  onLoad: function () {
    this.getTextDate();
    var that = this;
    //柱状图大小
    var t = wx.getSystemInfoSync();
    that.setData({ canvasWidth: wx.getSystemInfoSync().windowWidth });
    that.setData({ canvasHeight: 250 });
    //生成空白图
    var arrCt = [];
    for (var m = 6; m >= 0; m--) {
      var now = new Date(new Date().setDate(new Date().getDate() - m));
      arrCt.push(now.getMonth() + 1 + "-" + now.getDate());
    }
    that.setCharts([10, 20, 30, 40, 50, 50, 60], arrCt);

    wx.showLoading({
      title: '加载健步数据',
    })
    that.checkAuthGetUserInfo();
  },

  //查看微信是否授权读取用户信息
  checkAuthGetUserInfo: function () {
    var that = this;
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting["scope.userInfo"]) {
          that.setData({ showGetUserInfo: true });
          wx.hideLoading();
        }
        else
          that.getUserInfo();
      },
      fail() {
        that.errorRelaunch("小程序加载错误");
      }
    })
  },

  //读取信息
  getUserInfo: function () {
    var that = this;
    wx.login({
      fail: function (rLogin) {
        that.errorRelaunch("微信未登录");
      },
      success: function (rLogin) {
        if (!rLogin.code) {
          that.errorRelaunch("获取登录态失败");
        }
        else {
          app.globalData.loginCode = rLogin.code;
          wx.getUserInfo({
            fail: function (r) {
              that.errorRelaunch("获取用户信息失败");
            },
            success: function (rUserInfo) {
              //取得用户unionId
              wx.request({
                url: app.globalData.apiurl + 'DecryptLoginInfoData',
                data: {
                  encryptedData: rUserInfo.encryptedData,
                  iv: rUserInfo.iv,
                  signature: rUserInfo.signature,
                  rawData: rUserInfo.rawData,
                  code: app.globalData.loginCode
                },
                method: 'POST',
                fail: function (r) {
                  that.errorRelaunch("解析用户信息失败");
                },
                success: function (rDecrypt) {
                  app.globalData.userInfo = rDecrypt.data;
                  that.data.userInfo = app.globalData.userInfo;
                  that.setData({ unionId: rDecrypt.data.unionId, openId: rDecrypt.data.openId });
                  that.setData({ showGetUserInfo: false });

                  //读运动数据
                  that.getWeRunData();
                }
              });
            }
          });
        }
      }
    });
  },

  //读运动数据
  getWeRunData: function () {
    var that = this;
    wx.login({
      fail: function (rLogin) {
        that.errorRelaunch("获取登录态失败");
      },
      success: function (rLogin) {
        if (!rLogin.code) {
          that.errorRelaunch("获取登录态失败");
        }
        else { 
          //调用小程序API: wx.getWeRunData获取微信运动数据（加密的）；
          wx.getWeRunData({
            fail: function (r) {
              wx.hideLoading();
              wx.showModal({
                title: '提示',
                content: '未获得“微信运动”授权，请授权!',
                showCancel: false,
                complete: function (res) {
                  wx.openSetting({
                    success: (res) => {
                      that.getWeRunData();
                    },
                    fail() {
                      that.errorRelaunch("未获得“微信运动”授权");
                    }
                  })
                }
              });
            },
            success(rRun) {
              console.log(rRun.encryptedData);
              console.log(rRun.iv);
              console.log(app.globalData.loginCode)
              app.globalData.loginCode = rLogin.code;
              //解密数据；
              wx.request({
                url: app.globalData.apiurl + 'DecryptStepInfoData',
                data: {
                  encryptedData: rRun.encryptedData,
                  iv: rRun.iv,
                  code: app.globalData.loginCode
                },
                method: 'POST',
                fail: function (r) {
                  that.errorRelaunch("解析运动数据错误");
                },
                success: function (rDecrypt) {
                  console.log(rDecrypt.data)
                  if (rDecrypt.data == null || rDecrypt.data.ArrayValue == null) {
                    wx.hideLoading();
                    wx.showToast({
                      title: '解析运动数据为空白',
                      icon: 'none'
                    })
                  }
                  else {
                    console.log(rDecrypt)
                    console.log(rDecrypt.data.ArrayValue);
                    app.globalData.stepInfo = rDecrypt.data.ArrayValue;
                    //显示图表
                    var arrData = [];
                    var arrCt = [];
                    var i = app.globalData.stepInfo.length >= 7 ? app.globalData.stepInfo.length - 7 : 0;
                    for (; i < app.globalData.stepInfo.length; i++) {
                      var s = app.globalData.stepInfo[i];
                      arrData.push(s.step);
                      arrCt.push((new Date(s.timestamp * 1000).getMonth() + 1) + '-' + new Date(s.timestamp * 1000).getDate());
                    }
                    that.setCharts(arrData, arrCt);
                    //读取用户ID
                    that.getUserId();
                  }
                },
              });
            }
          });
        }
      }
    })
  },

  //读取用户ID
  getUserId: function () {
    var that = this;
    //判断用户是否绑定手机号
    wx.request({
      url: app.globalData.apiurl + 'GetUserId',
      data: {
        openId: app.globalData.userInfo.openId,
        unionId: app.globalData.userInfo.unionId
      },
      method: 'POST',
      fail: function (r) {
        wx.hideLoading();
        wx.showModal({
          title: '询问',
          content: '查询用户信息失败,是否重试？',
          success: function (res) {
            if (res.confirm) {
              that.getUserId();
            } else if (res.cancel) {
            }
          }
        })
      },
      success: function (r) {
        wx.hideLoading();
        if (r.data.IsSuccess && r.data.ArrayValue.length > 0) {
          app.globalData.userId = r.data.ArrayValue[0];
          that.setData({ userId: r.data.ArrayValue[0] });
          that.setData({ showUpload: true });

          wx.showLoading({
            title: '正在上传数据',
          })
          //上传运动步数
          that.uploadStepInfo();
        }
        else {
          that.setData({ showBind: true });
          that.setData({ verifyCodeText: "获取验证码" });
        }
      }
    });
  },

  //上传运动数据
  uploadStepInfo: function () {
    var that = this;
    if (!(app.globalData.userId.length > 0 && app.globalData.stepInfo != null)) {
      wx.hideLoading();
      wx.showModal({
        title: '询问',
        content: '查询用户信息失败,是否重试？',
        success: function (res) {
          if (res.confirm) {
            that.getWeRunData();
          } else if (res.cancel) {
          }
        }
      })
    }
    that.data.lastUploadTime = that.getTimeString(new Date());
    that.setData({ showBind: false });
    that.setData({ showUpload: true });
    //生成上传数据
    var info = "";
    var step = 0;
    for (var i = 0; i < app.globalData.stepInfo.length; i++) {
      var s = app.globalData.stepInfo[i];
      info += (info.length > 0 ? "," : "") + s.timestamp + "|" + s.step;
      step = s.step;
    }
    //上传操作
    wx.request({
      url: app.globalData.apiurl + 'UplaodRunV02',
      data: {
        userId: that.data.userId,
        stepInfo: info
      },
      method: 'POST',
      fail() {
        wx.hideLoading();
        wx.showModal({
          title: '询问',
          content: '同步健步记录失败,是否重试？',
          success: function (res) {
            if (res.confirm) {
              that.uploadStepInfo();
            } else if (res.cancel) {
            }
          }
        })
      },
      success: function (r) {
        if (r.data.IsSuccess) {
          wx.hideLoading();
          wx.showToast({
            title: "同步健步记录成功"
          })
          if (r.data.ArrayValue != null && r.data.ArrayValue.length > 0)
            that.setData({ mobilePhone: r.data.ArrayValue[0] });
          that.setData({ lastUploadTime: that.data.lastUploadTime });
          //if (r.data.ArrayValue != null && r.data.ArrayValue.length > 1)
          //  that.setData({ orderStepCount: r.data.ArrayValue[1] });
        }
        else {
          wx.showModal({
            title: '询问',
            content: '同步健步记录失败,是否重试？',
            success: function (res) {
              if (res.confirm) {
                that.uploadStepInfo();
              } else if (res.cancel) {
              }
            }
          })
        }
      }
    });

  },

  //绑定相关操作
  mobileInputEvent: function (e) {
    this.setData({
      mobilePhone: e.detail.value
    })
  },
  varifyInputEvent: function (e) {
    this.setData({
      verifyCode: e.detail.value
    })
  },
  getVerifyCode: function () {
    var that = this;
    if (that.data.verifyCodeText != "获取验证码")
      return false;
    //检查是否正确
    if (this.data.userInfo == null || this.data.userInfo.nickName == null || this.data.userInfo.nickName.length == 0) {
      wx.showToast({
        title: '请先取得微信授权！',
        icon: 'none'
      })
      return false;
    }
    var regMobile = /^1\d{10}$/;
    if (!regMobile.test(this.data.mobilePhone)) {
      wx.showToast({
        title: '手机号有误！',
        icon: 'none'
      })
      return false;
    }
    //发送验证码
    wx.showLoading({
      title: '正在发送',
    })
    wx.request({
      url: app.globalData.apiurl + 'SendVerifyCode',
      data: {
        mobilePhone: this.data.mobilePhone
      },
      method: 'POST',
      fail: function () {
        wx.hideLoading();
        wx.showToast({
          title: '发送失败',
          icon: 'none'
        })
      },
      success: function (r) {
        wx.hideLoading();
        if (r.data.IsSuccess) {
          wx.showToast({
            title: '发送成功',
            icon: 'none'
          });
          that.data.verifyCodeTime = 120;
          setTimeout(function () {
            that.setTimerVerifyCodeText();
          }, 1000);
        }
        else {
          wx.showToast({
            title: r.data.Message,
            icon: 'none'
          })
        }
      }
    });
  },
  setTimerVerifyCodeText: function () {
    var that = this;
    if (that.data.verifyCodeTime > 0) {
      that.data.verifyCodeTime -= 1;
      that.setData({ verifyCodeText: that.data.verifyCodeTime.toString() });
      setTimeout(function () {
        that.setTimerVerifyCodeText();
      }, 1000);
    }
    else
      that.setData({ verifyCodeText: "获取验证码" });
  },

  /**
   * 绑定操作
   */
  bindWeId: function () {
    var that = this;
    if (this.data.userInfo == null || this.data.userInfo.nickName == null || this.data.userInfo.nickName.length == 0) {
      wx.showToast({
        title: '请先点击“微信授权登录”！',
        icon: 'none'
      })
      return false;
    }
    var regMobile = /^1\d{10}$/;
    if (!regMobile.test(this.data.mobilePhone)) {
      wx.showToast({
        title: '手机号有误！',
        icon: 'none'
      })
      return false;
    }
    var regMobile = /^\d{6}$/;
    if (!regMobile.test(this.data.verifyCode)) {
      wx.showToast({
        title: '请输入验证码！',
        icon: 'none'
      })
      return false;
    }
    //绑定账号
    wx.showLoading({
      title: '正在绑定',
    })
    wx.request({
      url: app.globalData.apiurl + 'BindWeId',
      data: {
        openId: that.data.userInfo.openId,
        unionId: that.data.userInfo.unionId,
        mobilePhone: that.data.mobilePhone,
        verifyCode: that.data.verifyCode
      },
      method: 'POST',
      complete: function () {
        wx.hideLoading();
      },
      success: function (r) {
        if (r.data.IsSuccess) {
          app.globalData.userId = r.data.ArrayValue[0];
          that.setData({
            userId: r.data.ArrayValue[0]
          });
          wx.showToast({
            title: '绑定成功',
            icon: 'none'
          });
          //开始上传
          that.getWeRunData();
          that.setData({ showBind: false });
          that.setData({ showUpload: true });
        }
        else {
          wx.showModal({
            title: '提示',
            content: '绑定失败：' + r.data.Message,
            showCancel: false,
            complete: function (res) {
            }
          })
        }
      }
    });
  },

  uploadWeRunData: function () {
    var that = this;
    if (that.data.lastUploadTime.length > 0 && new Date(that.data.lastUploadTime) > new Date(new Date().setMinutes(new Date().getMinutes() - 1))) {
      wx.showToast({
        title: '上传太频繁,请稍候再试！',
        icon: 'none'
      });
      return;
    }
    that.data.lastUploadTime = that.getTimeString(new Date());
    wx.showLoading({
      title: '上传中',
    })
    that.getWeRunData();
  }

})
