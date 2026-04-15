"""
人脸模型模块 - 封装 InsightFace 模型加载和特征提取
"""

import cv2
import numpy as np
import insightface
from typing import Optional, List

from config import (
    INSIGHTFACE_MODEL_NAME,
    INSIGHTFACE_MODEL_ROOT,
    INSIGHTFACE_PROVIDERS
)


class FaceModel:
    """人脸识别模型封装类"""

    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self) -> None:
        """加载 InsightFace 人脸分析模型"""
        print("正在加载人脸识别模型...")
        self.model = insightface.app.FaceAnalysis(
            name=INSIGHTFACE_MODEL_NAME,
            root=INSIGHTFACE_MODEL_ROOT,
            providers=INSIGHTFACE_PROVIDERS
        )
        self.model.prepare(ctx_id=-1)  # -1 表示 CPU，0+ 表示 GPU ID
        print("模型加载完成")

    def detect_faces(self, img: np.ndarray) -> List:
        """
        检测图片中的人脸

        Args:
            img: BGR 格式图片（OpenCV 格式）

        Returns:
            List: 检测到的人脸对象列表
        """
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        faces = self.model.get(img_rgb)
        return faces

    def get_embedding(self, img: np.ndarray) -> Optional[np.ndarray]:
        """
        提取图片中最大人脸的 512 维特征向量

        Args:
            img: BGR 格式图片

        Returns:
            512 维归一化特征向量，检测不到人脸时返回 None
        """
        faces = self.detect_faces(img)
        if len(faces) == 0:
            print("未检测到人脸")
            return None

        # 取面积最大的人脸
        largest_face = max(faces, key=lambda f: f.bbox[2] * f.bbox[3])
        embedding = largest_face.normed_embedding
        return embedding

    def get_all_embeddings(self, img: np.ndarray) -> List[np.ndarray]:
        """
        提取图片中所有检测到的人脸的特征向量

        Args:
            img: BGR 格式图片

        Returns:
            特征向量列表
        """
        faces = self.detect_faces(img)
        return [face.normed_embedding for face in faces]


# 全局单例
face_model_instance: Optional[FaceModel] = None


def get_face_model() -> FaceModel:
    """获取人脸模型单例"""
    global face_model_instance
    if face_model_instance is None:
        face_model_instance = FaceModel()
    return face_model_instance
