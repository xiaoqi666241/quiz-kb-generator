// data/preset.js
// 前端内置预置题库：后端不可用（接口挂掉/超时/网络失败）时的兜底数据，保证演示不中断
// 结构必须与 /generate 接口响应的 questions 数组完全一致（参考 E:\小程序设计校\response_example.json）
// 说明：当前 15 道为假数据阶段占位（都挂 kp_001），刘整理正式资料后整体替换
const PRESET_QUESTIONS = [
  { id: "pq_001", type: "single", stem: "【假数据单选 1】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_002", type: "single", stem: "【假数据单选 2】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_003", type: "single", stem: "【假数据单选 3】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_004", type: "single", stem: "【假数据单选 4】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_005", type: "single", stem: "【假数据单选 5】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_006", type: "single", stem: "【假数据单选 6】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_007", type: "single", stem: "【假数据单选 7】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_008", type: "single", stem: "【假数据单选 8】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_009", type: "single", stem: "【假数据单选 9】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_010", type: "single", stem: "【假数据单选 10】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_011", type: "single", stem: "【假数据单选 11】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_012", type: "single", stem: "【假数据单选 12】关于劳动合同订立的说法，正确的是？", options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"], answer: "A", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_013", type: "blank", stem: "【假数据填空 1】建立劳动关系，应当订立________劳动合同。", options: [], answer: "书面", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_014", type: "blank", stem: "【假数据填空 2】建立劳动关系，应当订立________劳动合同。", options: [], answer: "书面", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" },
  { id: "pq_015", type: "blank", stem: "【假数据填空 3】建立劳动关系，应当订立________劳动合同。", options: [], answer: "书面", explanation: "原文：建立劳动关系，应当订立书面劳动合同。", knowledge_point_id: "kp_001", source_excerpt: "建立劳动关系，应当订立书面劳动合同。", cognitive_level: "记忆", steps: 1, difficulty: "简单" }
]

module.exports = { PRESET_QUESTIONS }
