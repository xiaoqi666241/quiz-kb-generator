// pages/result/result.js
Page({
  data: {
    correct: 0,
    total: 0,
    rate: 0,
    fromRetry: false   // 是否从错题本「重练此题」进入
  },

  // 接收练习页传来的统计参数
  onLoad(options) {
    const correct = parseInt(options.correct || 0)
    const total = parseInt(options.total || 0)
    const rate = total > 0 ? Math.round(correct / total * 100) : 0
    this.setData({
      correct: correct,
      total: total,
      rate: rate,
      fromRetry: options.from === "retry"
    })
  },

  // 返回：错题重练回错题本，普通练习回首页
  goHome() {
    if (this.data.fromRetry) {
      wx.navigateBack({
        delta: 1,
        fail: () => { wx.redirectTo({ url: "/pages/wrong/wrong" }) }
      })
      return
    }
    wx.reLaunch({ url: "/pages/index/index" })
  }
})
