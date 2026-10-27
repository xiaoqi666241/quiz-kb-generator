# 刷题软件知识块生成器 - 后端(exam-practice-backend)

FastAPI 最小可运行后端:`/generate` 返回假数据题目(15~20 题),`/extract` 为 P1 占位接口。

## 目录结构

```text
exam-practice-backend/
├── main.py                  # FastAPI 应用:CORS + 假数据 + /generate + /extract 占位
├── models.py                # Pydantic 模型(与 API.md 第 4 节一致)
├── requirements.txt         # 依赖清单
├── .env.example             # 环境变量模板(真实 .env 请自行创建,勿提交)
├── .gitignore
├── request_example.json     # /generate 示例请求
├── extract_example.json     # /extract 示例请求
├── response_example.json    # /generate 示例响应(发给何)
├── docs/操作文档.md          # 今日操作清单（内部）
├── test_generate.py         # 自动自检脚本(需服务已启动)
├── API.md                   # 接口文档 v1.1
└── docs/
    ├── 给何的交接说明.md       # 发何的材料清单 + 何需确认的事项
    ├── 今日任务清单与明日计划.md # 复制发群用(含 10.28 计划)
    └── 今日自检记录.md         # 2026-10-27 实际自检结果
```

## 快速开始

```bash
# 1. 激活虚拟环境(已创建)
# Windows PowerShell:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# 2. 安装依赖(已安装)
pip install -r requirements.txt

# 3. 启动服务
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# 4. 另开终端,运行自检
python test_generate.py
```

- Swagger 调试:http://127.0.0.1:8000/docs
- 接口契约:见 [API.md](API.md)(v1.1)

## 待人工完成事项

1. 把 `response_example.json`、`request_example.json`、`API.md` 和兜底约定发给何(见 [docs/给何的交接说明.md](docs/给何的交接说明.md))
2. 创建本机 `.env`,填入真实 `DASHSCOPE_API_KEY` 与 `DEEPSEEK_MODEL_ID`
3. 百炼控制台设置每日 Token 提醒
4. 今日任务清单与明日计划发群(见 [docs/今日任务清单与明日计划.md](docs/今日任务清单与明日计划.md))
