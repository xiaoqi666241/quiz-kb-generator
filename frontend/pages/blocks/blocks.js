const { MATERIALS } = require("../../data/materials")

Page({
  data: {
    title: "",
    blocks: []
  },

  onLoad(options) {
    // options 里是上一个页面传来的参数（materialId）
    const materialId = options.materialId
    const material = MATERIALS.find(m => m.materialId === materialId)
    if (material) {
      this.setData({
        title: material.title,
        blocks: material.knowledgeBlocks
      })
    }
  },

  // 跳转练习页：把选中的知识块传给练习页（供后端 LLM 出题）
  onStartPractice() {
    getApp().globalData.selectedBlocks = this.data.blocks
    wx.navigateTo({
      url: "/pages/practice/practice"
    })
  },

  // 跳转流式演示页（打字机效果，固定 3 题）
  onStreamDemo() {
    getApp().globalData.selectedBlocks = this.data.blocks
    wx.navigateTo({
      url: "/pages/stream/stream"
    })
  },

  // 限时练习：整卷 3 分钟倒计时，到时强制交卷
  onTimedPractice() {
    getApp().globalData.selectedBlocks = this.data.blocks
    wx.navigateTo({
      url: "/pages/practice/practice?timed=1"
    })
  },

  // 闪卡复习：正面题干，翻面看答案解析
  onFlashcard() {
    wx.navigateTo({
      url: "/pages/flashcard/flashcard"
    })
  }
})