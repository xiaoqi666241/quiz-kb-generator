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
