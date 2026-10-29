// utils/judge.js
// 判题逻辑：单选字母精确匹配；填空去空格 + 忽略大小写后精确匹配
function judge(question, userAnswer) {
  if (!userAnswer && userAnswer !== "") return { correct: false }

  if (question.type === "single") {
    return { correct: userAnswer === question.answer }
  }

  if (question.type === "blank") {
    const a = String(userAnswer || "").replace(/\s+/g, "")
    const b = String(question.answer || "").replace(/\s+/g, "")
    return { correct: a.toLowerCase() === b.toLowerCase() }
  }

  return { correct: false }
}

module.exports = { judge }
