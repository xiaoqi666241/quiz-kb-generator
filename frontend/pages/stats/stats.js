// pages/stats/stats.js
const { getRecords } = require("../../utils/storage")
const { MATERIALS } = require("../../data/materials")

// 建一个"知识点 id → 名称"的映射表，比如 kp_001 → "劳动合同订立"
const pointNameMap = {}
MATERIALS.forEach(m => m.knowledgeBlocks.forEach(kp => { pointNameMap[kp.id] = kp.name }))

Page({
  data: {
    hasData: false,       // 有没有练习记录（决定显示数据还是空提示）
    overview: {},         // 总览：{count, total, correct, accuracy}
    pointStats: [],       // 每个知识点的掌握度
    records: []           // 最近 5 次练习
  },

  onShow() {
    const records = getRecords()
    if (!records.length) {
      this.setData({ hasData: false })
      return
    }

    // —— 1. 总览：把所有记录的数字加起来 ——
    let total = 0, correct = 0
    records.forEach(r => {
      total += r.totalCount
      correct += r.correctCount
    })

    // —— 2. 按知识点分组统计 ——
    const pointMap = {}
    records.forEach(r => (r.answers || []).forEach(a => {
      const key = a.knowledgePointId || "unknown"
      if (!pointMap[key]) pointMap[key] = { total: 0, correct: 0 }
      pointMap[key].total += 1
      if (a.correct) pointMap[key].correct += 1
    }))
    const pointStats = Object.keys(pointMap).map(key => ({
      id: key,
      name: pointNameMap[key] || key,
      total: pointMap[key].total,
      correct: pointMap[key].correct,
      accuracy: Math.round(pointMap[key].correct / pointMap[key].total * 100)
    })).sort((a, b) => a.accuracy - b.accuracy)   // 掌握度从低到高排，弱的排前面

    // —— 3. 最近练习记录（倒序取前 5 条，算好正确率和时间文字） ——
    const recent = records.slice().reverse().slice(0, 5).map(r => ({
      ...r,
      accuracy: Math.round(r.correctCount / r.totalCount * 100),
      createdAtText: new Date(r.createdAt).toLocaleString()
    }))

    this.setData({
      hasData: true,
      overview: { count: records.length, total, correct, accuracy: Math.round(correct / total * 100) },
      pointStats,
      records: recent
    })
  }
})
