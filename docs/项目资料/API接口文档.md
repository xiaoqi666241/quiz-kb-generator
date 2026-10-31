# 刷题软件知识块生成器——接口文档

> 版本：v1.1  
> 状态：内部开发文档，不随比赛提交包提交  
> 后端：FastAPI，本地地址 `http://127.0.0.1:8000`  
> LLM：阿里云百炼 DeepSeek 系列模型（具体模型名与模型 ID 以控制台实际显示为准，通过环境变量 `DEEPSEEK_MODEL_ID` 配置）  
> 鉴权：本地演示，无鉴权；API Key 仅存后端环境变量  
> 自动文档：启动 FastAPI 后访问 `http://127.0.0.1:8000/docs`（Swagger UI）

## 1. 通用约定

### 1.1 基础信息

| 项 | 值 |
|---|---|
| Base URL | `http://127.0.0.1:8000` |
| 请求格式 | `application/json` |
| 响应格式 | `application/json; charset=utf-8` |
| 超时 | 客户端 30 秒；后端调用 LLM 单次超时 10 秒；JSON 解析失败或 LLM 超时自动重试 1 次，重试总耗时不超过 20 秒，给客户端留 10 秒余量用于网络传输和 JSON 处理 |
| 重试 | 后端 JSON 解析失败或 LLM 超时，自动重试 1 次 |
| 兜底 | 重试仍失败，返回预置题库，`fallback: true`，HTTP 200；完全无法返回题目时才用 5xx |
| 鉴权 | 无（本地演示）；正式上线需补鉴权与 HTTPS |
| 跨域 | 本地开发者工具勾选“不校验合法域名”；开发期在 `main.py` 加 `CORSMiddleware`，`allow_origins=["*"]`，上线前收紧 |

补充说明：
- 错题本、本次/累计正确率、掌握度统计均在小程序本地实现，不涉及后端接口。
- 生成题 ID 以 `q_` 开头，预置题 ID 以 `pq_` 开头，便于前端区分来源。
- `questions[].knowledge_point_id` 对应请求中 `knowledge_blocks[].id`。

### 1.2 错误响应统一结构

```json
{
  "error": {
    "code": "LLM_TIMEOUT",
    "message": "LLM 调用超时，已返回预置题库",
    "fallback": true
  },
  "fallback": true,
  "questions": []
}
```

`error` 为可选字段，仅兜底或错误时出现；前端可读取 `res.data.error.message` 做提示，也可只判断 `fallback`。

### 1.3 错误码表

| HTTP | code | 含义 | 前端处理 |
|---|---|---|---|
| 200 | — | 成功；`fallback` 可能为 true | 正常展示；fallback 时提示“已切换预置题库” |
| 400 | `INVALID_REQUEST` | 参数缺失/类型错误 | 提示检查输入，不重试 |
| 400 | `EMPTY_KNOWLEDGE_BLOCKS` | 知识块为空 | 提示先选择资料 |
| 400 | `TEXT_TOO_SHORT` | `/extract` 文本少于 100 字 | 提示补充文本 |
| 400 | `TEXT_TOO_LONG` | `/extract` 文本超过 1000 字 | 提示截断或拒绝 |
| 422 | `VALIDATION_ERROR` | Pydantic 校验失败 | 按字段提示 |
| 500 | `LLM_TIMEOUT` | LLM 超时且重试失败 | 已返回预置题库，提示切换 |
| 500 | `LLM_BAD_JSON` | LLM 返回非法 JSON 且重试失败 | 已返回预置题库，提示切换 |
| 500 | `LLM_UPSTREAM_ERROR` | 百炼返回错误/余额不足/Key 异常 | 提示“服务异常，已切换预置题库” |
| 503 | `PRESET_UNAVAILABLE` | 后端预置题库不可用 | 前端切内置预置题库 |
| 504 | `GATEWAY_TIMEOUT` | 网关/本地服务超时 | 前端切内置预置题库 |

> 注：`LLM_TIMEOUT`、`LLM_BAD_JSON`、`LLM_UPSTREAM_ERROR` 在“已返回预置题库且有题可答”时，HTTP 状态为 **200**，`fallback: true`，可选带 `error` 字段；只有在完全无法返回任何题目时，才使用 500/503/504。  
> 约定：只要返回了可作答题目，HTTP 状态尽量用 200，用 `fallback: true` 标记兜底；只有完全无法返回题目时才用 5xx。

## 2. POST /generate

### 2.1 作用

接收知识块列表与题型要求，调用百炼 DeepSeek 系列模型生成单选题和填空题，返回题目 JSON 数组。P0 核心接口。

### 2.2 请求字段

| 字段 | 类型 | 必填 | 说明 | 约束 |
|---|---|---|---|---|
| `knowledge_blocks` | array | 是 | 知识块列表 | 1～20 个；**产品建议 8～15 个**，低于 8 个出题覆盖不足，高于 15 个单次 Prompt 过长 |
| `knowledge_blocks[].id` | string | 是 | 知识块唯一 ID | 如 `kp_001` |
| `knowledge_blocks[].name` | string | 是 | 知识块名称 | 1～100 字 |
| `knowledge_blocks[].summary` | string | 是 | 摘要 | 1～500 字 |
| `knowledge_blocks[].source_excerpt` | string | 是 | 原文摘录 | 1～1000 字 |
| `knowledge_blocks[].scope` | string | 否 | 范围说明：包含什么、不包含什么 | 0～300 字 |
| `question_types` | array | 是 | 题型 | 取值 `single`、`blank`；P0 仅这两种 |
| `count` | int | 是 | 生成题目总数 | 15～20 |
| `existing_stems` | array | 否 | 已生成题干摘要，用于防重复 | 0～30 条 |

### 2.3 请求示例

```json
{
  "knowledge_blocks": [
    {
      "id": "kp_001",
      "name": "劳动合同订立",
      "summary": "劳动合同订立的主体、形式与时间要求",
      "source_excerpt": "建立劳动关系，应当订立书面劳动合同。已建立劳动关系，未同时订立书面劳动合同的，应当自用工之日起一个月内订立书面劳动合同。",
      "scope": "包含书面形式、一个月内订立；不包含试用期、解除条件"
    }
  ],
  "question_types": ["single", "blank"],
  "count": 15,
  "existing_stems": ["关于书面劳动合同订立时间的说法，正确的是"]
}
```

### 2.4 响应字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `fallback` | bool | 是否使用预置题库 |
| `questions` | array | 题目数组 |
| `questions[].id` | string | 题目唯一 ID；生成题以 `q_` 开头，预置题以 `pq_` 开头 |
| `questions[].type` | string | `single` / `blank` |
| `questions[].stem` | string | 题干 |
| `questions[].options` | array | 单选 4 项；填空为空数组 `[]` |
| `questions[].answer` | string | 单选字母 `A/B/C/D`；填空标准答案 |
| `questions[].explanation` | string | 解析，必须引用 `source_excerpt` |
| `questions[].knowledge_point_id` | string | 关联知识块 ID，对应请求中 `knowledge_blocks[].id` |
| `questions[].source_excerpt` | string | 原文摘录 |
| `questions[].cognitive_level` | string | `记忆/理解/应用/分析` |
| `questions[].steps` | int | 解题步骤数，1～3 |
| `questions[].difficulty` | string | `简单/中等`，后端按规则映射 |

补充说明：
- `options` 数组元素已包含选项字母前缀（如 `A. 一周内`），前端直接展示，不要重复拼接字母；`answer` 为选项字母，与 `options` 前缀对应。
- `questions[].knowledge_point_id` 对应请求中 `knowledge_blocks[].id`。

### 2.5 成功响应示例

```json
{
  "fallback": false,
  "questions": [
    {
      "id": "q_001",
      "type": "single",
      "stem": "已建立劳动关系但未同时订立书面劳动合同的，应当自用工之日起多长时间内订立？",
      "options": ["A. 一周内", "B. 半个月内", "C. 一个月内", "D. 三个月内"],
      "answer": "C",
      "explanation": "原文明确：应当自用工之日起一个月内订立书面劳动合同。",
      "knowledge_point_id": "kp_001",
      "source_excerpt": "应当自用工之日起一个月内订立书面劳动合同。",
      "cognitive_level": "记忆",
      "steps": 1,
      "difficulty": "简单"
    },
    {
      "id": "q_002",
      "type": "blank",
      "stem": "建立劳动关系，应当订立________劳动合同。",
      "options": [],
      "answer": "书面",
      "explanation": "原文：建立劳动关系，应当订立书面劳动合同。",
      "knowledge_point_id": "kp_001",
      "source_excerpt": "建立劳动关系，应当订立书面劳动合同。",
      "cognitive_level": "记忆",
      "steps": 1,
      "difficulty": "简单"
    }
  ]
}
```

### 2.6 兜底响应示例

```json
{
  "fallback": true,
  "error": {
    "code": "LLM_TIMEOUT",
    "message": "LLM 调用超时，已返回预置题库",
    "fallback": true
  },
  "questions": [
    {
      "id": "pq_001",
      "type": "single",
      "stem": "预置题库题目示例",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "A",
      "explanation": "引用预置原文的解析。",
      "knowledge_point_id": "kp_001",
      "source_excerpt": "原文摘录。",
      "cognitive_level": "理解",
      "steps": 1,
      "difficulty": "简单"
    }
  ]
}
```

`error` 为可选字段，仅兜底时出现；前端可读取 `res.data.error.message` 做提示，也可只判断 `fallback`。**HTTP 200**；前端按 200 处理并提示切换，不要因 `error` 字段走 5xx 分支。

### 2.7 curl 示例

```bash
curl -X POST http://127.0.0.1:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "knowledge_blocks": [{
      "id": "kp_001",
      "name": "劳动合同订立",
      "summary": "劳动合同订立的主体、形式与时间要求",
      "source_excerpt": "建立劳动关系，应当订立书面劳动合同。应当自用工之日起一个月内订立书面劳动合同。",
      "scope": "包含书面形式、一个月内订立；不包含试用期、解除条件"
    }],
    "question_types": ["single", "blank"],
    "count": 15,
    "existing_stems": []
  }'
```

### 2.8 小程序调用示例

```javascript
wx.request({
  url: 'http://127.0.0.1:8000/generate',
  method: 'POST',
  timeout: 30000,
  header: { 'Content-Type': 'application/json' },
  data: {
    knowledge_blocks: blocks,
    question_types: ['single', 'blank'],
    count: 15,
    existing_stems: []
  },
  success(res) {
    if (res.statusCode === 200) {
      if (res.data.fallback) {
        wx.showToast({ title: '已切换预置题库', icon: 'none' });
      }
      // 存入本地题库并进入练习
    } else {
      // 切前端内置预置题库
      wx.showToast({ title: '已切换预置题库', icon: 'none' });
    }
  },
  fail() {
    // 后端不可用，切前端内置预置题库
    wx.showToast({ title: '已切换预置题库', icon: 'none' });
  }
});
```

## 3. POST /extract（P1）

### 3.1 作用

接收 500～1000 字 TXT 短文本，调用 LLM 提取知识块。**只展示知识块，不进入出题流程**，用于答辩展示“自动提取能力存在”。

### 3.2 请求字段

| 字段 | 类型 | 必填 | 说明 | 约束 |
|---|---|---|---|---|
| `text` | string | 是 | TXT 短文本 | 100～1000 字 |

### 3.3 请求示例

```json
{
  "text": "建立劳动关系，应当订立书面劳动合同。已建立劳动关系，未同时订立书面劳动合同的，应当自用工之日起一个月内订立书面劳动合同。用人单位与劳动者在用工前订立劳动合同的，劳动关系自用工之日起建立。"
}
```

### 3.4 响应字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `fallback` | bool | 是否使用预置提取结果 |
| `knowledge_blocks` | array | 知识块数组 |
| `knowledge_blocks[].id` | string | 知识块 ID |
| `knowledge_blocks[].name` | string | 名称 |
| `knowledge_blocks[].summary` | string | 摘要 |
| `knowledge_blocks[].source_excerpt` | string | 原文摘录 |
| `knowledge_blocks[].scope` | string | 范围说明，可为空 |

### 3.5 成功响应示例

```json
{
  "fallback": false,
  "knowledge_blocks": [
    {
      "id": "kp_extract_001",
      "name": "书面劳动合同与用工时间",
      "summary": "建立劳动关系应订立书面劳动合同，并在一个月内完成。",
      "source_excerpt": "建立劳动关系，应当订立书面劳动合同。应当自用工之日起一个月内订立书面劳动合同。",
      "scope": "包含书面形式与一个月期限；不包含试用期。"
    }
  ]
}
```

### 3.6 错误示例

```json
{
  "fallback": false,
  "knowledge_blocks": [],
  "error": {
    "code": "TEXT_TOO_SHORT",
    "message": "文本少于 100 字，请补充后再试"
  }
}
```

> 若把长度校验交给 Pydantic，会返回 422 `VALIDATION_ERROR`；若要按文档返回 400 `TEXT_TOO_SHORT`，需在后端手动校验并抛 `HTTPException`。前端两种都按“提示补充文本”处理。

### 3.7 curl 示例

```bash
curl -X POST http://127.0.0.1:8000/extract \
  -H "Content-Type: application/json" \
  -d '{"text":"建立劳动关系，应当订立书面劳动合同。已建立劳动关系，未同时订立书面劳动合同的，应当自用工之日起一个月内订立书面劳动合同。用人单位与劳动者在用工前订立劳动合同的，劳动关系自用工之日起建立。"}'
```

## 4. FastAPI Pydantic 模型参考

```python
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class KnowledgeBlock(BaseModel):
    id: str
    name: str
    summary: str
    source_excerpt: str
    scope: Optional[str] = ""

class GenerateRequest(BaseModel):
    knowledge_blocks: List[KnowledgeBlock] = Field(..., min_length=1, max_length=20)
    question_types: List[Literal["single", "blank"]]
    count: int = Field(..., ge=15, le=20)
    existing_stems: Optional[List[str]] = Field(default_factory=list)

class Question(BaseModel):
    id: str
    type: Literal["single", "blank"]
    stem: str
    options: List[str]
    answer: str
    explanation: str
    knowledge_point_id: str
    source_excerpt: str
    cognitive_level: str
    steps: int
    difficulty: str

class GenerateResponse(BaseModel):
    fallback: bool
    questions: List[Question]
    error: Optional[dict] = None

class ExtractRequest(BaseModel):
    text: str = Field(..., min_length=100, max_length=1000)

class ExtractResponse(BaseModel):
    fallback: bool
    knowledge_blocks: List[KnowledgeBlock]
    error: Optional[dict] = None
```

代码实现以本节模型为准；早期操作手册中的 `models.py` 示例作废。环境变量名统一为 `DEEPSEEK_MODEL_ID`、`DASHSCOPE_API_KEY`，与 `.env.example` 保持一致；如团队实际使用其他 Key 变量名，需在 `.env.example`、代码和本文档三处同步替换。

## 5. 超时、重试与兜底规则

1. 客户端 `wx.request` 超时 30 秒；后端调用 LLM 单次超时 10 秒，重试 1 次总耗时不超过 20 秒。
2. 后端 JSON 解析失败或 LLM 超时：自动重试 1 次。
3. 重试仍失败：返回后端预置题库，`fallback: true`，HTTP 200，可选带 `error` 字段。
4. 后端预置题库不可用：返回 503 `PRESET_UNAVAILABLE`。
5. 后端本地服务不可用：小程序 `fail` 回调，前端切内置预置题库，提示“已切换预置题库”。
6. 任何兜底都不得阻塞用户作答。

## 6. 版本与变更记录

| 版本 | 日期 | 变更 | 负责人 |
|---|---|---|---|
| v1.0 | 2026-10-27 | 初版：/generate、/extract、错误码、兜底规则 | 封 |
| v1.1 | 2026-10-27 | 修正超时逻辑（LLM 单次 10 秒、重试总 20 秒）；补 `error` 可选字段；统一题型取值 `single/blank`；补 options 前缀、ID 前缀、knowledge_point_id 对应关系；模型名改为 DeepSeek 系列+环境变量；补 CORS 与开发调试提示 | 封 |
| 待定 | 联调后 | 按实测补字段/错误码 | 封 |

## 7. 安全与边界

- API Key 仅放后端环境变量，不写前端、不提交仓库。
- 知识块与原文摘录会发送至后端/LLM 用于出题。
- 题库、答题记录、错题集存小程序本地，不做账号/云同步。
- 本地演示无鉴权；正式上线需 HTTPS、合法域名、鉴权与限流。
- AI 生成题目仅供练习参考，题目正确性与考试范围需人工校验。

## 8. 开发调试提示

- 用 `http://127.0.0.1:8000/docs` 的 “Try it out” 直接测接口，不必每次 curl。
- 模拟 LLM 失败：临时把 `DEEPSEEK_MODEL_ID` 改成错误值，或在代码里加 `if DEBUG_FALLBACK: return preset_response`。
- 模拟后端不可用：直接关掉 uvicorn，看前端是否切内置题库。
- 调试期尽量用短文本（500～1500 字）和少量知识块试 Prompt，全量生成只跑演示资料，控制 Token 消耗。
