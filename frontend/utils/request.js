// utils/request.js
// 后端接口封装：POST /generate 生成题目，含双层兜底
// 接口契约见 E:\小程序设计校\API.md（v1.1，封维护，随 /docs 同步更新）
const BASE_URL = "http://127.0.0.1:8000"
const TIMEOUT = 30000 // 后端约定：wx.request 30 秒超时

// 生成题目
// payload: { knowledge_blocks: [...], question_types: ["single","blank"], count: 15, existing_stems: [] }
// 返回 Promise，resolve 统一结果对象：
//   { ok: true, questions, fallback, needToast }   —— 拿到题；fallback=true 表示后端用了预置题库，调用方提示"已切换预置题库"
//   { ok: false, reason: "network" | "http" }      —— 后端不可用，调用方切前端内置题库并提示
function generateQuestions(payload) {
  return new Promise((resolve) => {
    wx.request({
      url: BASE_URL + "/generate",
      method: "POST",
      data: payload,
      timeout: TIMEOUT,
      header: { "Content-Type": "application/json" },
      success(res) {
        const { statusCode, data } = res
        // 兜底约定 1：HTTP 200 且有题 → 用后端返回的题（fallback: true 时后端用的是它的预置题库）
        if (statusCode === 200 && data && Array.isArray(data.questions) && data.questions.length > 0) {
          resolve({
            ok: true,
            questions: data.questions,
            fallback: !!data.fallback,
            needToast: !!data.fallback
          })
          return
        }
        // HTTP 非 200 或没有题 → 兜底约定 2：调用方切前端内置题库
        resolve({ ok: false, reason: "http" })
      },
      fail() {
        // 网络失败 / 后端服务未启动 → 兜底约定 2
        resolve({ ok: false, reason: "network" })
      }
    })
  })
}

module.exports = { generateQuestions, BASE_URL }
