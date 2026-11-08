// pages/file_extract/file_extract.js
// 文件解析页（P1：PDF/Word → /extract_file → 知识块展示）
const { uploadFileForExtract } = require("../../utils/request")

Page({
  data: {
    fileName: "",      // 已选文件名
    uploading: false,  // 是否正在上传解析
    blocks: [],        // 提取出的知识块
    hasResult: false,  // 是否已出结果
    error: ""          // 错误提示文案
  },

  // 选择文件（手机：从聊天文件选；开发者工具：本地文件模拟上传）
  onPickFile() {
    if (this.data.uploading) return
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      extension: ["pdf", "docx"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        this.setData({
          fileName: file.name,
          uploading: true,
          hasResult: false,
          error: ""
        })
        wx.showLoading({ title: "上传解析中...", mask: true })
        this._upload(file.path)
      },
      fail: () => {
        // 用户取消选择，无需提示
      }
    })
  },

  // 上传并解析
  _upload(filePath) {
    uploadFileForExtract(filePath).then((res) => {
      wx.hideLoading()
      this.setData({ uploading: false })
      if (res.ok) {
        this.setData({ blocks: res.blocks, hasResult: true })
      } else if (res.reason === "network") {
        this.setData({ error: "网络连接失败，请确认后端服务已启动" })
      } else {
        this.setData({ error: res.message || "解析失败，请重试" })
      }
    })
  },

  // 去练习：用解析出的知识块出题（复用出题闭环）
  goPractice() {
    if (!this.data.blocks.length) {
      wx.showToast({ title: "没有可用的知识块", icon: "none" })
      return
    }
    getApp().globalData.selectedBlocks = this.data.blocks
    wx.navigateTo({
      url: "/pages/practice/practice"
    })
  }
})
