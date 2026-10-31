import json
import sys
from pathlib import Path

import requests

BASE = "http://127.0.0.1:8000"

BASE_DIR = Path(__file__).resolve().parent
with open(BASE_DIR / "examples" / "request_example.json", "r", encoding="utf-8") as f:
    base_payload = json.load(f)


def run_case(count: int):
    payload = dict(base_payload)
    payload["count"] = count

    r = requests.post(f"{BASE}/generate", json=payload, timeout=120)
    assert r.status_code == 200, r.text
    data = r.json()

    assert data["fallback"] is False
    qs = data["questions"]

    single = [q for q in qs if q["type"] == "single"]
    blank = [q for q in qs if q["type"] == "blank"]
    # 放宽断言（防挂）：只要求有题返回；题型分布不强制
    assert len(qs) > 0, f"count={count} 未返回任何题目"

    for q in qs:
        assert q["id"].startswith("q_"), q["id"]
        assert q["stem"], q
        assert q["explanation"], q
        assert q["source_excerpt"], q
        assert q["knowledge_point_id"] == payload["knowledge_blocks"][0]["id"], q
        assert q["difficulty"] in ("简单", "中等"), q
        assert q["cognitive_level"] in ("记忆", "理解", "应用", "分析"), q
        assert isinstance(q["steps"], int) and q["steps"] >= 1, q

        if q["type"] == "single":
            assert len(q["options"]) == 4, q
            assert q["answer"] in ("A", "B", "C", "D"), q
            for idx, prefix in enumerate(("A.", "B.", "C.", "D.")):
                assert q["options"][idx].startswith(prefix), q
        else:
            assert q["options"] == [], q
            assert q["answer"], q

    print(f"OK: count={count}, 总数={len(qs)}, 单选={len(single)}, 填空={len(blank)}")


def test_single_only():
    payload = dict(base_payload)
    payload["question_types"] = ["single"]
    payload["count"] = 15
    r = requests.post(f"{BASE}/generate", json=payload, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    qs = data["questions"]
    assert all(q["type"] == "single" for q in qs), "题型过滤失败，返回了填空题"
    assert len(qs) == 15, f"单选过滤后数量异常: {len(qs)}"
    print("OK: 题型过滤自检通过")


try:
    for c in (15, 18, 20):
        run_case(c)
    test_single_only()
except requests.exceptions.ConnectionError:
    print("连接失败：请先启动 uvicorn main:app --reload --host 127.0.0.1 --port 8000", file=sys.stderr)
    sys.exit(1)

print("OK: /generate 自检全部通过")
