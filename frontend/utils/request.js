// utils/request.js
// 后端接口封装：POST /generate 生成题目 + POST /extract 提取知识块，含双层兜底
// 接口契约见 E:\小程序设计校\API.md（v1.1，封维护，随 /docs 同步更新）
const BASE_URL = "http://127.0.0.1:8000"
const TIMEOUT = 90000 // 后端约定：wx.request 90 秒超时（真实 LLM 生成 15~20 题实测约 34 秒，30 秒会误走兜底）

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

// 提取知识块（P1：粘贴小样本文本，只展示知识块，不进答题流程）
// 返回 Promise，resolve 统一结果对象：
//   { ok: true, blocks }                            —— 拿到知识块数组
//   { ok: false, reason: "not_implemented" }        —— 后端返回 error.code=NOT_IMPLEMENTED（P1 未实现）
//   { ok: false, reason: "network" | "http" }       —— 后端不可用
function extractKnowledgeBlocks(text) {
  return new Promise((resolve) => {
    wx.request({
      url: BASE_URL + "/extract",
      method: "POST",
      data: { text: text },
      timeout: TIMEOUT,
      header: { "Content-Type": "application/json" },
      success(res) {
        const { statusCode, data } = res
        // 200 且有知识块 → 展示
        if (statusCode === 200 && data && Array.isArray(data.knowledge_blocks) && data.knowledge_blocks.length > 0) {
          resolve({ ok: true, blocks: data.knowledge_blocks })
          return
        }
        // 后端明确说没实现（P1 占位）→ 给友好提示
        if (data && data.error && data.error.code === "NOT_IMPLEMENTED") {
          resolve({ ok: false, reason: "not_implemented" })
          return
        }
        resolve({ ok: false, reason: "http" })
      },
      fail() {
        resolve({ ok: false, reason: "network" })
      }
    })
  })
}

module.exports = { generateQuestions, extractKnowledgeBlocks, BASE_URL }
