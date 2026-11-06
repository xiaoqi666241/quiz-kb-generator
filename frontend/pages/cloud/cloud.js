// pages/cloud/cloud.js
// 云快照（P1）：备份 / 恢复本地数据（恢复前二次确认，防止覆盖本地新数据）
const { isCloudAvailable, backup, fetchLatestSnapshot, restore } = require("../../utils/cloudSync")

Page({
  data: {
    cloudReady: false,  // 云开发是否已配置可用
    backing: false,     // 是否备份中
    restoring: false,   // 是否恢复中
    lastText: ""        // 云端最新快照时间
  },

  onLoad() {
    this.setData({ cloudReady: isCloudAvailable() })
    this._refreshLast()
  },

  // 备份到云端
  onBackup() {
    if (this.data.backing) return
    this.setData({ backing: true })
    backup().then((res) => {
      this.setData({ backing: false })
      if (res.ok) {
        wx.showToast({ title: "✅ 备份成功", icon: "none" })
        this._refreshLast()
      } else {
        this._toastError(res)
      }
    })
  },

  // 从云端恢复（先查最新快照 → 弹窗二次确认 → 写回本地）
  onRestore() {
    if (this.data.restoring) return
    if (!this.data.cloudReady) {
      this._toastError({ reason: "no_cloud" })
      return
    }
    this.setData({ restoring: true })
    fetchLatestSnapshot().then((res) => {
      this.setData({ restoring: false })
      if (!res.ok) {
        if (res.reason === "empty") {
          wx.showToast({ title: "云端还没有备份", icon: "none" })
        } else {
          this._toastError(res)
        }
        return
      }
      const snap = res.snapshot
      const timeText = snap.createdAt ? new Date(snap.createdAt).toLocaleString() : "未知时间"
      wx.showModal({
        title: "⚠️ 恢复确认",
        content: "将用云端快照（" + timeText + "）覆盖本机错题本、答题记录与统计。\n\n本机新产生的数据会丢失，确定恢复吗？",
        confirmText: "确定恢复",
        confirmColor: "#dc2626",
        success: (m) => {
          if (!m.confirm) return
          restore(snap.payload).then((r) => {
            if (r.ok) {
              wx.showModal({
                title: "✅ 恢复成功",
                content: "本地数据已还原。返回首页后重新进入页面即可看到最新数据。",
                showCancel: false,
                success: () => wx.navigateBack()
              })
            }
          })
        }
      })
    })
  },

  // 刷新"云端最新快照"时间（可选，云不可用时不查）
  _refreshLast() {
    if (!this.data.cloudReady) return
    fetchLatestSnapshot().then((res) => {
      if (res.ok && res.snapshot.createdAt) {
        this.setData({ lastText: "云端最新快照：" + new Date(res.snapshot.createdAt).toLocaleString() })
      }
    })
  },

  _toastError(res) {
    if (res.reason === "no_cloud") {
      wx.showToast({ title: "云开发未配置，暂不可用", icon: "none" })
    } else if (res.reason === "cloud_error") {
      wx.showToast({ title: "云端异常：" + (res.message || "请稍后再试"), icon: "none" })
    } else {
      wx.showToast({ title: "操作失败，请重试", icon: "none" })
    }
  }
})
