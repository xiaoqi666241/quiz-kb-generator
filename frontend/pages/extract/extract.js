// pages/extract/extract.js
const { extractKnowledgeBlocks } = require("../../utils/request")

Page({
  data: {
    text: "",          // 用户粘贴的文本
    extracting: false, // 是否正在提取
    blocks: [],        // 提取出的知识块
    hasResult: false,  // 是否已出结果
    error: ""          // 错误提示文案
  },

  // 输入框内容变化
  onInput(e) {
    this.setData({ text: e.detail.value })
  },

  // 点击提取
  onExtract() {
    const text = this.data.text.trim()
    if (!text) {
      wx.showToast({ title: "请先粘贴文本", icon: "none" })
      return
    }
    this.setData({ extracting: true, hasResult: false, error: "" })

    extractKnowledgeBlocks(text).then((res) => {
      this.setData({ extracting: false })
      if (res.ok) {
        this.setData({ blocks: res.blocks, hasResult: true })
      } else if (res.reason === "not_implemented") {
        this.setData({ error: "该功能尚未开放（后端 /extract 为 P1 功能，暂未实现）" })
      } else {
        this.setData({ error: "后端服务不可用，请先启动本地 FastAPI 服务" })
      }
    })
  }
})
