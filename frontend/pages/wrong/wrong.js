const { getWrong } = require("../../utils/storage")

Page({
  data: {
    wrongList: []
  },

  onShow() {
    this.setData({ wrongList: getWrong() })
  },

  // 重做此题：把题目暂存到全局，跳练习页进入"错题模式"
  onRetry(e) {
    const questionId = e.currentTarget.dataset.id
    const wrong = this.data.wrongList.find(w => w.questionId === questionId)
    if (!wrong) return
    getApp().globalData.retryQuestions = [wrong.question]
    wx.navigateTo({
      url: "/pages/practice/practice?retry=1"
    })
  }
})