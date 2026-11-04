// pages/stream/stream.js
// 流式出题演示页（打字机效果）
// 当前阶段：用真实题库前 3 题做【本地模拟流】跑通 UI 与基础逻辑
// 11.5 联调：把 startStream() 换成真实 SSE（wx.request enableChunked 监听 data: 逐题 / [DONE] / [ERROR]）
const { PRESET_QUESTIONS } = require("../../data/preset")

Page({
  data: {
    qIndex: 0,          // 当前题号（从 0 开始）
    total: 3,           // 固定演示 3 题
    typingStem: "",     // 正在逐字输出的题干
    typedOptions: [],   // 已输出的选项
    typingDone: false,  // 当前题是否打字完毕
    allDone: false,     // 3 题全部完成
    streamError: false, // 是否流式出错（预留：真实联调 [ERROR] 时置 true 并清空半成品）
    tip: ""             // 顶部状态提示
  },

  onLoad() {
    // 模拟数据源：真实题库前 3 道题（11.5 联调时替换为 /generate_stream 返回）
    this.mockQuestions = PRESET_QUESTIONS.slice(0, 3)
    this.startStream()
  },

  // 开始（或重试）流式输出
  startStream() {
    this._stop()
    this.setData({
      qIndex: 0,
      allDone: false,
      streamError: false,
      typingDone: false,
      typingStem: "",
      typedOptions: []
    })
    this._typeQuestion(0)
  },

  // 打字输出第 i 题题干（40ms/字），完成后逐条出选项
  _typeQuestion(i) {
    if (i >= this.mockQuestions.length) {
      // 全部题目输出完毕 → [DONE]
      this.setData({ allDone: true, typingDone: true, tip: "出题完成（[DONE]）" })
      return
    }
    const q = this.mockQuestions[i]
    this.setData({
      qIndex: i,
      tip: "正在生成第 " + (i + 1) + "/" + this.mockQuestions.length + " 题...",
      typingDone: false,
      typedOptions: []
    })
    let pos = 0
    this._timer = setInterval(() => {
      if (pos <= q.stem.length) {
        this.setData({ typingStem: q.stem.slice(0, pos) })
        pos++
      } else {
        clearInterval(this._timer)
        this._showOptions(i, 0)
      }
    }, 40)
  },

  // 逐条显示选项（120ms/条）
  _showOptions(i, optIdx) {
    const q = this.mockQuestions[i]
    if (optIdx >= q.options.length) {
      // 本题输出完毕，稍作停顿进入下一题
      this.setData({ typingDone: true })
      this._timer = setTimeout(() => this._typeQuestion(i + 1), 800)
      return
    }
    this.setData({ typedOptions: this.data.typedOptions.concat(q.options[optIdx]) })
    this._timer = setTimeout(() => this._showOptions(i, optIdx + 1), 120)
  },

  // 流式出错兜底（预留）：清空半成品，无感切本地题库
  // 11.5 联调：收到 data: [ERROR] 或断网时调用
  onStreamError() {
    this._stop()
    this.setData({ streamError: true, typingStem: "", typedOptions: [] })
    wx.showToast({ title: "生成中断，已切换本地题库", icon: "none" })
  },

  _stop() {
    if (this._timer) {
      clearInterval(this._timer)
      clearTimeout(this._timer)
      this._timer = null
    }
  },

  onUnload() {
    this._stop()
  },

  // 出题完成 → 把 3 题交给练习页答题（复用判题闭环）
  goPractice() {
    getApp().globalData.streamQuestions = this.mockQuestions
    wx.navigateTo({
      url: "/pages/practice/practice?stream=1"
    })
  }
})
