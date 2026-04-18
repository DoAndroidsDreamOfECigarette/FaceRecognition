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
from face_model import get_face_model


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


# 启动时执行一次（避免重复打印）
@app.on_event("startup")
def on_startup():
    init_sqlite_db()
    print("正在加载人脸识别模型，请稍候...")
    _ = get_face_model()
    print("模型加载完成")


# ==================== 启动 ====================

if __name__ == '__main__':
    print(f"=" * 40)
    print(f"人脸识别系统启动中...")
    print(f"API 地址: http://{API_HOST}:{API_PORT}")
    print(f"文档地址: http://{API_HOST}:{API_PORT}/docs")
    print(f"=" * 40)

    uvicorn.run(
        app,
        host=API_HOST,
        port=API_PORT,
        log_level="info",
        workers=1,          # 限制单进程，避免重复加载
        reload=False        # 禁用自动重载
    )
