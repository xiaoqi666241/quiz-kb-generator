// pages/stream/stream.js
// 流式出题演示页（打字机效果）
// 数据源：后端 /generate_stream（SSE，wx.request enableChunked 逐帧接收）
//   - count=99 → 后端假数据流（联调阶段，不依赖大模型 key）
//   - count=3  → 真实大模型流（答辩演示，最多 3 题）
// 异常兜底：收到 [ERROR] / 断网 / 无题返回 → 自动切本地题库（PRESET_QUESTIONS 前 3 题），保证演示不中断
const { PRESET_QUESTIONS } = require("../../data/preset")

const FAKE_STREAM = true // true=联调假数据流(count=99)；答辩演示前改为 false 走真实 LLM 流(count=3)

Page({
  data: {
    qIndex: 0,          // 当前题号（从 0 开始）
    total: 3,           // 固定演示 3 题
    typingStem: "",     // 正在逐字输出的题干
    typedOptions: [],   // 已输出的选项
    typingDone: false,  // 当前题是否打字完毕
    allDone: false,     // 3 题全部完成
    streamError: false, // 是否流式出错
    tip: ""             // 顶部状态提示
  },

  onLoad() {
    this.questions = []      // 本轮待渲染题目（真实流收到 / 兜底题库）
    this._sseBuffer = ""     // SSE 碎包聚合缓冲
    this.streamTask = null
    this._startRealStream()
  },

  // ========== 真实 SSE 接入 ==========
  _startRealStream() {
    const { BASE_URL } = require("../../utils/request")
    const { MATERIALS } = require("../../data/materials")
    const selected = getApp().globalData.selectedBlocks
    const blocks = selected && selected.length ? selected : MATERIALS[0].knowledgeBlocks
    const count = FAKE_STREAM ? 99 : 3
    this.setData({ tip: "正在连接生成服务..." })

    this.streamTask = wx.request({
      url: BASE_URL + "/generate_stream",
      method: "POST",
      data: {
        knowledge_blocks: blocks,
        question_types: ["single", "blank"],
        count: count,
        existing_stems: []
      },
      enableChunked: true,
      header: { "Content-Type": "application/json" },
      success: () => {},
      fail: () => {
        this._fallbackLocal("网络连接失败")
      }
    })

    // 逐帧接收：累积 buffer，按 \n\n 分帧解析 data:
    this.streamTask.onChunkReceived(res => {
      this._sseBuffer += _decodeArrayBuffer(res.data)
      this._parseSSE()
    })
  },

  // 解析 SSE 帧：data: {json} / data: [DONE] / data: [ERROR]
  _parseSSE() {
    let idx
    while ((idx = this._sseBuffer.indexOf("\n\n")) >= 0) {
      const frame = this._sseBuffer.slice(0, idx)
      this._sseBuffer = this._sseBuffer.slice(idx + 2)
      const line = frame.trim()
      if (!line.startsWith("data:")) continue
      const payload = line.slice(5).trim()

      if (payload === "[DONE]") {
        if (this.questions.length === 0) {
          this._fallbackLocal("后端无题目返回")
        } else {
          this._beginRender()
        }
        return
      }
      if (payload === "[ERROR]") {
        this._fallbackLocal("生成中断")
        return
      }
      try {
        const q = JSON.parse(payload)
        if (q && q.stem) this.questions.push(q)
      } catch (e) {
        // 半截 JSON 帧：忽略，等后续帧拼完整
      }
    }
  },

  // 流式异常兜底：清空半成品，无感切本地题库
  _fallbackLocal(reason) {
    this._stop()
    console.log("[stream] 流式失败，切本地题库:", reason)
    this.questions = PRESET_QUESTIONS.slice(0, 3)
    this.setData({ streamError: false })
    wx.showToast({ title: "已切换本地题库", icon: "none" })
    this._beginRender()
  },

  // 开始打字机渲染（题目已就绪）
  _beginRender() {
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
    if (i >= this.questions.length) {
      this.setData({ allDone: true, typingDone: true, tip: "出题完成（[DONE]）" })
      return
    }
    const q = this.questions[i]
    this.setData({
      qIndex: i,
      tip: "正在生成第 " + (i + 1) + "/" + this.questions.length + " 题...",
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
    const q = this.questions[i]
    if (optIdx >= (q.options || []).length) {
      this.setData({ typingDone: true })
      this._timer = setTimeout(() => this._typeQuestion(i + 1), 800)
      return
    }
    this.setData({ typedOptions: this.data.typedOptions.concat(q.options[optIdx]) })
    this._timer = setTimeout(() => this._showOptions(i, optIdx + 1), 120)
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
    if (this.streamTask && this.streamTask.abort) {
      try { this.streamTask.abort() } catch (e) {}
    }
  },

  // 出题完成 → 把题交给练习页答题（复用判题闭环）
  goPractice() {
    getApp().globalData.streamQuestions = this.questions
    wx.navigateTo({
      url: "/pages/practice/practice?stream=1"
    })
  }
})

// ArrayBuffer → UTF-8 字符串（兼容基础库，避免 TextDecoder 兼容问题）
function _decodeArrayBuffer(ab) {
  const bytes = new Uint8Array(ab)
  let out = ""
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i])
  try {
    return decodeURIComponent(escape(out))
  } catch (e) {
    return out
  }
}
