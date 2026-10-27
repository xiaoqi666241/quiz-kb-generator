from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import (
    GenerateRequest,
    GenerateResponse,
    Question,
    ExtractRequest,
    ExtractResponse,
)

load_dotenv()  # 今天假数据不读环境变量；明天接 LLM 直接 os.getenv 即可

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


FAKE_QUESTIONS = build_fake_questions()


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    # 今天不接真实 LLM，直接返回假题目；knowledge_point_id 动态替换为请求中的第一个知识块 id
    # 假数据阶段只按题型过滤，不按知识块轮转；真实生成再按知识块轮转
    kid = req.knowledge_blocks[0].id
    pool = [q for q in FAKE_QUESTIONS if q.type in req.question_types]
    selected = [
        q.model_copy(update={"knowledge_point_id": kid})
        for q in pool[: req.count]
    ]

    # 仅假数据阶段存在；明天接真实 LLM 后移除，不写入 API.md 错误码表
    error = None
    if len(selected) < req.count:
        error = {
            "code": "INSUFFICIENT_FAKE_QUESTIONS",
            "message": f"假数据池按题型过滤后仅 {len(selected)} 道，少于请求的 {req.count} 道；接真实 LLM 后消除",
        }

    return GenerateResponse(fallback=False, questions=selected, error=error)


@app.post("/extract", response_model=ExtractResponse)
def extract(_req: ExtractRequest):
    # P1 占位：返回符合 ExtractResponse 的结构，HTTP 200
    # fallback=False 表示未使用预置结果；前端按 error.code 判断未实现
    return ExtractResponse(
        fallback=False,
        knowledge_blocks=[],
        error={"code": "NOT_IMPLEMENTED", "message": "P1 功能，占位接口，未使用预置结果"},
    )
