import json

SYSTEM_PROMPT = """你是职业资格考试命题助手。你只能依据用户提供的知识块和原文摘录出题，不得超纲、不得编造。
必须输出合法 JSON，不要输出 Markdown 代码块。"""

def build_generate_prompt(knowledge_blocks, question_types, count, existing_stems):
    kb_text = json.dumps(
        [
            {
                "id": kb.id,
                "name": kb.name,
                "summary": kb.summary,
                "source_excerpt": kb.source_excerpt,
                "scope": kb.scope,
            }
            for kb in knowledge_blocks
        ],
        ensure_ascii=False,
        indent=2,
    )
    existing = existing_stems or []

    type_instruction = ""
    if "single" in question_types and "blank" in question_types:
        # 强制约束：单选 12~15，填空 3~5
        blank_count = count - 15
        if blank_count < 3:
            blank_count = 3
        if blank_count > 5:
            blank_count = 5
        single_count = count - blank_count
        type_instruction = f"注意：必须生成 {single_count} 道单选题（type='single'）和 {blank_count} 道填空题（type='blank'）。"
    elif "single" in question_types:
        type_instruction = f"注意：必须生成 {count} 道单选题（type='single'）。"
    elif "blank" in question_types:
        type_instruction = f"注意：必须生成 {count} 道填空题（type='blank'）。"

    user_prompt = f"""请基于以下知识块出 {count} 道题，题型只能从 {question_types} 中选择。
{type_instruction}

要求：
1. 每道题必须关联一个知识块 id，字段名 knowledge_point_id。
2. 单选题固定 4 个选项，options 数组元素必须带 "A." "B." "C." "D." 前缀；answer 只写字母 A/B/C/D。
3. 填空题 options 必须是空数组 []；answer 写标准答案；题干用 ________ 表示空格。
4. explanation 必须以“原文：”开头，原样复制 source_excerpt 中一句长度不少于 10 个字的连续原文，再接“。解析：”补充说明。不得编造。
5. cognitive_level 只能取 记忆/理解/应用/分析；steps 为 1～3 的整数；difficulty 只能取 简单/中等。
6. 不得与以下已生成题干重复考查角度：{json.dumps(existing, ensure_ascii=False)}。
7. 输出 JSON，格式为 {{"questions": [ ... ]}}，不要输出其他文字。

你必须严格按照以下 JSON 结构返回示例：
{{
  "questions": [
    {{
      "id": "q_001",
      "type": "single",
      "stem": "题干",
      "options": ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"],
      "answer": "A",
      "explanation": "原文：引用对应内容",
      "knowledge_point_id": "kp_001",
      "source_excerpt": "原文片段",
      "cognitive_level": "记忆",
      "steps": 1,
      "difficulty": "简单"
    }}
  ]
}}

知识块：
{kb_text}
"""
    return SYSTEM_PROMPT, user_prompt


EXTRACT_SYSTEM_PROMPT = """你是知识块提取助手。你只能依据用户提供的文本提取知识块，source_excerpt 必须原样摘录原文，不得编造。
必须输出合法 JSON，不要输出 Markdown 代码块。"""


def build_extract_prompt(text: str):
    user_prompt = f"""请从以下文本中提取 1~3 个知识块，用于后续出题。

要求：
1. 每个知识块只包含 id、name、summary、source_excerpt、scope 五个字段。
2. id 按 kp_001、kp_002、kp_003 依次编号。
3. name：知识块名称，不超过 15 个字。
4. summary：一句话概括该知识块的核心内容。
5. source_excerpt：从文本中原样摘录的连续片段，不少于 15 个字，不得改写。
6. scope：该知识块的考查范围，格式为“包含……；不包含……”。
7. 输出 JSON，格式为 {{"knowledge_blocks": [ ... ]}}，不要输出其他文字。

你必须严格按照以下 JSON 结构返回示例：
{{
  "knowledge_blocks": [
    {{
      "id": "kp_001",
      "name": "劳动合同订立",
      "summary": "劳动合同订立的主体、形式与时间要求",
      "source_excerpt": "建立劳动关系，应当订立书面劳动合同。",
      "scope": "包含书面形式、一个月内订立；不包含试用期、解除条件"
    }}
  ]
}}

文本：
{text}
"""
    return EXTRACT_SYSTEM_PROMPT, user_prompt