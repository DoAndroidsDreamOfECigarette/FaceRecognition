"""
配置文件 - 集中管理所有可配置参数
"""

import os
from pathlib import Path

# 项目根目录
BASE_DIR = Path(__file__).resolve().parent.parent

# 人脸库路径
FACE_DB_PATH = os.path.join(BASE_DIR, "Utils", "face_database.pkl")

# 资源目录
RESOURCES_DIR = os.path.join(BASE_DIR, "resources")
os.makedirs(RESOURCES_DIR, exist_ok=True)

# InsightFace 模型配置
INSIGHTFACE_MODEL_NAME = "buffalo_l"
INSIGHTFACE_MODEL_ROOT = os.path.join(BASE_DIR, "Utils")
INSIGHTFACE_PROVIDERS = ["CPUExecutionProvider"]  # 可改为 ["CUDAExecutionProvider"] 使用GPU

# 识别阈值
RECOGNITION_THRESHOLD = 0.6

# 服务配置
API_HOST = "0.0.0.0"
API_PORT = 5000

# 日志配置
LOG_LEVEL = "INFO"
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# 数据库配置（SQLite 用于操作日志）
DB_PATH = os.path.join(BASE_DIR, "data", "face_recognition.db")
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
