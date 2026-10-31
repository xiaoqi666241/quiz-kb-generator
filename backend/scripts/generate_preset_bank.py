# -*- coding: utf-8 -*-
r"""
生成后端兜底题库 preset_bank.json（分批调用 /generate，防超时/防截断）

用法（在 backend/ 目录下执行）:
    python scripts/generate_preset_bank.py                        # 合并 data/knowledge_blocks/ 下全部知识块文件
    python scripts/generate_preset_bank.py data/knowledge_blocks/资料1_计算机组成原理_知识块.json   # 只用指定文件

前提:
1. 本地服务已启动: ..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
   （不要带 --reload，避免残留 worker 进程占用端口返回 404）
2. FORCE_FALLBACK 未设为 1（否则返回 DEMO_FALLBACK，脚本会终止保存）
"""

import json
import sys
from pathlib import Path

import requests

GENERATE_URL = "http://127.0.0.1:8000/generate"  # 请求地址：无 /api 前缀，无多余斜杠
BACKEND_DIR = Path(__file__).resolve().parent.parent  # backend/
KB_DIR = BACKEND_DIR / "data" / "knowledge_blocks"    # 知识块目录
OUTPUT_PATH = BACKEND_DIR / "preset_bank.json"        # 输出文件

BLOCKS_PER_BATCH = 5   # 每次请求只带 5 个知识块，避免 Prompt 过大导致超时/截断
COUNT_PER_BATCH = 5    # 每次请求 count=5，减小单次输出体量
TIMEOUT = 120
MAX_ATTEMPTS = 2       # 每批失败后重试 1 次，两次均失败则终止


def load_knowledge_blocks(kb_file):
    """读取知识块文件；未指定时合并 knowledge_blocks 目录下全部 .json"""
    files = [kb_file] if kb_file else sorted(KB_DIR.glob("*.json"))
    if not files:
        print(f"[错误] 未找到知识块文件：{KB_DIR}")
        sys.exit(1)

    blocks = []
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        items = data.get("knowledge_blocks", []) if isinstance(data, dict) else data
        print(f"[读取] {f.name}：{len(items)} 个知识块")
        blocks.extend(items)

    if not blocks:
        print("[错误] 知识块为空，终止")
        sys.exit(1)
    return blocks[:20]  # GenerateRequest 上限 20 个知识块


def request_batch(blocks, question_types, existing_stems):
    """请求一批题目；成功返回题目列表，失败（重试后仍失败）返回 None"""
    payload = {
        "knowledge_blocks": blocks,
        "question_types": question_types,
        "count": COUNT_PER_BATCH,
        "existing_stems": existing_stems,  # 跨批去重：把已生成题干传给后端
    }

    for attempt in range(1, MAX_ATTEMPTS + 1):
        print(f"  [尝试 {attempt}/{MAX_ATTEMPTS}] POST {GENERATE_URL}（{len(blocks)} 个知识块，question_types={question_types}，count={COUNT_PER_BATCH}）……")
        try:
            resp = requests.post(
                GENERATE_URL,
                json=payload,
                timeout=TIMEOUT,
                proxies={"http": None, "https": None},  # 强制不走系统代理，防止 VPN/代理拦截发往 127.0.0.1 的请求
            )
        except requests.exceptions.RequestException as e:
            print(f"  [失败] 请求异常：{e}")
            continue

        # 真实报错：状态码 + 真实请求 URL + 响应原文，便于定位
        if resp.status_code != 200:
            print(f"  [失败] HTTP {resp.status_code}")
            print(f"真实请求的 URL: {resp.request.url}")
            print(f"         response.text = {resp.text[:800]}")
            continue

        data = resp.json()
        if data.get("fallback"):
            err = data.get("error") or {}
            print(f"  [失败] fallback: true（LLM 调用失败），error.code = {err.get('code')}，message = {err.get('message')}")
            continue

        qs = data.get("questions", [])
        if not qs:
            print("  [失败] 返回 questions 为空")
            continue

        print(f"  [成功] 本批返回 {len(qs)} 题")
        return qs

    return None


def main():
    kb_file = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else None
    blocks = load_knowledge_blocks(kb_file)

    batches = [blocks[i:i + BLOCKS_PER_BATCH] for i in range(0, len(blocks), BLOCKS_PER_BATCH)]
    print(f"[计划] 共 {len(blocks)} 个知识块，分 {len(batches)} 批（每批 {BLOCKS_PER_BATCH} 块、count={COUNT_PER_BATCH}）")
    print(f"[题型分配] 除最后一批请求填空(blank)外，其余批全部请求单选(single)：预期 单选 {COUNT_PER_BATCH * (len(batches) - 1)} + 填空 {COUNT_PER_BATCH}")

    all_questions = []
    existing_stems = []
    for idx, chunk in enumerate(batches, start=1):
        # 题型按批分配：前 N-1 批出单选、最后一批出填空，保证汇总比例约 15:5
        if len(batches) == 1:
            q_types = ["single", "blank"]  # 只有一批时混合出题，避免单题型题库
        else:
            q_types = ["blank"] if idx == len(batches) else ["single"]
        print(f"[批次 {idx}/{len(batches)}] question_types={q_types}")
        qs = request_batch(chunk, q_types, existing_stems)
        if qs is None:
            print(f"[错误] 批次 {idx} 两次尝试均失败，终止，不保存任何文件。")
            sys.exit(1)
        all_questions.extend(qs)
        existing_stems.extend(q.get("stem", "") for q in qs)

    # 汇总后统一重排 id：pq_001、pq_002……
    for i, q in enumerate(all_questions, start=1):
        q["id"] = f"pq_{i:03d}"

    OUTPUT_PATH.write_text(
        json.dumps({"questions": all_questions}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    single = sum(1 for q in all_questions if q.get("type") == "single")
    blank = sum(1 for q in all_questions if q.get("type") == "blank")
    print(f"[完成] 已写入 {OUTPUT_PATH}")
    print(f"       共 {len(all_questions)} 题（单选 {single}，填空 {blank}），id 已重排为 pq_001 起")
    print("       preset_bank.json 每次请求实时读取，生效无需重启服务。")


if __name__ == "__main__":
    main()
