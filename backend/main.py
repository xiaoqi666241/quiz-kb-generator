import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from llm_client import call_llm_json
from models import (
    GenerateRequest,
    GenerateResponse,
    Question,
    KnowledgeBlock,
    ExtractRequest,
    ExtractResponse,
)
from prompts import build_generate_prompt, build_extract_prompt

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="刷题软件知识块生成器 - 后端")

# 开发期允许本地跨域；上线前收紧
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def build_fake_questions() -> list[Question]:
    """生成 20 道假题目：15 单选 + 5 填空，分段排列（12 单选 + 3 填空 + 3 单选 + 2 填空）。"""
    qs: list[Question] = []

    # 12 道单选
    for i in range(1, 13):
        qs.append(
            Question(
                id=f"q_{len(qs) + 1:03d}",
                type="single",
                stem=f"【假数据单选 {i}】关于劳动合同订立的说法，正确的是？",
                options=["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"],
                answer="A",
                explanation="原文：建立劳动关系，应当订立书面劳动合同。",
                knowledge_point_id="kp_001",
                source_excerpt="建立劳动关系，应当订立书面劳动合同。",
                cognitive_level="记忆",
                steps=1,
                difficulty="简单",
            )
        )

    # 3 道填空
    for i in range(1, 4):
        qs.append(
            Question(
                id=f"q_{len(qs) + 1:03d}",
                type="blank",
                stem=f"【假数据填空 {i}】建立劳动关系，应当订立________劳动合同。",
                options=[],
                answer="书面",
                explanation="原文：建立劳动关系，应当订立书面劳动合同。",
                knowledge_point_id="kp_001",
                source_excerpt="建立劳动关系，应当订立书面劳动合同。",
                cognitive_level="记忆",
                steps=1,
                difficulty="简单",
            )
        )

    # 3 道单选
    for i in range(13, 16):
        qs.append(
            Question(
                id=f"q_{len(qs) + 1:03d}",
                type="single",
                stem=f"【假数据单选 {i}】关于书面劳动合同订立时间的说法，正确的是？",
                options=["A. 一周内", "B. 半个月内", "C. 一个月内", "D. 三个月内"],
                answer="C",
                explanation="原文：应当自用工之日起一个月内订立书面劳动合同。",
                knowledge_point_id="kp_001",
                source_excerpt="应当自用工之日起一个月内订立书面劳动合同。",
                cognitive_level="理解",
                steps=2,
                difficulty="中等",
            )
        )

    # 2 道填空
    for i in range(4, 6):
        qs.append(
            Question(
                id=f"q_{len(qs) + 1:03d}",
                type="blank",
                stem=f"【假数据填空 {i}】应当自用工之日起________内订立书面劳动合同。",
                options=[],
                answer="一个月",
                explanation="原文：应当自用工之日起一个月内订立书面劳动合同。",
                knowledge_point_id="kp_001",
                source_excerpt="应当自用工之日起一个月内订立书面劳动合同。",
                cognitive_level="记忆",
                steps=1,
                difficulty="简单",
            )
        )

    return qs


LOCAL_MOCK_QUESTIONS = build_fake_questions()


def _normalize_question(raw: dict, kb_map: dict, new_id: str) -> Question:
    """校验解析是否引用原文，并强制重排 ID。"""
    raw = dict(raw)  # 避免修改调用方传入的原始 dict
    raw["id"] = new_id

    q = Question(**raw)
    if q.knowledge_point_id not in kb_map:
        raise ValueError(f"返回了不存在的知识块 ID: {q.knowledge_point_id}")

    if q.type == "single":
        if len(q.options) != 4:
            raise ValueError(f"单选题选项数不是 4: {q.options}")
        if q.answer not in ("A", "B", "C", "D"):
            raise ValueError(f"单选答案不是字母: {q.answer}")
        if not all(q.options[i].startswith(p) for i, p in enumerate(("A.", "B.", "C.", "D."))):
            raise ValueError(f"选项缺少字母前缀: {q.options}")
    else:
        if q.options != []:
            raise ValueError(f"填空题 options 必须为 []: {q.options}")

    exp = q.explanation
    if "原文：" not in exp or "。解析：" not in exp:
        raise ValueError("解析格式不符合要求，缺少 原文： 或 。解析：")

    extracted_text = exp.split("原文：", 1)[1].split("。解析：", 1)[0].strip()

    def clean_text(t: str) -> str:
        return re.sub(r"[^\w]", "", t)

    original_excerpt = clean_text(kb_map[q.knowledge_point_id])
    clean_extracted = clean_text(extracted_text)

    if len(clean_extracted) < 10:
        raise ValueError("解析引用的原文片段长度不足 10 个字")
    if clean_extracted not in original_excerpt:
        raise ValueError(f"解析引用的原文未在 source_excerpt 中找到: {extracted_text}")

    return q


def _call_llm_once(req: GenerateRequest) -> list[Question]:
    kb_map = {kb.id: kb.source_excerpt for kb in req.knowledge_blocks}
    system_prompt, user_prompt = build_generate_prompt(
        req.knowledge_blocks, req.question_types, req.count, req.existing_stems
    )
    data = call_llm_json(system_prompt, user_prompt)
    raw_questions = data.get("questions", [])
    if not raw_questions:
        raise ValueError("LLM 返回 questions 为空")

    validated_questions = []
    for i, r in enumerate(raw_questions, start=1):
        q = _normalize_question(r, kb_map, f"q_{i:03d}")
        validated_questions.append(q)

    return validated_questions


def _load_preset_bank() -> list[Question]:
    """读取 preset_bank.json（backend/ 或项目根目录均可）；读取失败或为空返回 []，由调用方降级。"""
    for path in (BASE_DIR / "preset_bank.json", BASE_DIR.parent / "preset_bank.json"):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, ValueError):
            continue
        items = data.get("questions", []) if isinstance(data, dict) else data
        if not isinstance(items, list) or not items:
            continue
        try:
            return [Question(**item) for item in items]
        except Exception:
            continue
    return []


def _fallback_response(req: GenerateRequest, code: str, message: str) -> GenerateResponse:
    """兜底题库：优先读 preset_bank.json；不可用时降级 LOCAL_MOCK_QUESTIONS（最后防线）；按题型过滤，ID 统一改为 pq_ 前缀。"""
    kid = req.knowledge_blocks[0].id
    bank = _load_preset_bank()
    if not bank:
        bank = LOCAL_MOCK_QUESTIONS

    pool = [q for q in bank if q.type in req.question_types]

    if len(pool) < req.count:
        pool = bank

    selected = [
        q.model_copy(
            update={
                "id": q.id.replace("q_", "pq_", 1),
                "knowledge_point_id": kid,
            }
        )
        for q in pool[: req.count]
    ]
    return GenerateResponse(
        fallback=True,
        questions=selected,
        error={"code": code, "message": message},
    )


def _deduplicate_questions(questions: list[Question], existing_stems: list[str]) -> list[Question]:
    """只做严格相等的归一化去重，不做语义相似度。"""
    def clean(t: str) -> str:
        return re.sub(r"[^\w]", "", t).lower()

    seen = {clean(s) for s in (existing_stems or [])}
    unique_qs = []
    for q in questions:
        c_stem = clean(q.stem)
        if c_stem not in seen:
            seen.add(c_stem)
            unique_qs.append(q)
    return unique_qs


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    if os.getenv("FORCE_FALLBACK") == "1":
        return _fallback_response(req, code="DEMO_FALLBACK", message="演示模式：强制使用预置题库")

    def _try_generate():
        qs = _call_llm_once(req)
        return _deduplicate_questions(qs, req.existing_stems)

    # 第 1 次尝试
    try:
        questions = _try_generate()
        if len(questions) >= req.count:
            return GenerateResponse(fallback=False, questions=questions[: req.count])
        print(f"=== 去重后数量不足: {len(questions)} / {req.count}，触发重试 ===")
    except Exception as e1:
        print(f"=== 第 1 次 LLM 调用失败 ===\n{e1}")

    # 重试 1 次
    try:
        questions = _try_generate()
        if len(questions) >= req.count:
            return GenerateResponse(fallback=False, questions=questions[: req.count])
        raise ValueError(f"重试后去重数量仍不足: {len(questions)} / {req.count}")
    except Exception as e2:
        print(f"=== 第 2 次 LLM 调用失败 ===\n{e2}")
        second_error = str(e2)

    return _fallback_response(
        req,
        code="DEDUP_INSUFFICIENT",
        message=f"去重后题目不足或 LLM 失败，已返回预置题库。详情：{second_error}",
    )


@app.post("/extract", response_model=ExtractResponse)
def extract(req: ExtractRequest):
    def _try_extract():
        system_prompt, user_prompt = build_extract_prompt(req.text)
        data = call_llm_json(system_prompt, user_prompt)
        raw_blocks = data.get("knowledge_blocks", [])
        if not raw_blocks:
            raise ValueError("LLM 返回 knowledge_blocks 为空")
        # 安全网：最多取 3 个知识块
        return [KnowledgeBlock(**b) for b in raw_blocks[:3]]

    # 第 1 次尝试
    try:
        blocks = _try_extract()
        return ExtractResponse(fallback=False, knowledge_blocks=blocks, error=None)
    except Exception as e1:
        print(f"=== 第 1 次 extract 调用失败 ===\n{e1}")

    # 重试 1 次
    try:
        blocks = _try_extract()
        return ExtractResponse(fallback=False, knowledge_blocks=blocks, error=None)
    except Exception as e2:
        print(f"=== 第 2 次 extract 调用失败 ===\n{e2}")

    return ExtractResponse(
        fallback=True,
        knowledge_blocks=[],
        error={"code": "EXTRACT_FAILED", "message": "提取失败"},
    )
