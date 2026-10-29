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
    answers: [],       // 本轮每题作答：{questionId, userAnswer, correct}
    correctCount: 0,   // 答对数
    retryMode: false   // 是否为错题重练模式
  },

  onLoad(options) {
    // 错题重练：用错题本暂存的题，不请求后端
    if (options.retry && getApp().globalData.retryQuestions) {
      this.setData({
        questions: getApp().globalData.retryQuestions,
        index: 0,
        current: getApp().globalData.retryQuestions[0],
        retryMode: true
      })
      return
    }

    // 正常练习：先请求后端，失败/异常自动走前端内置题库（双层兜底）
    this.loadFromBackend()
  },

  // 从后端拿题（第 4 天联调后这里会带上资料的知识块）
  loadFromBackend() {
    wx.showLoading({ title: "AI 出题中..." })
    generateQuestions({
      knowledge_blocks: [],
      question_types: ["single", "blank"],
      count: 15,
      existing_stems: []
    }).then((res) => {
      wx.hideLoading()
      if (res.ok) {
        // 后端返回题；若 fallback 为 true，提示已切后端预置题库
        if (res.needToast) {
          wx.showToast({ title: "已切换预置题库", icon: "none" })
        }
        this.setData({
          questions: res.questions,
          index: 0,
          current: res.questions[0]
        })
      } else {
        // 后端不可用：切前端内置题库并提示
        wx.showToast({ title: "已切换预置题库", icon: "none" })
        this.setData({
          questions: PRESET_QUESTIONS,
          index: 0,
          current: PRESET_QUESTIONS[0]
        })
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
      correct: result.correct
    }
    this.setData({
      answered: true,
      isCorrect: result.correct,
      answers: this.data.answers.concat(answerItem),
      correctCount: this.data.correctCount + (result.correct ? 1 : 0)
    })
  },

  // 下一题
  onNext() {
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
      isCorrect: false
    })
  },

  // 本轮练习完成：写答题记录 + 跳结果页
  finishPractice() {
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
