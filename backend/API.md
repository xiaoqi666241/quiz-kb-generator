# API 接口文档(正式版)

- 版本:v1.1
- 修订：2026-10-27 修正 /extract 占位 fallback 为 false，删除错乱编号，补全客户端处理说明。
- 更新日期:2026-10-27
- 后端:FastAPI,本地地址 `http://127.0.0.1:8000`
- 调试入口:`http://127.0.0.1:8000/docs`(Swagger UI)

---

## 1. 全局约定

### 1.1 超时规则

| 阶段 | 超时 | 说明 |
| --- | --- | --- |
| 客户端(小程序 `wx.request`) | 90 秒 | 超时后走兜底 |
| LLM 单次调用 | 60 秒 | 后端控制 |
| 重试总耗时 | 120 秒 | 含所有重试,超过即兜底 |

客户端 90 秒为最终值，覆盖 LLM 单次 60 秒 + 网络余量；答辩演示如遇延迟，前端自动提示并保留作答能力。

### 1.2 通用响应字段

业务接口在 HTTP 200 时都包含 `fallback` 字段：
- `fallback: false`：未使用预置题库；若 `error` 非空，按 `error.code` 处理（如 `/extract` 占位）。
- `fallback: true`：使用了预置题库，`error` 给出降级原因。
422/500 由 FastAPI 默认错误结构返回，前端按 `statusCode` 处理。

### 1.3 错误码表

| 错误码 | 含义 | HTTP 状态 | 客户端处理 |
| --- | --- | --- | --- |
| `NOT_IMPLEMENTED` | 占位接口(P1 功能) | 200 | 提示 P1 未实现，不展示知识块；不要切预置题库 |
| `LLM_FALLBACK` | 大模型两次调用均失败，已返回预置题库 | 200 | 按 fallback: true 处理 |
| `DEDUP_INSUFFICIENT` | 去重后题目不足，已返回预置题库 | 200 | 按 fallback: true 处理 |
| `DEMO_FALLBACK` | 演示模式强制兜底（FORCE_FALLBACK=1） | 200 | 按 fallback: true 处理 |
| `LLM_TIMEOUT` | 未来细分错误码：LLM 调用超时(重试总 120 秒后仍失败) | 200 | 当前统一返回 LLM_FALLBACK |
| `LLM_BAD_JSON` | 未来细分错误码：LLM 返回无法解析为合法 JSON | 200 | 当前统一返回 LLM_FALLBACK |
| `VALIDATION_ERROR` | 请求参数不合法 | 422 | 提示用户检查输入；/extract 文本不在 100~1000 字时也返回 422 |
| `INTERNAL_ERROR` | 未知服务端错误 | 500 | 前端切内置预置题库 |

> 注:有题可答时一律返回 HTTP 200 + `fallback: true`,只有真正服务端故障才返回非 200。

---

## 2. 接口详情

### 2.1 POST /generate — 生成题目

**请求体 `GenerateRequest`:**

```json
{
  "knowledge_blocks": [
    {
      "id": "kp_001",
      "name": "劳动合同订立",
      "summary": "劳动合同订立的主体、形式与时间要求",
      "source_excerpt": "建立劳动关系,应当订立书面劳动合同。……",
      "scope": "包含书面形式、一个月内订立;不包含试用期、解除条件"
    }
  ],
  "question_types": ["single", "blank"],
  "count": 15,
  "existing_stems": []
}
```

字段约束:

- `knowledge_blocks`:1~20 个;产品建议一次 8~15 个
- `question_types`:取值只有 `"single"`(单选)和 `"blank"`(填空)
- `count`:5~20（分批生成脚本传 5；小程序正常传 15~20）
- `existing_stems`:可选,传入已有题干用于去重

**响应体 `GenerateResponse`:**

```json
{
  "fallback": false,
  "questions": [
    {
      "id": "q_001",
      "type": "single",
      "stem": "关于劳动合同订立的说法,正确的是?",
      "options": ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"],
      "answer": "A",
      "explanation": "原文:建立劳动关系,应当订立书面劳动合同。",
      "knowledge_point_id": "kp_001",
      "source_excerpt": "建立劳动关系,应当订立书面劳动合同。",
      "cognitive_level": "记忆",
      "steps": 1,
      "difficulty": "简单"
    }
  ],
  "error": null
}
```

### 2.2 题目字段说明

| 字段 | 说明 |
| --- | --- |
| `id` | 题目 id,后端生成,带 `q_` 前缀;预置题库题目带 `pq_` 前缀 |
| `type` | `single`(单选)或 `blank`(填空) |
| `stem` | 题干 |
| `options` | 单选为 4 个元素,**已带 `A.`/`B.`/`C.`/`D.` 前缀,前端直接展示,不要重复拼字母**;填空为空数组 `[]` |
| `answer` | 单选为 `A`/`B`/`C`/`D`;填空为文字答案 |
| `explanation` | 解析 |
| `knowledge_point_id` | 对应请求中 `knowledge_blocks[].id`,前端凭它把题目归组到知识块 |
| `source_excerpt` | 原文摘录 |
| `cognitive_level` | 认知层级,取值:`记忆` / `理解` / `应用` / `分析` |
| `steps` | 解题步数,整数 ≥ 1 |
| `difficulty` | 难度,取值只有:`简单` / `中等` |

### 2.3 兜底响应

后端异常但仍有题可答时,返回 **HTTP 200** + `fallback: true`:

```json
{
  "fallback": true,
  "questions": [
    {
      "id": "pq_001",
      "type": "single",
      "stem": "预置题库题目示例",
      "options": ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"],
      "answer": "A",
      "explanation": "引用预置原文的解析。",
      "knowledge_point_id": "kp_001",
      "source_excerpt": "原文摘录。",
      "cognitive_level": "记忆",
      "steps": 1,
      "difficulty": "简单"
    }
  ],
  "error": { "code": "LLM_FALLBACK", "message": "LLM 生成失败,已切换预置题库" }
}
```

前端约定:

1. HTTP 200 且 `fallback: true`:用后端返回的预置题库,`wx.showToast` 提示"已切换预置题库",继续答题
2. HTTP 非 200 或 `wx.request` fail:切前端内置预置题库,同样提示"已切换预置题库"

### 2.4 POST /extract — 提取知识块(P1 占位)

**请求体 `ExtractRequest`:**

请求体见 examples/extract_example.json（text 长度 100~1000 字）。

**响应体 `ExtractResponse`:**

```json
{
  "fallback": false,
  "knowledge_blocks": [],
  "error": { "code": "NOT_IMPLEMENTED", "message": "P1 功能,占位接口,未使用预置结果" }
}
```

即使占位/出错,也保证返回完整 `ExtractResponse` 结构,包含 `fallback`、`knowledge_blocks`、`error` 三个字段,HTTP 200。

---

## 3. Pydantic 模型(与 `models.py` 一致)

> 本节模型与 `models.py` 保持一致，`cognitive_level` 和 `difficulty` 用 Literal 收紧取值；`options` 单选已带字母前缀，填空为空数组。

```python
class KnowledgeBlock(BaseModel):
    id: str
    name: str
    summary: str
    source_excerpt: str
    scope: Optional[str] = ""

class GenerateRequest(BaseModel):
    knowledge_blocks: List[KnowledgeBlock] = Field(..., min_length=1, max_length=20)
    question_types: List[Literal["single", "blank"]]
    count: int = Field(..., ge=5, le=20)
    existing_stems: Optional[List[str]] = Field(default_factory=list)

class Question(BaseModel):
    id: str
    type: Literal["single", "blank"]
    stem: str
    options: List[str]  # 单选 4 项且已带 "A."/"B." 前缀；填空为 []
    answer: str
    explanation: str
    knowledge_point_id: str
    source_excerpt: str
    cognitive_level: Literal["记忆", "理解", "应用", "分析"]
    steps: int
    difficulty: Literal["简单", "中等"]

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

---

## 4. 开发调试提示

- 启动:`uvicorn main:app --reload --host 127.0.0.1 --port 8000`
- Swagger 调试:`http://127.0.0.1:8000/docs`
- 示例请求保存在 `request_example.json`,示例响应保存在 `response_example.json`
- 自动自检:`python test_generate.py`(需服务已启动)
- 小程序本地联调:微信开发者工具 → 详情 → 本地设置 → 勾选"不校验合法域名、web-view(业务域名)、TLS 版本以及 HTTPS 证书"
- `wx.request` 地址:`http://127.0.0.1:8000/generate`,超时 90000 毫秒
- CORS：开发期 allow_origins=["*"]、allow_credentials=False，上线前收紧
- API Key 只放后端 `.env`(已被 `.gitignore` 忽略),前端代码中不得出现任何 Key
- 百炼专属空间 `base_url`：默认取环境变量 `DASHSCOPE_BASE_URL`，本地示例为 `https://ws-j2b05xy0czujloo7.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`；未设置时回退到代码默认值。以 `.env` 实际值为准。

---

## 5. 版本与变更记录

| 版本 | 日期 | 变更内容 | 负责人 |
| --- | --- | --- | --- |
| v1.0 | 2026-10-27 | 初版：/generate、/extract、错误码、兜底规则 | 封 |
| v1.1 | 2026-10-27 | 修正超时逻辑；补 error 可选字段；统一题型 single/blank；补 options 前缀、ID 前缀、knowledge_point_id 对应关系；模型名改为 DeepSeek 系列+环境变量；补 CORS | 封 |
| v1.2 | 2026-10-28 | /generate 接入真实 LLM；增加重试 1 次与后端预置题库兜底；新增 LLM_FALLBACK 兜底错误码 | 封 |
| v1.3 | 2026-10-29 | 强化解析原文强校验；增加最小化去重；后端统一重排题目 ID；兜底题目 ID 改为 pq_ 前缀；新增 DEDUP_INSUFFICIENT | 封 |
| v1.4 | 2026-10-29 | API.md 补充百炼专属空间 base_url 说明；确认 timeout 与代码一致 | 封 |
| v1.5 | 2026-10-29 | 统一超时口径：客户端 90 秒、LLM 单次 60 秒、重试总 120 秒；test_single_only 超时改为 90 秒 | 封 |
| v1.6 | 2026-10-29 | 新增 FORCE_FALLBACK 演示兜底开关；错误码表新增 DEMO_FALLBACK | 封 |
| v1.7 | 2026-10-30 | 接入真实 /extract（重试 1 次，失败返回 EXTRACT_FAILED）；兜底题库优先读 preset_bank.json（LOCAL_MOCK_QUESTIONS 最后防线）；新增 scripts/generate_preset_bank.py 分批生成（每批 5 知识块、count=5、失败重试 1 次）；count 下限由 15 放宽至 5 | 封 |
