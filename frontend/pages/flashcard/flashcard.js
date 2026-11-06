// pages/flashcard/flashcard.js
// 闪卡复习（P1）：正面题干，点击翻面看答案与解析
const { PRESET_QUESTIONS } = require("../../data/preset")

const CARD_COUNT = 10 // 演示固定 10 张卡片

Page({
  data: {
    cards: [],
    current: 0,      // 当前卡片下标
    total: 0,
    flipped: false   // 当前卡片是否已翻到背面
  },

  onLoad() {
    const cards = PRESET_QUESTIONS.slice(0, CARD_COUNT)
    this.setData({ cards, total: cards.length })
  },

  // 滑动切换卡片 → 重置为正面
  onSwiperChange(e) {
    this.setData({ current: e.detail.current, flipped: false })
  },

  // 点击卡片翻面（正面 ↔ 背面）
  onFlip() {
    this.setData({ flipped: !this.data.flipped })
  },

  // 上一张 / 下一张按钮
  onPrev() {
    if (this.data.current <= 0) return
    this.setData({ current: this.data.current - 1, flipped: false })
  },

  onNext() {
    if (this.data.current >= this.data.total - 1) return
    this.setData({ current: this.data.current + 1, flipped: false })
  }
})
