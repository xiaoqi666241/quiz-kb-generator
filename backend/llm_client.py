import json
import os

from openai import OpenAI

_client = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=os.getenv("DASHSCOPE_API_KEY"),
            # 优先从环境变量读取；未配置时使用专属空间地址
            base_url=os.getenv(
                "DASHSCOPE_BASE_URL",
                "https://ws-j2b05xy0czujloo7.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
            ),
            timeout=60,
        )
    return _client


def call_llm_json(system_prompt: str, user_prompt: str) -> dict:
    """调用 LLM 并解析 JSON；单次超时 60 秒，由调用方负责重试。"""
    resp = get_client().chat.completions.create(
        model=os.getenv("DEEPSEEK_MODEL_ID"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    content = resp.choices[0].message.content.strip()

    # 清洗模型可能带上的 Markdown 代码块标记
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]

    return json.loads(content.strip())
