"""
API 路由模块 - 定义所有 FastAPI 接口
"""

import os
import cv2
import numpy as np
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

import sys
sys.path.insert(0, os.path.dirname(__file__))

from config import RESOURCES_DIR, RECOGNITION_THRESHOLD
from database import (
    load_face_database,
    add_face,
    remove_face,
    get_all_faces,
    is_face_exists,
    log_recognize,
    log_operation,
    get_recognize_logs,
    get_operation_logs,
    get_statistics
)
from face_model import get_face_model


router = APIRouter()


def _decode_image(contents: bytes) -> Optional[np.ndarray]:
    """将上传的文件内容解码为 OpenCV 图片"""
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


def _cosine_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
    """计算两个特征向量的余弦相似度"""
    return float(np.dot(emb1, emb2))


def _recognize_by_embedding(embedding: np.ndarray, threshold: float = RECOGNITION_THRESHOLD):
    """
    根据特征向量在人脸库中查找匹配

    Args:
        embedding: 512维特征向量
        threshold: 相似度阈值

    Returns:
        (姓名, 最高相似度)
    """
    face_db = load_face_database()
    if not face_db:
        return "库为空", 0.0

    max_sim = 0.0
    name_result = "未知"

    for name, emb in face_db.items():
        sim = _cosine_similarity(embedding, emb)
        if sim > max_sim:
            max_sim = sim
            name_result = name

    if max_sim < threshold:
        name_result = "未知"

    return name_result, round(max_sim, 4)


# ==================== 识别接口 ====================

@router.post("/recognize_by_file")
async def recognize_by_file(file: UploadFile = File(...)):
    """
    上传图片进行人脸识别

    返回识别出的姓名
    """
    contents = await file.read()
    img = _decode_image(contents)
    if img is None:
        log_recognize("解析失败", 0.0, "error")
        return {"error": "图片解码失败"}

    # 保存调试图片
    debug_path = os.path.join(RESOURCES_DIR, "debug_face.jpg")
    cv2.imwrite(debug_path, img)

    # 提取特征
    face_model = get_face_model()
    embedding = face_model.get_embedding(img)

    if embedding is None:
        log_recognize("未检测到人脸", 0.0, "unknown")
        return {"error": "未检测到人脸"}

    # 进行识别
    name, similarity = _recognize_by_embedding(embedding)
    log_recognize(name, similarity)

    print(f"[识别] 姓名: {name}, 相似度: {similarity}")
    return {"name": name, "similarity": similarity}


# ==================== 注册接口 ====================

@router.post("/register")
async def register(name: str = Form(...), file: UploadFile = File(...)):
    """
    注册新人脸到人脸库

    Args:
        name: 姓名
        file: 人脸图片
    """
    if not name or not name.strip():
        log_operation("register", name, "姓名不能为空")
        return {"error": "姓名不能为空"}

    contents = await file.read()
    img = _decode_image(contents)
    if img is None:
        log_operation("register", name, "图片解码失败")
        return {"error": "图片解码失败"}

    # 保存注册图片
    save_path = os.path.join(RESOURCES_DIR, f"save_{name}_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg")
    cv2.imwrite(save_path, img)

    # 提取特征
    face_model = get_face_model()
    embedding = face_model.get_embedding(img)

    if embedding is None:
        log_operation("register", name, "未检测到人脸")
        return {"error": "未检测到人脸"}

    # 检查是否已存在
    if is_face_exists(name):
        log_operation("register", name, "该姓名已存在")
        return {"error": f"该姓名 '{name}' 已存在于人脸库中"}

    # 添加到人脸库
    add_face(name, embedding)
    log_operation("register", name, "注册成功")

    print(f"[注册] 姓名: {name}，已保存到人脸库")
    return {"message": f"人脸 '{name}' 注册成功"}


# ==================== 删除接口 ====================

@router.delete("/delete_face")
async def delete_face(name: str = Form(...)):
    """
    从人脸库删除指定姓名的人脸

    Args:
        name: 要删除的姓名
    """
    if not name:
        log_operation("delete", name, "姓名不能为空")
        return {"error": "姓名不能为空"}

    if not is_face_exists(name):
        log_operation("delete", name, "该姓名不存在")
        return {"error": f"人脸库中不存在 '{name}'"}

    success = remove_face(name)
    if success:
        log_operation("delete", name, "删除成功")
        print(f"[删除] 姓名: {name}，已从人脸库中删除")
        return {"message": f"'{name}' 已从人脸库中删除"}
    else:
        log_operation("delete", name, "删除失败")
        return {"error": "删除失败"}


# ==================== 查询接口 ====================

@router.get("/face_list")
def face_list():
    """返回人脸库中所有已注册的人员姓名"""
    names = get_all_faces()
    return {"names": names, "total": len(names)}


@router.get("/recognize_logs")
def get_logs(limit: int = 50):
    """
    获取识别历史记录

    Query Parameters:
        limit: 返回的记录条数，默认50条
    """
    logs = get_recognize_logs(limit)
    return {
        "logs": [
            {
                "id": row[0],
                "name": row[1],
                "similarity": row[2],
                "timestamp": row[3],
                "status": row[4]
            }
            for row in logs
        ]
    }


@router.get("/operation_logs")
def get_ops(limit: int = 50):
    """
    获取操作历史记录

    Query Parameters:
        limit: 返回的记录条数，默认50条
    """
    logs = get_operation_logs(limit)
    return {
        "logs": [
            {
                "id": row[0],
                "operation": row[1],
                "target_name": row[2],
                "result": row[3],
                "timestamp": row[4]
            }
            for row in logs
        ]
    }


@router.get("/statistics")
def statistics():
    """获取系统统计数据"""
    return get_statistics()


# ==================== 测试接口 ====================

@router.get("/recognize_test")
def recognize_test():
    """
    使用测试图片进行识别（仅开发调试用）

    测试图片固定为 resources/zxg.jpg
    """
    test_image = os.path.join(RESOURCES_DIR, "zxg.jpg")
    if not os.path.exists(test_image):
        return {"error": f"测试图片不存在: {test_image}"}

    img = cv2.imread(test_image)
    if img is None:
        return {"error": "测试图片读取失败"}

    face_model = get_face_model()
    embedding = face_model.get_embedding(img)

    if embedding is None:
        log_recognize("未检测到人脸", 0.0, "unknown")
        return {"message": "未找到人脸"}

    name, similarity = _recognize_by_embedding(embedding)
    log_recognize(name, similarity)

    print(f"[测试识别] 姓名: {name}, 相似度: {similarity}")
    return {"message": f"识别结果: 姓名:{name}, 相似度:{similarity}"}


@router.get("/health")
def health_check():
    """健康检查接口"""
    face_model = get_face_model()
    model_status = "loaded" if face_model.model else "not_loaded"
    return {
        "status": "ok",
        "model_status": model_status,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
