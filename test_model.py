"""
人脸识别系统 - 模型验证与测试脚本
"""

import os
import numpy as np
import cv2
import pickle

# 配置路径
BASE_DIR = "/mnt/d/毕业设计/FaceRecognition"
RESOURCES_DIR = os.path.join(BASE_DIR, "resources")
FACE_DB_PATH = os.path.join(BASE_DIR, "Utils", "face_database.pkl")
MODEL_ROOT = os.path.join(BASE_DIR, "Utils")
RECOGNITION_THRESHOLD = 0.6

# 加载 InsightFace
import insightface
from insightface.app import FaceAnalysis

app = FaceAnalysis(name="buffalo_l", root=MODEL_ROOT, providers=["CPUExecutionProvider"])
app.prepare(ctx_id=-1)


def load_face_database():
    if os.path.exists(FACE_DB_PATH):
        with open(FACE_DB_PATH, 'rb') as f:
            return pickle.load(f)
    return {}


def cosine_similarity(emb1, emb2):
    return float(np.dot(emb1, emb2))


def test_image(img_path, face_db, label=""):
    img = cv2.imread(img_path)
    if img is None:
        print(f"[跳过] {label}: 无法读取 {img_path}")
        return None

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    faces = app.get(img_rgb)
    if not faces:
        print(f"[跳过] {label}: 未检测到人脸")
        return None

    # 取面积最大的人脸
    face = max(faces, key=lambda f: f.bbox[2] * f.bbox[3])
    emb = face.normed_embedding

    # 与人脸库比对
    results = []
    for name, stored_emb in face_db.items():
        sim = cosine_similarity(emb, stored_emb)
        results.append((name, round(sim, 4)))
    results.sort(key=lambda x: x[1], reverse=True)

    top_name, top_sim = results[0]
    predicted = top_name if top_sim >= RECOGNITION_THRESHOLD else "未知"

    return {
        "label": label,
        "predicted": predicted,
        "top_similarity": top_sim,
        "all_results": results,
        "face_count": len(faces)
    }


def main():
    print("=" * 50)
    print("人脸识别模型验证测试")
    print("=" * 50)

    face_db = load_face_database()
    print(f"\n人脸库人数: {len(face_db)}")
    for name in face_db:
        print(f"  - {name}")

    test_images = [
        ("zxg.jpg", "张三（注册图）"),
        ("hzh.jpg", "胡姓同学（注册图）"),
        ("debug_face.jpg", "debug图（未注册）"),
        ("save_face.jpg", "save_face（未注册）"),
    ]

    print("\n测试结果：")
    print("-" * 50)

    for fname, desc in test_images:
        path = os.path.join(RESOURCES_DIR, fname)
        if not os.path.exists(path):
            print(f"[跳过] {fname} 不存在")
            continue

        result = test_image(path, face_db, desc)
        if result:
            status = "✓" if result["face_count"] > 0 else "✗"
            print(f"\n{status} {result['label']}")
            print(f"  识别结果: {result['predicted']} (相似度: {result['top_similarity']})")
            print(f"  候选: {result['all_results'][:3]}")

    print("\n" + "=" * 50)


if __name__ == '__main__':
    main()
