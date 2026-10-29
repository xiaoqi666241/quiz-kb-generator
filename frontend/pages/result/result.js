// pages/result/result.js
Page({
  data: {
    correct: 0,
    total: 0,
    rate: 0
  },

  // 接收练习页传来的统计参数
  onLoad(options) {
    const correct = parseInt(options.correct || 0)
    const total = parseInt(options.total || 0)
    const rate = total > 0 ? Math.round(correct / total * 100) : 0
    this.setData({ correct: correct, total: total, rate: rate })
  },

  // 返回首页
  goHome() {
    wx.reLaunch({ url: "/pages/index/index" })
  }
})
