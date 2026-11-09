// pages/practice/practice.js
const { judge } = require("../../utils/judge")
const { PRESET_QUESTIONS } = require("../../data/preset")
const { addRecord, addWrong, removeWrong } = require("../../utils/storage")
const { generateQuestions } = require("../../utils/request")

Page({
  data: {
    questions: [],     // 本轮全部题目
    index: 0,          // 当前是第几题（从 0 开始）
    current: null,     // 当前这一题
    selected: "",      // 单选：用户选的字母（A/B/C/D）
    blankInput: "",    // 填空：用户输入的文字
    answered: false,   // 是否已提交答案
    isCorrect: false,  // 判题结果
    answers: [],       // 本轮每题作答：{questionId, userAnswer, correct, knowledgePointId}
    correctCount: 0,   // 答对数
    retryMode: false,  // 是否为错题重练模式
    optionStates: [],   // 提交后每个选项的状态：'' / 'is-right' / 'is-wrong'
    loading: false,     // 是否显示自定义 AI 出题 loading
    loadingText: "",    // 动态阶段字幕
    timedMode: false,   // 是否限时模式（纯前端倒计时强制交卷）
    timeText: "",       // 倒计时显示 mm:ss
    timeLeft: 0         // 剩余秒数
  },

  onLoad(options) {
    // 限时模式：?timed=1（题目就绪后开始整卷倒计时，到时强制交卷）
    this.timedMode = options.timed === "1"
    this.setData({ timedMode: this.timedMode })
    // 错题重练：用错题本暂存的题，不请求后端
    if (options.retry && getApp().globalData.retryQuestions) {
      this.setData({
        questions: getApp().globalData.retryQuestions,
        index: 0,
        current: getApp().globalData.retryQuestions[0],
        retryMode: true,
        optionStates: []
      })
      this._startCountdown()
      return
    }

    // 流式演示：直接用流式页生成好的 3 题答题（复用判题闭环）
    if (options.stream && getApp().globalData.streamQuestions) {
      const qs = getApp().globalData.streamQuestions
      this.setData({
        questions: qs,
        index: 0,
        current: qs[0],
        optionStates: []
      })
      this._startCountdown()
      return
    }

    // 正常练习：先请求后端，失败/异常自动走前端内置题库（双层兜底）
    this.loadFromBackend()
  },

  // 从后端拿题：携带用户选中的知识块；若异常路径未选中，默认第一套资料，避免后端 422
  loadFromBackend() {
    // 自定义动态 loading：分阶段字幕降低等待焦虑（0-5s 解析 → 5-15s 思考 → 15-30s 生成 → 30s+ 校验去重）
    const stages = [
      { max: 5,   text: "🔍 正在解析预置知识块..." },
      { max: 15,  text: "🧠 大模型正在深度思考，提炼考点..." },
      { max: 30,  text: "📝 正在生成干扰项与精准解析..." },
      { max: Number.MAX_SAFE_INTEGER, text: "🛡️ 正在执行格式校验与原文去重，马上就好..." }
    ]
    const t0 = Date.now()
    const updateText = () => {
      const sec = (Date.now() - t0) / 1000
      const stage = stages.find(s => sec < s.max) || stages[stages.length - 1]
      if (this.data.loadingText !== stage.text) this.setData({ loadingText: stage.text })
    }
    this.setData({ loading: true, loadingText: stages[0].text })
    const timer = setInterval(updateText, 1000)

    const done = () => {
      clearInterval(timer)
      this.setData({ loading: false })
    }

    const { MATERIALS } = require("../../data/materials")
    const selected = getApp().globalData.selectedBlocks
    const blocks = selected && selected.length ? selected : MATERIALS[0].knowledgeBlocks
    generateQuestions({
      knowledge_blocks: blocks,
      question_types: ["single", "blank"],
      count: 15,
      existing_stems: []
    }).then((res) => {
      done()
      if (res.ok) {
        // 后端返回题；若 fallback 为 true，提示已切后端预置题库
        if (res.needToast) {
          wx.showToast({ title: "已切换预置题库", icon: "none" })
        }
        this.setData({
          questions: res.questions,
          index: 0,
          current: res.questions[0],
          optionStates: []
        })
        this._startCountdown()
      } else {
        // 后端不可用：切前端内置题库并提示
        wx.showToast({ title: "已切换预置题库", icon: "none" })
        this.setData({
          questions: PRESET_QUESTIONS,
          index: 0,
          current: PRESET_QUESTIONS[0],
          optionStates: []
        })
        this._startCountdown()
      }
    })
  },

  // 点击单选选项
  onSelectOption(e) {
    if (this.data.answered) return          // 已提交就不能再改
    this.setData({ selected: e.currentTarget.dataset.option })
  },

  // 填空输入
  onBlankInput(e) {
    this.setData({ blankInput: e.detail.value })
  },

  // 提交答案
  onSubmit() {
    const { current, selected, blankInput, answered } = this.data
    if (answered) return

    // 按题型取用户答案
    const userAnswer = current.type === "single" ? selected : blankInput
    if (!userAnswer) {
      wx.showToast({
        title: current.type === "single" ? "请先选择答案" : "请先填写答案",
        icon: "none"
      })
      return
    }

    const result = judge(current, userAnswer)

    // 提交后给每个选项标色：正确答案绿、选错的红
    const optionStates = current.options.map(opt => {
      const letter = opt[0]
      if (letter === current.answer) return "is-right"
      if (letter === selected && !result.correct) return "is-wrong"
      return ""
    })

    // 答错才写入错题集，答对不用记
    if (!result.correct) {
      addWrong(current, "preset_001")
    }

    // 错题重练模式：答对 → 移出错题本
    if (result.correct && this.data.retryMode) {
      removeWrong(current.id)
    }

    // 记录本题作答，统计答对数
    const answerItem = {
      questionId: current.id,
      userAnswer: userAnswer,
      correct: result.correct,
      knowledgePointId: current.knowledge_point_id || "unknown"
    }
    this.setData({
      answered: true,
      isCorrect: result.correct,
      answers: this.data.answers.concat(answerItem),
      correctCount: this.data.correctCount + (result.correct ? 1 : 0),
      optionStates: optionStates
    })
  },

  // 下一题
  onNext() {
    if (this._nextLock) return   // 防连点：一次点击只前进一题
    this._nextLock = true
    setTimeout(() => { this._nextLock = false }, 300)
    const { questions, index } = this.data
    const nextIndex = index + 1
    if (nextIndex >= questions.length) {
      // 全部答完 → 保存记录并跳结果页
      this.finishPractice()
      return
    }
    this.setData({
      index: nextIndex,
      current: questions[nextIndex],
      selected: "",
      blankInput: "",
      answered: false,
      isCorrect: false,
      optionStates: []
    })
  },

  // 限时模式：整卷倒计时（180 秒），到 0 强制交卷
  _startCountdown() {
    if (!this.timedMode) return
    this._clearCountdown()
    let left = 180
    const fmt = (s) => {
      const m = Math.floor(s / 60)
      const ss = s % 60
      return (m < 10 ? "0" + m : m) + ":" + (ss < 10 ? "0" + ss : ss)
    }
    this.setData({ timeLeft: left, timeText: fmt(left) })
    this._cdTimer = setInterval(() => {
      left -= 1
      this.setData({ timeLeft: left, timeText: fmt(left) })
      if (left <= 0) {
        this._clearCountdown()
        wx.showModal({
          title: "⏰ 时间到",
          content: "限时练习已结束，自动交卷",
          showCancel: false,
          success: () => this.finishPractice()
        })
      }
    }, 1000)
  },

  _clearCountdown() {
    if (this._cdTimer) {
      clearInterval(this._cdTimer)
      this._cdTimer = null
    }
  },

  onUnload() {
    this._clearCountdown()
  },

  // 本轮练习完成：写答题记录 + 跳结果页
  finishPractice() {
    if (this._finished) return   // 防重入：时间到与手动完成不会重复写记录
    this._finished = true
    this._clearCountdown()
    const { questions, answers, correctCount } = this.data
    const totalCount = questions.length

    addRecord({
      recordId: "record_" + Date.now(),
      paperId: "preset_001",
      answers: answers,
      correctCount: correctCount,
      totalCount: totalCount,
      createdAt: new Date().toISOString()
    })

    wx.redirectTo({
      url: "/pages/result/result?correct=" + correctCount + "&total=" + totalCount
    })
  }
})
