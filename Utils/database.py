"""
人脸数据库模块 - 负责人脸特征库的增删改查操作
"""

import os
import pickle
import sqlite3
from datetime import datetime
from typing import Dict, Optional, List, Tuple

from config import FACE_DB_PATH, DB_PATH


# ==================== 人脸特征库操作 ====================

def load_face_database() -> Dict[str, any]: # type: ignore
    """
    加载人脸特征库

    Returns:
        Dict[str, numpy.ndarray]: 键为姓名，值为512维特征向量
    """
    if os.path.exists(FACE_DB_PATH):
        with open(FACE_DB_PATH, 'rb') as f:
            face_db = pickle.load(f)
        print(f"[数据库] 成功加载人脸库，共录入 {len(face_db)} 人")
        return face_db
    else:
        print("[数据库] 人脸库不存在，创建新库")
        return {}


def save_face_database(face_db: Dict[str, any]) -> None: # type: ignore
    """
    保存人脸特征库到文件

    Args:
        face_db: 人脸数据库字典
    """
    with open(FACE_DB_PATH, 'wb') as f:
        pickle.dump(face_db, f)
    print(f"[数据库] 人脸库已保存，当前共 {len(face_db)} 人")


def add_face(name: str, embedding) -> bool:
    """
    向人脸库添加一条记录

    Args:
        name: 姓名
        embedding: 人脸特征向量

    Returns:
        bool: 是否添加成功
    """
    face_db = load_face_database()
    face_db[name] = embedding
    save_face_database(face_db)
    return True


def remove_face(name: str) -> bool:
    """
    从人脸库删除一条记录

    Args:
        name: 姓名

    Returns:
        bool: 是否删除成功
    """
    face_db = load_face_database()
    if name not in face_db:
        return False
    del face_db[name]
    save_face_database(face_db)
    return True


def get_all_faces() -> List[str]:
    """返回人脸库中所有姓名"""
    face_db = load_face_database()
    return list(face_db.keys())


def is_face_exists(name: str) -> bool:
    """检查某人是否在库中"""
    face_db = load_face_database()
    return name in face_db


# ==================== SQLite 操作日志 ====================

def init_sqlite_db() -> None:
    """初始化 SQLite 操作日志表"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 识别日志表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recognize_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            similarity REAL NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'success'
        )
    """)

    # 操作日志表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS operation_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation TEXT NOT NULL,
            target_name TEXT,
            result TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()
    print("[数据库] SQLite 日志表初始化完成")


def log_recognize(name: str, similarity: float, status: str = "success") -> None:
    """
    记录一次识别操作

    Args:
        name: 识别出的姓名
        similarity: 相似度分数
        status: 状态（success/unknown/empty/error）
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO recognize_log (name, similarity, timestamp, status) VALUES (?, ?, ?, ?)",
            (name, similarity, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), status)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[数据库] 记录识别日志失败: {e}")


def log_operation(operation: str, target_name: Optional[str], result: str) -> None:
    """
    记录一次操作（注册/删除）

    Args:
        operation: 操作类型（register/delete）
        target_name: 目标姓名
        result: 操作结果
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO operation_log (operation, target_name, result, timestamp) VALUES (?, ?, ?, ?)",
            (operation, target_name, result, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[数据库] 记录操作日志失败: {e}")


def get_recognize_logs(limit: int = 50) -> List[Tuple]:
    """
    获取最近识别日志

    Args:
        limit: 返回条数

    Returns:
        List of (id, name, similarity, timestamp, status)
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, similarity, timestamp, status FROM recognize_log ORDER BY id DESC LIMIT ?",
        (limit,)
    )
    result = cursor.fetchall()
    conn.close()
    return result


def get_operation_logs(limit: int = 50) -> List[Tuple]:
    """
    获取最近操作日志

    Args:
        limit: 返回条数

    Returns:
        List of (id, operation, target_name, result, timestamp)
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, operation, target_name, result, timestamp FROM operation_log ORDER BY id DESC LIMIT ?",
        (limit,)
    )
    result = cursor.fetchall()
    conn.close()
    return result


def get_statistics() -> Dict:
    """
    获取统计数据

    Returns:
        Dict: 包含识别次数、各人物识别频率等统计信息
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 总识别次数
    cursor.execute("SELECT COUNT(*) FROM recognize_log WHERE status='success'")
    total_recognitions = cursor.fetchone()[0]

    # 总注册人数
    cursor.execute("SELECT COUNT(*) FROM recognize_log WHERE status='success' AND name != '未知'")
    total_identified = cursor.fetchone()[0]

    # 各人物识别频率
    cursor.execute(
        "SELECT name, COUNT(*) as cnt FROM recognize_log WHERE status='success' AND name != '未知' GROUP BY name ORDER BY cnt DESC LIMIT 10"
    )
    top_persons = cursor.fetchall()

    # 今日识别次数
    cursor.execute(
        "SELECT COUNT(*) FROM recognize_log WHERE date(timestamp) = date('now') AND status='success'"
    )
    today_count = cursor.fetchone()[0]

    conn.close()

    return {
        "total_recognitions": total_recognitions,
        "total_identified": total_identified,
        "top_persons": [{"name": n, "count": c} for n, c in top_persons],
        "today_count": today_count
    }


# 初始化数据库
init_sqlite_db()
