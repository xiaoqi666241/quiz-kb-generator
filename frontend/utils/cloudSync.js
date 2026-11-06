// utils/cloudSync.js
// 云快照同步（P1）：本地数据 → 微信云开发数据库（备份/恢复）
// 前置条件：AppID 已开通云开发 + 下面填入云开发环境 ID
// ⚠️ 云开发配置好之前，所有调用都会返回 { ok:false, reason:"no_cloud" }，页面据此提示/隐藏按钮
const CLOUD_ENV = "" // ← 云开发环境 ID（由封在 11.7 协助部署后填入；为空则云同步不可用）
const COLLECTION = "snapshots"
const BACKUP_KEYS = ["currentPaper", "answerRecords", "wrongQuestions", "stats"]

// 云开发是否可用（env 已配置 + wx.cloud 存在）
function isCloudAvailable() {
  return !!CLOUD_ENV && !!wx.cloud && typeof wx.cloud.database === "function"
}

let _inited = false
function initCloud() {
  if (!isCloudAvailable()) return false
  if (!_inited) {
    wx.cloud.init({ env: CLOUD_ENV, traceUser: true })
    _inited = true
  }
  return true
}

// 备份：读本地 4 个 key → 写入云端 snapshots 集合
function backup() {
  return new Promise((resolve) => {
    if (!initCloud()) {
      resolve({ ok: false, reason: "no_cloud" })
      return
    }
    const payload = {}
    BACKUP_KEYS.forEach(k => { payload[k] = wx.getStorageSync(k) || null })
    wx.cloud.database().collection(COLLECTION).add({
      data: {
        payload: payload,
        version: 1,
        createdAt: new Date().toISOString()
      }
    }).then((res) => {
      resolve({ ok: true, id: res && res._id })
    }).catch((err) => {
      resolve({ ok: false, reason: "cloud_error", message: (err && err.errMsg) || String(err) })
    })
  })
}

// 查询云端最新快照（用于恢复前预览/二次确认）
function fetchLatestSnapshot() {
  return new Promise((resolve) => {
    if (!initCloud()) {
      resolve({ ok: false, reason: "no_cloud" })
      return
    }
    wx.cloud.database().collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get()
      .then((res) => {
        const doc = res && res.data && res.data[0]
        if (!doc) {
          resolve({ ok: false, reason: "empty" })
          return
        }
        resolve({ ok: true, snapshot: doc })
      })
      .catch((err) => {
        resolve({ ok: false, reason: "cloud_error", message: (err && err.errMsg) || String(err) })
      })
  })
}

// 恢复：把快照 payload 写回本地（调用方负责二次确认）
function restore(payload) {
  return new Promise((resolve) => {
    if (!payload) {
      resolve({ ok: false, reason: "empty" })
      return
    }
    BACKUP_KEYS.forEach(k => {
      if (payload[k] !== undefined && payload[k] !== null) {
        wx.setStorageSync(k, payload[k])
      }
    })
    resolve({ ok: true })
  })
}

module.exports = { isCloudAvailable, backup, fetchLatestSnapshot, restore, CLOUD_ENV }
