#!/bin/bash
# 人脸识别系统启动脚本

cd "$(dirname "$0")"

# 激活 conda base 环境
source /home/lothric/software/miniconda3/bin/activate base

echo "正在启动人脸识别系统..."

# 检查 Python 依赖
if ! pip show fastapi > /dev/null 2>&1; then
    echo "正在安装依赖..."
    pip install -r requirements.txt
fi

# 启动服务
python3 face_rec_system.py
