// index.js
const { MATERIALS } = require("../../data/materials")

Page({
  data: {
    materials: []
  },

  onLoad() {
    // 页面一加载，就把预置资料读进来
    this.setData({ materials: MATERIALS })
  },

  onSelectMaterial(e) {
    const materialId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: "/pages/blocks/blocks?materialId=" + materialId
    })
  },

  // 跳转错题本
  goWrong() {
    wx.navigateTo({
      url: "/pages/wrong/wrong"
    })
  },

  // 跳转掌握度统计页
  goStats() {
    wx.navigateTo({
      url: "/pages/stats/stats"
    })
  },
  // 跳转粘贴资料提取页
  goExtract() {
    wx.navigateTo({
      url: "/pages/extract/extract"
    })
  }

})
