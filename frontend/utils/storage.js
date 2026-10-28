// utils/storage.js
// 本地存储统一封装：所有页面从这里读写，key 全项目统一，避免各页面各写各的
const KEYS = {
  CURRENT_PAPER: "currentPaper", // 当前题库 {paperId, title, createdAt, fallback, questions}
  RECORDS: "answerRecords",       // 答题记录数组 [{recordId, paperId, answers, correctCount, totalCount, createdAt}]
  WRONG: "wrongQuestions",        // 错题集数组 [{questionId, paperId, wrongCount, lastWrongAt, mastered, question}]
  STATS: "stats"                  // 累计统计（第 6 天做累计正确率时用）
}

function get(key) {
  return wx.getStorageSync(key)
}
function set(key, value) {
  wx.setStorageSync(key, value)
}

// —— 题库 ——
function savePaper(paper) {
  set(KEYS.CURRENT_PAPER, paper)
}
function getPaper() {
  return get(KEYS.CURRENT_PAPER) || null
}

// —— 答题记录 ——
function addRecord(record) {
  const records = get(KEYS.RECORDS) || []
  records.push(record)
  set(KEYS.RECORDS, records)
}
function getRecords() {
  return get(KEYS.RECORDS) || []
}

// —— 错题集 ——
function getWrong() {
  return get(KEYS.WRONG) || []
}
function addWrong(question, paperId) {
  const wrongList = get(KEYS.WRONG) || []
  const existed = wrongList.find(w => w.questionId === question.id)
  if (existed) {
    existed.wrongCount += 1
    existed.lastWrongAt = new Date().toISOString()
    existed.mastered = false
  } else {
    wrongList.push({
      questionId: question.id,
      paperId: paperId,
      wrongCount: 1,
      lastWrongAt: new Date().toISOString(),
      mastered: false,
      question: question
    })
  }
  set(KEYS.WRONG, wrongList)
}
// 重练答对后移出错题本（历史记录保留在答题记录里）
function removeWrong(questionId) {
  const wrongList = get(KEYS.WRONG) || []
  const remain = wrongList.filter(w => w.questionId !== questionId)
  set(KEYS.WRONG, remain)
}
module.exports = { KEYS, get, set, savePaper, getPaper, addRecord, getRecords, getWrong, addWrong, removeWrong }
