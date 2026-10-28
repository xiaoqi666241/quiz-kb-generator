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

  // 跳转练习页（假数据阶段先不传资料ID，第4天接后端时再传）
  onStartPractice() {
    wx.navigateTo({
      url: "/pages/practice/practice"
    })
  }
})