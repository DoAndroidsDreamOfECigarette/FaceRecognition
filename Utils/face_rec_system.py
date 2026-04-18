"""
人脸识别系统 - 主入口

基于 FastAPI + InsightFace 的人脸识别后端服务
支持人脸注册、识别、管理等功能
"""

import sys
import os

# 确保 Utils 目录在 Python 路径中
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import API_HOST, API_PORT
from routes import router
from database import init_sqlite_db


# ==================== 应用初始化 ====================

app = FastAPI(
    title="人脸识别系统 API",
    description="基于深度学习的人脸识别接口，支持上传图片进行识别",
    version="1.0.0"
)

# CORS 中间件，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router, tags=["人脸识别"])


# ==================== 启动 ====================

if __name__ == '__main__':
    # 初始化数据库
    init_sqlite_db()

    print(f"=" * 40)
    print(f"人脸识别系统启动中...")
    print(f"API 地址: http://{API_HOST}:{API_PORT}")
    print(f"文档地址: http://{API_HOST}:{API_PORT}/docs")
    print(f"=" * 40)

    uvicorn.run(
        app,
        host=API_HOST,
        port=API_PORT,
        log_level="info"
    )
